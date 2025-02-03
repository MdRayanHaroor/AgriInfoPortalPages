import { connectToDatabase } from "../../lib/mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    const usersCollection = db.collection("users");

    // Look for the user with the provided email
    const user = await usersCollection.findOne({ email });
    // Always return success message (to prevent email enumeration)
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Generate a random 6-digit OTP (as a string)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set an expiry for the OTP (e.g., 1 hour from now)
    const otpExpiry = Date.now() + 3600000;

    // Store the OTP and its expiry in the user's document
    await usersCollection.updateOne(
      { email },
      { $set: { resetOtp: otp, resetOtpExpiry: otpExpiry } }
    );

    // Create the email content
    const subject = "Your Password Reset OTP";
    const html = `
      <h3>Your OTP for Password Reset</h3>
      <p>Please use the following OTP to reset your password:</p>
      <h2 style="color: #2c3e50;">${otp}</h2>
      <p>This OTP is valid for 1 hour.</p>
    `;

    // Use NodeMailer to send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    const mailOptions = {
      from: `"AgriInfo Portal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
