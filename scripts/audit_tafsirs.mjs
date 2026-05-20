#!/usr/bin/env node

/**
 * Comprehensive Tafsir Audit Script
 * Discovers all available tafsirs from Quran Foundation SDK
 * Tests each one against sample verses
 * Reports availability, language, and functionality status
 *
 * Usage:
 *   node audit_tafsirs.mjs [clientId] [clientSecret]
 *   OR set QF_CLIENT_ID and QF_CLIENT_SECRET env vars
 */

import { createServerClient } from "@quranjs/api/server";

const PRELIVE = {
  authBaseUrl: "https://prelive-oauth2.quran.foundation",
  apiBaseUrl: "https://apis-prelive.quran.foundation",
};

const PRODUCTION = {
  authBaseUrl: "https://oauth2.quran.foundation",
  apiBaseUrl: "https://apis.quran.foundation",
};

// Get credentials from args or env
let QF_CLIENT_ID = process.argv[2] || process.env.QF_CLIENT_ID;
let QF_CLIENT_SECRET = process.argv[3] || process.env.QF_CLIENT_SECRET;
let QF_ENV = (process.env.QF_ENV || "prelive").toLowerCase();

// Choose environment
const envConfig = QF_ENV === "production" ? PRODUCTION : PRELIVE;

if (!QF_CLIENT_ID || !QF_CLIENT_SECRET) {
  console.error("\n❌ Missing Quran Foundation API credentials\n");
  console.error("Set credentials one of these ways:\n");
  console.error("1. Environment variables:");
  console.error("   export QF_CLIENT_ID=your_client_id");
  console.error("   export QF_CLIENT_SECRET=your_client_secret\n");
  console.error("2. Command line arguments:");
  console.error("   node audit_tafsirs.mjs your_client_id your_client_secret\n");
  console.error("3. .env.local file in project root");
  console.error("   QF_CLIENT_ID=...");
  console.error("   QF_CLIENT_SECRET=...\n");
  console.error("Request access at: https://api-docs.quran.foundation/request-access\n");
  process.exit(1);
}

// Initialize SDK client
const client = createServerClient({
  clientId: QF_CLIENT_ID,
  clientSecret: QF_CLIENT_SECRET,
  services: {
    oauth2BaseUrl: envConfig.authBaseUrl.replace(/\/$/, ""),
    tokenHost: envConfig.authBaseUrl.replace(/\/$/, ""),
    gatewayUrl: envConfig.apiBaseUrl.replace(/\/$/, ""),
  },
});

const SEARCH_KEYWORDS = [
  "ibn kathir",
  "tazkirul",
  "maarif",
  "mufti taqi",
  "bayan ul quran",
];

const TEST_VERSES = [
  "1:1",    // Al-Fatihah - Ayah 1
  "2:255",  // Al-Baqarah - Ayah 255 (Ayat al-Kursi)
  "3:159",  // Aal-Imran
  "114:1",  // Al-Nas
];

async function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
}

