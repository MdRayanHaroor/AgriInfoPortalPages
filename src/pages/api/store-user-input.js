import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name,
    email,
    phone,
    state,
    district,
    village,
    fruitVegetable,
    variety,
    area,
    sownMonth,
    harvestingMonth,
  } = req.body;

  if (
    !name ||
    !phone ||
    !state ||
    !district ||
    !village ||
    !fruitVegetable ||
    !area ||
    !sownMonth ||
    !harvestingMonth
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const collection = db.collection("userInputs");

    const result = await collection.insertOne({
      name,
      email: email || null,
      phone,
      state,
      district,
      village,
      fruitVegetable,
      variety: variety || null,
      area: parseFloat(area),
      sownMonth,
      harvestingMonth,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Data submitted successfully", insertedId: result.insertedId });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Failed to store user input.", details: error.message });
  }
}
