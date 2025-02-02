import { useState } from "react";
import { useRouter } from "next/router";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "../lib/firebase"; 
import Link from "next/link";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

const Register = () => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    district: "",
    village: "",
    email: "",    // collected in previous step
    mobile: "",   // collected in previous step
    role: "Farmer",       // default
    type: "Individual",   // default
    password: "",
  });
  
  const [otp, setOtp] = useState({ emailOtp: "", mobileOtp: "" });
  const [otpSent, setOtpSent] = useState({ email: false, mobile: false });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp({ ...otp, [e.target.name]: e.target.value });
  };
  
  // Send OTP for email verification (remains unchanged)
  const sendEmailOtp = async () => {
    try {
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      
      if (!response.ok) throw new Error("Failed to send email OTP");
      setOtpSent({ ...otpSent, email: true });
    } catch {
      setError("Error sending email OTP.");
    }
  };
  
  // Verify email OTP (remains unchanged)
  const verifyEmailOtp = async () => {
    try {
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: otp.emailOtp 
        }),
      });
      
      if (!response.ok) throw new Error("Invalid OTP");
      setStep(2);
    } catch {
      setError("Invalid email OTP.");
    }
  };
  
  // Setup reCAPTCHA correctly using the container ID as the first parameter.
  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container", // container id
      {
        size: "invisible",
        // Optional callback could be added here:
        // callback: (response) => { /* reCAPTCHA solved - allow signInWithPhoneNumber. */ }
      },
    );
  };
  
  // Send OTP for mobile verification using Firebase client SDK
  const sendMobileOtp = async () => {
    try {
      setupRecaptcha();
      const phoneNumber = `+91${formData.mobile}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmation;
      setOtpSent({ ...otpSent, mobile: true });
    } catch (error) {
      console.error("Error sending mobile OTP:", error);
      setError("Error sending mobile OTP.");
    }
  };
  
  // Verify mobile OTP using confirmationResult from Firebase client SDK
  const verifyMobileOtp = async () => {
    try {
      const confirmationResult = window.confirmationResult;
      await confirmationResult.confirm(otp.mobileOtp);
      setStep(3);
    } catch (error) {
      console.error("Error verifying mobile OTP:", error);
      setError("Invalid mobile OTP.");
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error("Registration failed.");
      router.push("/login"); // Redirect to login page after successful registration
    } catch {
      setError("Registration failed.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
    <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
    <h1 className="text-3xl font-bold text-center mb-6 dark:text-black">Register</h1>
    {error && <p className="text-red-600 text-center mb-4">{error}</p>}
    
    {step === 1 && (
      <div>
      <label className="block font-medium text-gray-700">Email</label>
      <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      {!otpSent.email ? (
        <button
        onClick={sendEmailOtp}
        className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
        Send OTP
        </button>
      ) : (
        <>
        <input
        type="text"
        name="emailOtp"
        value={otp.emailOtp}
        onChange={handleOtpChange}
        className="mt-4 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Enter OTP"
        required
        />
        <button
        onClick={verifyEmailOtp}
        className="mt-4 w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
        Verify Email OTP
        </button>
        </>
      )}
      <p className="mt-4 text-center text-sm text-gray-600">
  Already have an account?{" "}
  <Link href="/login">
    <span className="text-blue-500 hover:underline">Login here</span>
  </Link>
</p>
      </div>
    )}
    
    {step === 2 && (
      <div>
      <label className="block font-medium text-gray-700">Mobile Number</label>
      <input
      type="text"
      name="mobile"
      value={formData.mobile}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      {!otpSent.mobile ? (
        <button
        onClick={sendMobileOtp}
        className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
        Send OTP
        </button>
      ) : (
        <>
        <input
        type="text"
        name="mobileOtp"
        value={otp.mobileOtp}
        onChange={handleOtpChange}
        className="mt-4 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Enter OTP"
        required
        />
        <button
        onClick={verifyMobileOtp}
        className="mt-4 w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
        Verify Mobile OTP
        </button>
        </>
      )}
      </div>
    )}
    
    {/* reCAPTCHA container for Firebase Phone Auth */}
    <div id="recaptcha-container" className="hidden"></div>
    
    {step === 3 && (
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
      <label className="block font-medium text-gray-700">Name*</label>
      <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <div>
      <label className="block font-medium text-gray-700">Address*</label>
      <input
      type="text"
      name="address"
      value={formData.address}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <div>
      <label className="block font-medium text-gray-700">State*</label>
      <input
      type="text"
      name="state"
      value={formData.state}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <div>
      <label className="block font-medium text-gray-700">District*</label>
      <input
      type="text"
      name="district"
      value={formData.district}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <div>
      <label className="block font-medium text-gray-700">Village*</label>
      <input
      type="text"
      name="village"
      value={formData.village}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <div>
      <label className="block font-medium text-gray-700">Role*</label>
      <div className="mt-1 flex items-center space-x-4">
      <label className="flex items-center text-gray-700">
      <input
      type="radio"
      name="role"
      value="Farmer"
      checked={formData.role === "Farmer"}
      onChange={handleChange}
      required
      className="mr-2"
      />
      Farmer
      </label>
      <label className="flex items-center text-gray-700">
      <input
      type="radio"
      name="role"
      value="Trader"
      checked={formData.role === "Trader"}
      onChange={handleChange}
      required
      className="mr-2"
      />
      Trader
      </label>
      <label className="flex items-center text-gray-700">
      <input
      type="radio"
      name="role"
      value="Farmer&Trader"
      checked={formData.role === "Farmer&Trader"}
      onChange={handleChange}
      required
      className="mr-2"
      />
      Farmer & Trader
      </label>
      </div>
      </div>
      <div>
      <label className="block font-medium text-gray-700">Type*</label>
      <div className="mt-1 flex items-center space-x-4">
      <label className="flex items-center text-gray-700">
      <input
      type="radio"
      name="type"
      value="Individual"
      checked={formData.type === "Individual"}
      onChange={handleChange}
      required
      className="mr-2"
      />
      Individual
      </label>
      <label className="flex items-center text-gray-700">
      <input
      type="radio"
      name="type"
      value="Company"
      checked={formData.type === "Company"}
      onChange={handleChange}
      required
      className="mr-2"
      />
      Company
      </label>
      </div>
      </div>
      <div>
      <label className="block font-medium text-gray-700">Password*</label>
      <input
      type="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
      />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
      Register
      </button>
      </form>
    )}
    </div>
    
    </div>
  );
};

export default Register;
