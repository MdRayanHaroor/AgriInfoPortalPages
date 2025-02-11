import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { biddingId, traderEmail, oldBidPerAcre, bidPerAcre } = req.body;

  // Ensure all required fields are provided
  if (!biddingId || !traderEmail || bidPerAcre === undefined || bidPerAcre === null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");

    // Find the bidding session
    const biddingSession = await db.collection("bids").findOne({ _id: new ObjectId(biddingId) });
    if (!biddingSession) {
      return res.status(404).json({ error: "Bidding session not found" });
    }

    // Use `traderEmail` and `oldBidPerAcre` to find the correct bid inside the array
    const updateResult = await db.collection("bids").updateOne(
      {
        _id: new ObjectId(biddingId),
        "bids.traderEmail": traderEmail, // Identify bid by trader email
        "bids.bidPerAcre": oldBidPerAcre, // Identify by previous bid amount
      },
      {
        $set: { "bids.$.bidPerAcre": bidPerAcre }, // Update the bid amount
      }
    );

    if (updateResult.modifiedCount > 0) {
      return res.status(200).json({ message: "Bid updated successfully" });
    } else {
      return res.status(400).json({ error: "Bid update failed or no changes detected" });
    }
  } catch (error) {
    console.error("Update bid error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
