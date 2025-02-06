import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { state, fruitVegetable, email, phone } = req.query;

  // Build the query using previous filtering logic...
  let query = {};

  // Existing filtering by state (if provided and not "all")
  if (state && state.toLowerCase() !== "all") {
    query.state = state;
  }

  // Existing filtering by fruitVegetable (if provided)
  if (fruitVegetable) {
    query.fruitVegetable = fruitVegetable;
  }

  // New filtering: if both email and phone are provided, add them to the query.
  if (email && phone) {
    query.email = email;
    query.phone = phone;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const collection = db.collection("userInputs");

    const userInputs = await collection.find(query).toArray();

    res.status(200).json(userInputs);
  } catch (error) {
    console.error("Error fetching user inputs:", error);
    res.status(500).json({ 
      error: "Failed to fetch user inputs", 
      details: error.message 
    });
  }
}
