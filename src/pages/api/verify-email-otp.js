let otpStorage = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Generate and send OTP
  if (!otp) {
    // Clear any existing OTP for this email first
    if (otpStorage[email]) {
      delete otpStorage[email];
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = { 
      otp: generatedOTP, 
      timestamp: Date.now(),
      attempts: 0 // Add attempt counter
    };

    try {
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const apiUrl = `${protocol}://${host}/api/send-email`;

      const sendEmailResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp', email, otp: generatedOTP }),
      });

      if (!sendEmailResponse.ok) throw new Error('Failed to send OTP email');
      res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP email.' });
    }
  } else {
    // Verification logic
    const storedData = otpStorage[email];
    
    // Add attempt tracking
    if (storedData) {
      storedData.attempts += 1;
      if (storedData.attempts > 3) {
        delete otpStorage[email];
        return res.status(400).json({ error: 'Too many attempts. Request new OTP.' });
      }
    }

    if (!storedData || storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    if (Date.now() - storedData.timestamp > 600000) {
      delete otpStorage[email];
      return res.status(400).json({ error: 'OTP expired.' });
    }

    delete otpStorage[email];
    res.status(200).json({ message: 'OTP verified successfully!' });
  }
}