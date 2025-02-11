// /src/pages/api/get-ongoing-bids.js
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const now = new Date();

    const ongoingBids = await db.collection("bids").aggregate([
      {
        $match: {
          status: "ongoing",
          endTime: { $gt: now }
        }
      },
      // Convert inputId (a string) to an ObjectId for matching.
      {
        $addFields: {
          convertedInputId: { $toObjectId: "$inputId" }
        }
      },
      {
        $lookup: {
          from: "userInputs", // Ensure this exactly matches your collection name
          localField: "convertedInputId",
          foreignField: "_id",
          as: "cropDetails"
        }
      },
      {
        $unwind: "$cropDetails"
      },
      {
        $project: {
          "cropDetails.fruitVegetable": 1,
          "cropDetails.district": 1,
          "cropDetails.village": 1,
          "cropDetails.area": 1,
          minimumBid: 1,
          startTime: 1,
          endTime: 1,
          bids: { $size: "$bids" }
        }
      }
    ]).toArray();

    res.status(200).json(ongoingBids);
  } catch (error) {
    console.error("Fetch ongoing bids error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
