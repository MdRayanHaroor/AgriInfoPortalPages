import { connectToDatabase } from "../../lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, address, state, district, village, email, mobile, role, type, password } = req.body;

  // Validate that all required fields are provided.
  if (!name || !address || !state || !district || !village || !email || !mobile || !role || !type || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const usersCollection = db.collection("users");

    // Check if a user exists with the same email or mobile.
    const existingUser = await usersCollection.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already registered with this email or mobile" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user document
    const newUser = {
      name,
      address,
      state,
      district,
      village,
      email,
      mobile,
      role,
      type,
      password: hashedPassword,
      createdAt: new Date(),
      emailVerified: false,
      mobileVerified: false
    };

    // Insert the user document
    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    // Generate a JWT token
    const token = jwt.sign(
      { userId: userId.toString() }, // Convert ObjectId to string
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return the user data (without password) along with the token
    const userResponse = { ...newUser, _id: userId, password: undefined };
    res.status(201).json({ user: userResponse, token });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
