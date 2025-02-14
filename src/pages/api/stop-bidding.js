import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { biddingId } = req.body;
  if (!biddingId) {
    return res.status(400).json({ error: "Missing required field: biddingId" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");

    // Update the bidding session: set status to "stopped" and clear all bids.
    const result = await db.collection("bids").updateOne(
      { _id: new ObjectId(biddingId) },
      { $set: { status: "stopped", bids: [] } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: "Bidding session stopped successfully" });
    } else {
      return res.status(400).json({ error: "Failed to stop bidding session" });
    }
  } catch (error) {
    console.error("Error stopping bidding session:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
