// pages/api/get-bid.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bidId } = req.query;
  if (!bidId) {
    return res.status(400).json({ error: "Missing bidId parameter" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");

    // Use aggregation to match the bid and lookup its related crop details.
    const bidData = await db.collection("bids").aggregate([
      {
        $match: { _id: new ObjectId(bidId) }
      },
      {
        // Convert the stored inputId (a string) to ObjectId for matching
        $addFields: {
          convertedInputId: { $toObjectId: "$inputId" }
        }
      },
      {
        $lookup: {
          from: "userInputs", // Ensure the collection name exactly matches your MongoDB collection name
          localField: "convertedInputId",
          foreignField: "_id",
          as: "cropDetails"
        }
      },
      {
        // Unwind the array (preserving empty arrays in case no match is found)
        $unwind: { path: "$cropDetails", preserveNullAndEmptyArrays: true }
      },
      {
        // Project only the fields you need
        $project: {
          minimumBid: 1,
          startTime: 1,
          endTime: 1,
          bids: 1,
          status: 1,
          inputId: 1,
          "cropDetails.fruitVegetable": 1,
          "cropDetails.district": 1,
          "cropDetails.village": 1,
          "cropDetails.area": 1
        }
      }
    ]).toArray();

    if (!bidData || bidData.length === 0) {
      return res.status(404).json({ error: "Bid not found" });
    }

    res.status(200).json(bidData[0]);
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
