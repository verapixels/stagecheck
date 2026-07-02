// functions/src/searchSpotifyArtists.ts

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";

// These names must match exactly what you set with:
//   firebase functions:secrets:set SPOTIFY_CLIENT_ID
//   firebase functions:secrets:set SPOTIFY_CLIENT_SECRET
const SPOTIFY_CLIENT_ID = defineSecret("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = defineSecret("SPOTIFY_CLIENT_SECRET");

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Spotify token");

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min early
  };
  return cachedToken.token;
}

export const searchSpotifyArtists = onRequest(
  { secrets: [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET] },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const q = (req.query.q as string) || "";
    const limit = Math.min(parseInt((req.query.limit as string) || "8"), 20);
    if (!q.trim()) {
      res.json({ artists: { items: [] } });
      return;
    }

    try {
      const token = await getSpotifyToken(
        SPOTIFY_CLIENT_ID.value(),
        SPOTIFY_CLIENT_SECRET.value()
      );
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await searchRes.json();
      res.json(data);
    } catch (err) {
      console.error("Spotify search error:", err);
      res.status(500).json({ error: "Spotify search failed" });
    }
  }
);