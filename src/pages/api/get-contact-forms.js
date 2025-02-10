// pages/api/get-contact-forms.js
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const collection = db.collection("contactForm");

    const contactForms = await collection.find({}).toArray();

    res.status(200).json(contactForms);
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    res.status(500).json({ 
      error: "Failed to fetch contact forms", 
      details: error.message 
    });
  }
}
