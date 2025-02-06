import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { _id, ...updates } = req.body;
  if (!_id) {
    return res.status(400).json({ error: "Missing input ID" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const result = await db.collection("userInputs").updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: "Update successful" });
    } else {
      return res.status(400).json({ error: "Update failed" });
    }
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
