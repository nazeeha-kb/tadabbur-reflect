"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  const [emotion, setEmotion] = useState("");
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = emotion.trim();
    if (!trimmed) return;
    router.push(`/reflect?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-16 pt-6 sm:px-6">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <p className="rounded-full bg-[var(--peach-soft)] px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[var(--peach)] uppercase">
            A Sanctuary For The Soul
          </p>
          <h1 className="mt-6 text-5xl leading-none text-[var(--teal)] sm:text-7xl">
            Find solace in <span className="italic text-[var(--peach)]">His words.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
            Explore divine guidance tailored to your emotions and life&apos;s present journey.
          </p>

          <form onSubmit={handleSubmit} className="surface-card mt-10 flex w-full max-w-2xl items-center gap-3 p-2">
            <label htmlFor="emotion" className="sr-only">
              Describe how you feel
            </label>
            <input
              id="emotion"
              name="emotion"
              value={emotion}
              onChange={(event) => setEmotion(event.target.value)}
              placeholder="What is on your heart today?"
              className="focus-ring h-12 flex-1 rounded-lg border border-transparent bg-transparent px-4 text-sm text-slate-800 placeholder:text-slate-400"
              required
            />
            <button
              type="submit"
              className="h-12 rounded-xl bg-[var(--peach)] px-6 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring"
            >
              Reflect
            </button>
          </form>
        </section>

        <section className="text-center">
          <h2 className="text-4xl text-[var(--teal)] sm:text-5xl">How it Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
            A simple three-step journey to find clarity and peace through divine wisdom.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: "Step 01",
                title: "Type your emotion",
                body: "Share what weighs on your heart. The app listens and gently guides you.",
                tone: "bg-[#eaf2f3]",
              },
              {
                step: "Step 02",
                title: "Read curated ayahs",
                body: "Receive meaningful Quran verses with translation and brief tafseer.",
                tone: "bg-[#f9f1ea]",
              },
              {
                step: "Step 03",
                title: "Reflect and write",
                body: "Capture your thoughts and return to your spiritual journey anytime.",
                tone: "bg-[#eef1ee]",
              },
            ].map((item) => (
              <article key={item.step} className={`surface-card rounded-3xl p-7 text-left ${item.tone}`}>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">{item.step}</p>
                <h3 className="mt-4 text-3xl text-[var(--teal)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
