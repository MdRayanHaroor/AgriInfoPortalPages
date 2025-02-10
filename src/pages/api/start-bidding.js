import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inputId, minimumBid, harvestingMonth } = req.body;

  if (!inputId || !minimumBid || !harvestingMonth) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Extract year and month from harvestingMonth (assumed format: "YYYY-MM")
    const [year, month] = harvestingMonth.split("-");
    if (!year || !month) {
      return res.status(400).json({ error: "Invalid harvestingMonth format" });
    }

    // Calculate the last day of the given month.
    // In JavaScript, using day 0 returns the last day of the previous month,
    // so here new Date(Number(year), Number(month), 0) gives the last day of the desired month.
    const endDate = new Date(Number(year), Number(month), 0);
    const startTime = new Date();

    const biddingSession = {
      inputId,                // Reference to the crop input
      minimumBid,             // Minimum acceptable bid
      startTime,              // When bidding starts (now)
      endTime: endDate,       // Computed bidding end time based on harvestingMonth
      status: "ongoing",      // Current status of the bidding session
      bids: []                // Empty array to store future bids
    };

    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const result = await db.collection("bids").insertOne(biddingSession);

    res.status(201).json({ message: "Bidding session started", biddingId: result.insertedId });
  } catch (error) {
    console.error("Start bidding error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
