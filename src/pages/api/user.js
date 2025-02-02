import { connectToDatabase } from "../../lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const usersCollection = db.collection("users");

    // Convert string ID to MongoDB ObjectId
    const userId = new ObjectId(decoded.userId);

    const user = await usersCollection.findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });

  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}