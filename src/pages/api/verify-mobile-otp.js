import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../../lib/firebase-admin";
import { connectToDatabase } from "../../lib/mongodb";

initializeFirebaseAdmin();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ error: "Mobile and OTP are required" });
  }

  try {
    const auth = getAuth();

    // Verify the OTP
    await auth.verifySessionCookie(otp, true); // Verify OTP matches session

    // Update database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    await usersCollection.updateOne(
      { mobile },
      { $set: { mobileVerified: true } }
    );

    res.status(200).json({ message: "Mobile verified successfully" });
  } catch (error) {
    console.error("Mobile OTP verification failed:", error);
    res.status(400).json({ error: "Invalid OTP or expired" });
  }
}