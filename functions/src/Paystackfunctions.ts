import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET_KEY");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ─── CORS helper ──────────────────────────────────────────────────────────────
function setCors(res: any) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Ticket code generator ────────────────────────────────────────────────────
function generateTicketCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return (
    "SC-" +
    Array.from({ length: 3 }, () =>
      Array.from(
        { length: 4 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("")
    ).join("-")
  );
}

// ─── Verify a Paystack transaction (popup flow) and fulfill the ticket ───────
// The frontend passes all order details as `metadata` when it initializes the
// Paystack popup, so Paystack hands them straight back to us in the verify
// response. No pendingOrders collection, no DVA, no card handling needed.
export const verifyAndFulfillPayment = onRequest(
  { secrets: [PAYSTACK_SECRET] },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { reference, expectedAmount } = req.body;
    if (!reference) {
      res.status(400).json({ error: "Missing reference" });
      return;
    }

    try {
      // Idempotency: if we've already fulfilled this reference, just return it
      const usedRef = db.collection("usedPaymentReferences").doc(reference);
      const usedSnap = await usedRef.get();
      if (usedSnap.exists) {
        const used = usedSnap.data()!;
        res.json({ success: true, alreadyFulfilled: true, ticketCode: used.ticketCode });
        return;
      }

      // Verify with Paystack — this is the source of truth, never trust the client
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET.value()}` } }
      );
      const verifyData: any = await verifyRes.json();

      if (!verifyData.status || verifyData.data?.status !== "success") {
        res.status(400).json({
          success: false,
          message: verifyData.message || "Payment not successful",
        });
        return;
      }

      const tx = verifyData.data;
      const meta = tx.metadata || {};

      const {
        eventId,
        ticketTypeId,
        ticketType,
        ticketColor,
        quantity,
        attendeeName,
        attendeeEmail,
        phone,
        altPhone,
        eventName,
        eventDate,
        eventTime,
        venueName,
        venueAddress,
        organizerEmail,
      } = meta;

      if (!eventId || !ticketTypeId || !attendeeEmail) {
        res.status(400).json({ success: false, message: "Missing order metadata on transaction" });
        return;
      }

      // Amount check (use server-known expected amount if provided, in Naira)
      const paidKobo = tx.amount;
      const expectedKobo = Math.round(Number(expectedAmount || 0) * 100);
      if (expectedKobo && paidKobo < expectedKobo) {
        res.status(400).json({
          success: false,
          message: `Amount paid (₦${paidKobo / 100}) does not match expected (₦${expectedAmount})`,
        });
        return;
      }

      const qty = Number(quantity) || 1;
      const ticketCode = generateTicketCode();

      await db
        .collection("events")
        .doc(eventId)
        .collection("attendees")
        .add({
          name: attendeeName || "",
          email: attendeeEmail,
          phone: phone || "",
          altPhone: altPhone || "",
          ticketType: ticketType || "",
          ticketTypeId,
          ticketColor: ticketColor || "",
          ticketCode,
          quantity: qty,
          totalPaid: paidKobo / 100,
          paymentMethod: tx.channel || "paystack",
          paymentReference: reference,
          eventName: eventName || "",
          eventDate: eventDate || "",
          eventVenue: venueName || "",
          checkedIn: false,
          purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      await db
        .collection("events")
        .doc(eventId)
        .collection("tickets")
        .doc(ticketTypeId)
        .update({
          sold: admin.firestore.FieldValue.increment(qty),
        });

      await usedRef.set({
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        eventId,
        attendeeEmail,
        ticketCode,
      });

      // Fire-and-forget confirmation email
      fetch(
        "https://us-central1-stagecheck-699c7.cloudfunctions.net/sendTicketConfirmation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendeeName,
            attendeeEmail,
            phone,
            ticketCode,
            ticketType,
            ticketQty: qty,
            eventName,
            eventDate,
            eventTime: eventTime || "",
            venueName: venueName || "",
            venueAddress: venueAddress || "",
            organizerEmail: organizerEmail || "",
          }),
        }
      ).catch((e) => console.error("Ticket email failed:", e));

      res.json({ success: true, alreadyFulfilled: false, ticketCode, reference });
    } catch (e: any) {
      console.error("verifyAndFulfillPayment error:", e);
      res.status(500).json({ error: "Internal server error", message: e.message });
    }
  }
);