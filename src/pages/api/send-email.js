import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, name, email, message, otp } = req.body;

  if (!type || !email) {
    return res.status(400).json({ error: "Request type and email are required." });
  }

  if (type === "contact" && (!name || !message)) {
    return res.status(400).json({ error: "All fields are required for contact form." });
  }

  if (type === "otp" && !otp) {
    return res.status(400).json({ error: "OTP is required for email verification." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Verify SMTP connection
    await transporter.verify();

    let mailOptions = {};

    if (type === "contact") {
      mailOptions = {
        from: `"AgriInfo Portal" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        replyTo: email,
        subject: "AgriInfo Portal - New Contact Form Submission",
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      };
    } else if (type === "otp") {
      mailOptions = {
        from: `"AgriInfo Portal" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "AgriInfo Portal - OTP Verification",
        html: `
          <h3>Your OTP for Registration</h3>
          <p>Please use the following OTP to complete your registration:</p>
          <h2 style="color: #2c3e50;">${otp}</h2>
          <p>This OTP is valid for 10 minutes.</p>
        `,
      };
    }

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: type === "otp" ? "OTP sent successfully!" : "Email sent successfully!" });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ 
      error: "Failed to send email",
      details: process.env.NODE_ENV === "development" ? error.message : null
    });
  }
}
