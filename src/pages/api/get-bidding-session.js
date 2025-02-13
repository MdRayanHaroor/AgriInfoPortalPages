import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inputId } = req.query;

  if (!inputId) {
    return res.status(400).json({ error: "Missing inputId parameter" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");

    // Find the ongoing bidding session for the given inputId
    const biddingSession = await db.collection("bids").findOne({
      inputId: inputId,
      status: "ongoing",
    });

    if (!biddingSession) {
      return res
        .status(404)
        .json({ error: "No ongoing bidding session found for this crop input." });
    }

    res.status(200).json(biddingSession);
  } catch (error) {
    console.error("Error fetching bidding session:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
