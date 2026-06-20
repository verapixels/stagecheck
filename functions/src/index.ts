import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";

export { sendEventMessage } from './Sendeventmessage'
export { sendSubmissionEmails } from './Sendsubmissionemails'
export { sendTicketConfirmation } from './SendTicketConfirmation'
export { verifyAndFulfillPayment } from './Paystackfunctions'

export const searchDeezerArtists = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const q = req.query.q as string;
  const limit = (req.query.limit as string) || "8";
  if (!q) { res.status(400).json({ error: "Missing query param: q" }); return; }

  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch from Deezer" });
  }
});

export const searchKnowledgeGraph = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const q = req.query.q as string;
  const limit = (req.query.limit as string) || "8";
  if (!q) { res.status(400).json({ error: "Missing query param: q" }); return; }

  const API_KEY = process.env.KNOWLEDGE_GRAPH_KEY;
  if (!API_KEY) { res.status(500).json({ error: "API key not configured" }); return; }

  try {
    const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(q)}&key=${API_KEY}&limit=${limit}&indent=True`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch from Knowledge Graph" });
  }
});