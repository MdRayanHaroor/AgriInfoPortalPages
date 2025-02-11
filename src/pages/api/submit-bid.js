// pages/api/submit-bid.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Accept either 'biddingId' or 'id'
  const { biddingId, id, traderName, traderEmail, bidPerAcre } = req.body;
  const finalBiddingId = biddingId || id;

  // Remove traderName and traderEmail from the required-fields check.
  if (!finalBiddingId || bidPerAcre === undefined || bidPerAcre === null) {
    return res.status(400).json({
      error: "Missing required fields",
      fields: { biddingId: finalBiddingId, bidPerAcre }
    });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");

    // Find the bidding session by ID
    const biddingSession = await db.collection("bids").findOne({ _id: new ObjectId(finalBiddingId) });
    if (!biddingSession) {
      return res.status(404).json({ error: "Bidding session not found" });
    }

    const now = new Date();
    // Check if bidding has already ended
    if (now > new Date(biddingSession.endTime)) {
      return res.status(400).json({ error: "Bidding session has ended" });
    }

    // Create the new bid object
    const newBid = {
      traderName: traderName || "", // Use the value passed in or default to empty string
      traderEmail: traderEmail || "",
      bidPerAcre,
      bidTime: now,
    };

    // Update the bidding session by pushing the new bid into the bids array
    const updateResult = await db.collection("bids").updateOne(
      { _id: new ObjectId(finalBiddingId) },
      { $push: { bids: newBid } }
    );

    if (updateResult.modifiedCount > 0) {
      return res.status(200).json({ message: "Bid submitted successfully", bid: newBid });
    } else {
      return res.status(400).json({ error: "Failed to submit bid" });
    }
  } catch (error) {
    console.error("Submit bid error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
