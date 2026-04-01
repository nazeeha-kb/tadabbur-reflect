import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Reflections" },
];

export default function SiteHeader() {
  return (
    <header>
      {/* Menu bar */}
      <div className="win-menubar">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="win-menu-item">
            {item.label}
          </Link>
        ))}
        <span className="win-menu-item">Help</span>
      </div>

      {/* Toolbar */}
      <div className="win-toolbar">
        <button className="win-toolbar-btn" title="Back">
          <span style={{ fontSize: 10 }}>◄</span> Back
        </button>
        <button className="win-toolbar-btn" title="Forward">
          Forward <span style={{ fontSize: 10 }}>►</span>
        </button>
        <div className="win-toolbar-separator" />
        <button className="win-toolbar-btn" title="Refresh">
          ↺ Refresh
        </button>
        <button className="win-toolbar-btn" title="Home">
          🏠 Home
        </button>
        <div className="win-toolbar-separator" />
        {/* Address bar */}
        <span style={{ fontSize: 11, marginLeft: 6, marginRight: 4, color: "#000", fontFamily: "MS Sans Serif, Arial, sans-serif" }}>
          Address:
        </span>
        <div style={{
          flex: 1,
          background: "#fff",
          borderTop: "2px solid #808080",
          borderLeft: "2px solid #808080",
          borderBottom: "2px solid #dfdfdf",
          borderRight: "2px solid #dfdfdf",
          padding: "1px 4px",
          fontSize: 11,
          fontFamily: "MS Sans Serif, Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 4,
          maxWidth: 340,
        }}>
          <span style={{ color: "#000080" }}>🌐</span>
          <span>quranreflect://home</span>
        </div>
        <button className="win-toolbar-btn" title="Go" style={{ marginLeft: 2 }}>
          Go ►
        </button>
        <div className="win-toolbar-separator" />
        <span style={{ fontSize: 11, fontWeight: "bold", color: "#000080", fontFamily: "MS Sans Serif, Arial, sans-serif" }}>
          Q Quran Reflect
        </span>
      </div>

      {/* Marquee / scrolling ticker */}
      <div className="win-marquee" style={{ fontSize: 10, color: "#000080" }}>
        <span>
          ★ Welcome to Quran Reflect v1.0 ★ &nbsp;&nbsp;&nbsp; Find solace in His words &nbsp;&nbsp;&nbsp; ✦ New feature: save your reflections! ✦ &nbsp;&nbsp;&nbsp; Type your emotion and receive divine guidance &nbsp;&nbsp;&nbsp; ★ Best viewed in 800×600 resolution ★
        </span>
      </div>
    </header>
  );
}
