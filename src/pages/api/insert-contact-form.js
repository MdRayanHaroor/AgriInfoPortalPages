// pages/api/insert-contact-form.js
import { connectToDatabase } from "../../lib/mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message, type } = req.body;

  if (!type || !email) {
    return res.status(400).json({ error: "Request type and email are required." });
  }

  if (type !== "contact" || !name || !message) {
    return res.status(400).json({ error: "All fields are required for contact form." });
  }

  try {
    // Set up the nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Verify the SMTP connection
    await transporter.verify();

    // Define the email options
    const mailOptions = {
      from: `"AgriInfo Portal" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: "AgriInfo Portal - New Contact Form Submission",
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Connect to MongoDB and insert the submission into the contactForm collection
    const client = await connectToDatabase();
    const db = client.db("agriinfo");
    await db.collection("contactForm").insertOne({
      name,
      email,
      message,
      submittedAt: new Date(),
    });

    res.status(200).json({ message: "Message sent and stored successfully!" });
  } catch (error) {
    console.error("Error processing contact form submission:", error);
    res.status(500).json({ error: "Failed to process contact form submission", details: error.message });
  }
}
