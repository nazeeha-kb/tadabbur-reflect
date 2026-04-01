"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

const steps = [
  {
    step: "Step 1",
    icon: "✏️",
    title: "Type your emotion",
    body: "Share what weighs on your heart. The application listens and gently guides you.",
    tone: "#eaf2f3",
  },
  {
    step: "Step 2",
    icon: "📖",
    title: "Read curated ayahs",
    body: "Receive meaningful Quran verses with translation and brief tafseer.",
    tone: "#f9f1ea",
  },
  {
    step: "Step 3",
    icon: "💾",
    title: "Reflect and write",
    body: "Capture your thoughts and return to your spiritual journey anytime.",
    tone: "#eef1ee",
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

  return (
    <div className="win-desktop" style={{ minHeight: "100vh", padding: "12px" }}>
      {/* Main "window" */}
      <div
        className="win-window"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          background: "#d4d0c8",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderBottom: "2px solid #404040",
          borderRight: "2px solid #404040",
        }}
      >
        {/* Title bar */}
        <div className="win-titlebar">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              background: "#ffcc00",
              border: "1px solid #808080",
              fontWeight: "bold",
              fontSize: 9,
              color: "#000080",
              flexShrink: 0,
            }}
          >
            Q
          </span>
          <span style={{ flex: 1 }}>Quran Reflect — Home — Microsoft Internet Explorer</span>
          {/* Window chrome buttons */}
          <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            <span className="win-titlebar-btn">_</span>
            <span className="win-titlebar-btn">□</span>
            <span
              className="win-titlebar-btn"
              style={{ background: "#cc0000", color: "#fff", fontWeight: "bold" }}
            >
              ✕
            </span>
          </div>
        </div>

        {/* Browser chrome */}
        <SiteHeader />

        {/* Page content area */}
        <div
          style={{
            background: "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderBottom: "2px solid #dfdfdf",
            borderRight: "2px solid #dfdfdf",
            margin: "4px",
            padding: "16px 20px 24px",
          }}
        >
          {/* Hero section */}
          <section style={{ textAlign: "center", paddingBottom: 20, borderBottom: "1px solid #d0d0d0" }}>
            {/* Flashing "new" badge replica */}
            <p
              style={{
                display: "inline-block",
                background: "#000080",
                color: "#ffff00",
                fontSize: 10,
                fontWeight: "bold",
                letterSpacing: "0.15em",
                padding: "2px 10px",
                marginBottom: 10,
                textTransform: "uppercase",
                border: "1px solid #ffff00",
              }}
            >
              ★ A Sanctuary For The Soul ★
            </p>

            <h1
              style={{
                fontFamily: "MS Sans Serif, Arial, sans-serif",
                fontSize: 28,
                fontWeight: "bold",
                color: "#000080",
                margin: "8px 0",
                lineHeight: 1.2,
              }}
            >
              Find solace in{" "}
              <span style={{ color: "#c05800" }}>
                His words.
              </span>
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#444",
                maxWidth: 480,
                margin: "6px auto 16px",
                lineHeight: 1.6,
              }}
            >
              Explore divine guidance tailored to your emotions and life&apos;s present journey.
            </p>

            {/* Emotion input — styled as a dialog */}
            <div
              style={{
                display: "inline-block",
                width: "100%",
                maxWidth: 560,
                textAlign: "left",
              }}
            >
              {/* Dialog title bar */}
              <div
                className="win-titlebar"
                style={{ borderRadius: 0, fontSize: 11, padding: "2px 6px" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: 14,
                    height: 14,
                    background: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "#000080",
                    fontWeight: "bold",
                    flexShrink: 0,
                    border: "1px solid #808080",
                  }}
                >
                  ?
                </span>
                Reflect.exe — Enter Your Emotion
              </div>
              <div
                style={{
                  background: "#d4d0c8",
                  borderTop: "none",
                  borderLeft: "2px solid #dfdfdf",
                  borderRight: "2px solid #808080",
                  borderBottom: "2px solid #808080",
                  padding: "12px 14px 14px",
                }}
              >
                <p style={{ fontSize: 11, marginBottom: 8, color: "#000" }}>
                  What is on your heart today?
                </p>
                <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6 }}>
                  <label htmlFor="emotion" className="sr-only">
                    Describe how you feel
                  </label>
                  <input
                    id="emotion"
                    name="emotion"
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    placeholder="Type here..."
                    className="win-input"
                    style={{ flex: 1, height: 28 }}
                    required
                  />
                  <button
                    type="submit"
                    className="win-btn win-btn-default"
                    style={{ height: 28, minWidth: 80 }}
                  >
                    Reflect
                  </button>
                </form>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button type="button" className="win-btn" style={{ height: 24, fontSize: 10 }}>
                    Cancel
                  </button>
                  <button type="button" className="win-btn" style={{ height: 24, fontSize: 10 }}>
                    Help
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* How it Works section */}
          <section style={{ marginTop: 20 }}>
            <h2
              style={{
                fontFamily: "MS Sans Serif, Arial, sans-serif",
                fontSize: 16,
                fontWeight: "bold",
                color: "#000080",
                marginBottom: 4,
              }}
            >
              How It Works
            </h2>
            <p style={{ fontSize: 11, color: "#444", marginBottom: 14 }}>
              A simple three-step journey to find clarity and peace through divine wisdom.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {steps.map((item) => (
                <article
                  key={item.step}
                  className="win-step-card"
                  style={{ background: item.tone }}
                >
                  {/* Step header */}
                  <div
                    style={{
                      background: "#000080",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: "bold",
                      padding: "2px 6px",
                      marginBottom: 8,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {item.icon} {item.step}
                  </div>
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: "#000080",
                      marginBottom: 6,
                      fontFamily: "MS Sans Serif, Arial, sans-serif",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 11, color: "#333", lineHeight: 1.6 }}>
                    {item.body}
                  </p>
                </article>
              ))}
            </div>

            {/* Horizontal rule / divider */}
            <div style={{ marginTop: 20, borderTop: "1px solid #808080", borderBottom: "1px solid #dfdfdf" }} />

            {/* Footer note */}
            <p
              style={{
                marginTop: 10,
                fontSize: 10,
                color: "#444",
                textAlign: "center",
              }}
            >
              © 2000 Quran Reflect Inc. All rights reserved. &nbsp;|&nbsp; Best viewed in 800×600 &nbsp;|&nbsp; Internet Explorer 5.5
            </p>
          </section>
        </div>

        {/* Status bar */}
        <div className="win-statusbar">
          <span className="win-statusbar-panel">Done</span>
          <span
            style={{
              fontSize: 10,
              padding: "0 6px",
              borderTop: "1px solid #808080",
              borderLeft: "1px solid #808080",
              borderBottom: "1px solid #dfdfdf",
              borderRight: "1px solid #dfdfdf",
              whiteSpace: "nowrap",
            }}
          >
            ✔ No errors on page
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "0 6px",
              borderTop: "1px solid #808080",
              borderLeft: "1px solid #808080",
              borderBottom: "1px solid #dfdfdf",
              borderRight: "1px solid #dfdfdf",
              whiteSpace: "nowrap",
              color: "#000080",
            }}
          >
            🌐 Internet
          </span>
        </div>
      </div>
    </div>
  );
}
