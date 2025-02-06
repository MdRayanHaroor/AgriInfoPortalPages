import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing input ID" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const result = await db.collection("userInputs").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      return res.status(200).json({ message: "Deletion successful" });
    } else {
      return res.status(400).json({ error: "Deletion failed" });
    }
  } catch (error) {
    console.error("Deletion error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
