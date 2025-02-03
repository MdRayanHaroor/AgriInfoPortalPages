// /pages/api/reset-password.js
import { connectToDatabase } from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password are required." });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const usersCollection = db.collection("users");

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check that an OTP was generated and that it matches
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: "OTP was not generated or has been cleared." });
    }
    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }
    if (Date.now() > user.resetOtpExpiry) {
      return res.status(400).json({ error: "OTP has expired." });
    }

    // OTP is valid. Hash the new password.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and remove the OTP fields
    await usersCollection.updateOne(
      { email },
      { 
        $set: { password: hashedPassword },
        $unset: { resetOtp: "", resetOtpExpiry: "" }
      }
    );

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
