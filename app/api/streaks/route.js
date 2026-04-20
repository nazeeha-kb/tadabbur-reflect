import { NextResponse } from "next/server";
import { getStoredTokens, updateStoredTokens } from "@/lib/auth/qfPkceAuth";
import { createQfApiClient } from "@/lib/api/qfApiClient";

/**
 * GET /api/streaks - Fetch user streaks from Quran Foundation User API.
 * Requires user to be authenticated with QF.
 */
export async function GET() {
  try {
    const { accessToken, refreshToken } = await getStoredTokens();
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated with Quran Foundation" }, { status: 401 });
    }

    const client = createQfApiClient({
      accessToken,
      refreshToken,
      onTokensUpdate: async (newTokens) => {
        await updateStoredTokens(newTokens);
      },
      isConfidential: true, // Adjust based on your client type
    });

    // Assuming the endpoint is GET /auth/v1/streaks
    // Adjust based on actual API docs
    const response = await client.fetch("/streaks");

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch streaks" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}