async function auditTafsirs() {
  console.log("\n📚 QURAN FOUNDATION TAFSIR AUDIT\n");
  console.log("Environment:", QF_ENV === "production" ? "🌐 PRODUCTION" : "🧪 PRELIVE (Development)");
  console.log("API Base URL:", envConfig.apiBaseUrl);
  console.log("Auth Base URL:", envConfig.authBaseUrl);
  console.log("=".repeat(80));

  try {
    // Fetch all tafsirs
    console.log("\n🔍 Fetching all available tafsirs...\n");
    const tafsirs = await withTimeout(
      client.content.v4.resources.tafsirs.list(),
      10000
    );

    if (!Array.isArray(tafsirs) || tafsirs.length === 0) {
      console.error("❌ No tafsirs found or invalid response");
      return;
    }

    console.log(`✅ Found ${tafsirs.length} total tafsirs\n`);

    // Normalize and filter tafsirs
    const tafsirList = tafsirs
      .map((t) => ({
        id: t.id,
        slug: t.slug || "N/A",
        name: t.name || "Unknown",
        language: t.languageName || t.language_name || t.language || "Unknown",
        author: t.author || t.authorName || "Unknown",
        languageCode: t.languageCode || t.language_code || "unknown",
      }))
      .sort((a, b) => String(a.name).localeCompare(b.name));

    // Display all tafsirs
    console.log("📋 ALL AVAILABLE TAFSIRS:");
    console.log("-".repeat(80));
    tafsirList.forEach((t, i) => {
      console.log(`${(i + 1).toString().padStart(3)}. [ID: ${String(t.id).padEnd(3)}] ${t.name}`);
      console.log(`     Slug: ${t.slug}`);
      console.log(`     Language: ${t.language}`);
      console.log(`     Author: ${t.author}`);
      console.log("");
    });

    // Find target tafsirs
    console.log("\n" + "=".repeat(80));
    console.log("🎯 SEARCHING FOR TARGET TAFSIRS\n");

    const targetTafsirs = {};
    SEARCH_KEYWORDS.forEach((keyword) => {
      const matches = tafsirList.filter(
        (t) =>
          String(t.name).toLowerCase().includes(keyword) ||
          String(t.slug).toLowerCase().includes(keyword) ||
          String(t.author).toLowerCase().includes(keyword)
      );
      if (matches.length > 0) {
        targetTafsirs[keyword] = matches;
      }
    });

    // Display target matches
    Object.entries(targetTafsirs).forEach(([keyword, matches]) => {
      console.log(`\n🔎 "${keyword}"`);
      matches.forEach((t) => {
        console.log(`  ✓ ID: ${t.id} | Name: ${t.name} | Language: ${t.language}`);
      });
    });

    // Test tafsir functionality
    console.log("\n" + "=".repeat(80));
    console.log("⚙️  FUNCTIONALITY TEST (Testing top 10 tafsirs against sample verses)\n");

    const topTafsirs = tafsirList.slice(0, 10);
    const testResults = {};

    for (const tafsir of topTafsirs) {
      console.log(`\n🧪 Testing ID ${tafsir.id}: ${tafsir.name}`);
      console.log("-".repeat(80));

      const results = [];
      let successCount = 0;
      let timeoutCount = 0;
      let errorCount = 0;

      for (const verseKey of TEST_VERSES) {
        try {
          const verse = await withTimeout(
            client.content.v4.verses.byKey(verseKey, {
              tafsirs: [tafsir.id],
              translations: [13], // English Sahih International
              words: false,
            }),
            5000
          );

          if (verse?.tafsirs?.[0]?.text) {
            const textLength = verse.tafsirs[0].text.length;
            console.log(
              `  ✅ ${verseKey.padEnd(6)} - ${textLength} chars | ${verse.tafsirs[0].text.substring(0, 60).replace(/<[^>]*>/g, "")}...`
            );
            successCount++;
            results.push({ verse: verseKey, status: "success", textLength });
          } else {
            console.log(`  ⚠️  ${verseKey.padEnd(6)} - No text returned`);
            results.push({ verse: verseKey, status: "no_text" });
            errorCount++;
          }
        } catch (err) {
          if (err.message.includes("timeout")) {
            console.log(`  ⏱️  ${verseKey.padEnd(6)} - Timeout`);
            results.push({ verse: verseKey, status: "timeout" });
            timeoutCount++;
          } else {
            console.log(`  ❌ ${verseKey.padEnd(6)} - ${err.message}`);
            results.push({ verse: verseKey, status: "error", error: err.message });
            errorCount++;
          }
        }
      }

      testResults[tafsir.id] = {
        name: tafsir.name,
        slug: tafsir.slug,
        language: tafsir.language,
        successCount,
        timeoutCount,
        errorCount,
        results,
      };

      const passRate = Math.round((successCount / TEST_VERSES.length) * 100);
      console.log(
        `\n  📊 Pass Rate: ${passRate}% (${successCount}/${TEST_VERSES.length} verses)`
      );
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST SUMMARY\n");

    const sortedResults = Object.entries(testResults)
      .sort(([, a], [, b]) => b.successCount - a.successCount)
      .slice(0, 10);

    sortedResults.forEach(([id, result], i) => {
      const passRate = Math.round((result.successCount / TEST_VERSES.length) * 100);
      const status =
        passRate === 100 ? "✅" : passRate >= 75 ? "⚠️" : "❌";
      console.log(
        `${status} ${(i + 1).toString().padStart(2)}. [ID: ${String(id).padEnd(3)}] ${result.name.padEnd(40)} ${passRate}% (${result.successCount}/${TEST_VERSES.length})`
      );
    });

    // Recommendations
    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMMENDATIONS\n");

    const workingTafsirs = Object.entries(testResults)
      .filter(([, result]) => result.successCount === TEST_VERSES.length)
      .map(([id, result]) => ({ id, name: result.name, language: result.language }));

    if (workingTafsirs.length > 0) {
      console.log("✅ Fully functional tafsirs (100% test pass rate):");
      workingTafsirs.forEach((t) => {
        console.log(`  - [${t.id}] ${t.name} (${t.language})`);
      });
    }

    const englishTafsirs = tafsirList.filter((t) =>
      /english|en-/i.test(t.language)
    );
    console.log(`\n📚 All English tafsirs (${englishTafsirs.length} available):`);
    englishTafsirs.forEach((t) => {
      const tested = testResults[t.id];
      const status = tested
        ? `${tested.successCount}/${TEST_VERSES.length} tests passed`
        : "Not tested";
      console.log(`  - [${t.id}] ${t.name} | ${status}`);
    });

    // Check for specific tafsirs mentioned by user
    console.log("\n🎯 SPECIFIC TAFSIR SEARCH:");
    const specificSearches = {
      "Mufti Taqi Usmani": [
        "mufti taqi",
        "taqi usmani",
        "maarif ul quran",
      ],
      "Ibn Kathir": ["ibn kathir", "tafisr-ibn-kathir"],
      "Tazkirul Quran": ["tazkirul", "tafsir-bayan-ul-quran"],
      "Bayan ul Quran": ["bayan", "bayan ul quran"],
    };

    Object.entries(specificSearches).forEach(([tafsirName, searchTerms]) => {
      const matches = tafsirList.filter((t) =>
        searchTerms.some(
          (term) =>
            String(t.name).toLowerCase().includes(term) ||
            String(t.slug).toLowerCase().includes(term) ||
            String(t.author).toLowerCase().includes(term)
        )
      );

      if (matches.length > 0) {
        console.log(`\n  ✅ ${tafsirName}:`);
        matches.forEach((m) => {
          console.log(`     [ID: ${m.id}] ${m.name}`);
        });
      } else {
        console.log(`\n  ❌ ${tafsirName}: Not found`);
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n✨ Audit complete!\n");

  } catch (error) {
    console.error("\n❌ Audit failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the audit
auditTafsirs().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
