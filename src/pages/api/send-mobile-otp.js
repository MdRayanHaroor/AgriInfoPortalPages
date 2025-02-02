// api/send-mobile-otp.js
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../../lib/firebase-admin";

initializeFirebaseAdmin();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const phoneNumber = `+91${mobile}`;
    const auth = getAuth();
    
    // Generate verification code (OTP)
    const verificationCode = await auth.generateSignInWithPhoneNumberToken(
      phoneNumber,
      "RECAPTCHA_VERIFIER" // You'll need to handle reCAPTCHA on client
    );

    res.status(200).json({ 
      message: "OTP sent successfully",
      verificationId: verificationCode.verificationId
    });
  } catch (error) {
    console.error("Error sending mobile OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}