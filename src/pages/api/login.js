import { connectToDatabase } from "../../lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Destructure identifier, email, and mobile.
  const { identifier, email, mobile, password } = req.body;
  
  // Use whichever field is available.
  const loginIdentifier = identifier || email || mobile;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "Email/Mobile and password are required" });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const usersCollection = db.collection("users");

    // Find user by email or mobile
    const user = await usersCollection.findOne({
      $or: [{ email: loginIdentifier }, { mobile: loginIdentifier }],
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email/mobile or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid email/mobile or password" });
    }

    // Generate JWT token (ensure user._id is converted to string)
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie with the token
    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=604800; Secure; SameSite=Strict`
    );

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
