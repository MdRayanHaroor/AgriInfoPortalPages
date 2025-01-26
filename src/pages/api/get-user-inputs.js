import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { state } = req.query;

  if (!state) {
    return res.status(400).json({ error: "State parameter is required" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const collection = db.collection("userInputs");

    const userInputs = await collection.find({ state }).toArray();

    res.status(200).json(userInputs);
  } catch (error) {
    console.error("Error fetching user inputs:", error);
    res.status(500).json({ error: "Failed to fetch user inputs", details: error.message });
  }
}
