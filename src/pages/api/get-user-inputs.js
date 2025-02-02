import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let { state, fruitVegetable } = req.query;

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const collection = db.collection("userInputs");

    let query = {};

    // Case 1: If only state is provided (for /states/[stateId])
    if (state && state.toLowerCase() !== "all") {
      query.state = state;
    }

    // Case 2: If only fruitVegetable is provided (for /crops/[cropId])
    if (fruitVegetable) {
      query.fruitVegetable = fruitVegetable;
    }

    // Case 3: If both state and fruitVegetable are provided (Optional: supports extra filtering)
    if (state && state.toLowerCase() !== "all" && fruitVegetable) {
      query = { state, fruitVegetable };
    }

    const userInputs = await collection.find(query).toArray();

    res.status(200).json(userInputs);
  } catch (error) {
    console.error("Error fetching user inputs:", error);
    res.status(500).json({ error: "Failed to fetch user inputs", details: error.message });
  }
}
