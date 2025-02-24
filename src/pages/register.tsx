import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
} from "firebase/auth";
import { auth } from "../lib/firebase";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

interface FormData {
  name: string;
  address: string;
  state: string;
  district: string;
  village: string;
  email: string;
  mobile: string;
  role: "Farmer" | "Trader" | "Farmer&Trader" | "Guest";
  type: "Individual" | "Company";
  password: string;
}

interface OtpData {
  emailOtp: string;
  mobileOtp: string;
}

interface OtpSentStatus {
  email: boolean;
  mobile: boolean;
}

const Register = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    state: "",
    district: "",
    village: "",
    email: "",
    mobile: "",
    role: "Farmer",
    type: "Individual",
    password: "",
  });

  const [otp, setOtp] = useState<OtpData>({ emailOtp: "", mobileOtp: "" });
  const [otpSent, setOtpSent] = useState<OtpSentStatus>({ email: false, mobile: false });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts and we're on step 2
    if (!verifier && step === 2) {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
          console.log("reCAPTCHA expired");
          setError("reCAPTCHA verification expired. Please try again.");
        }
      });
      
      recaptchaVerifier.render();
      setVerifier(recaptchaVerifier);
    }

    // Cleanup on component unmount or step change
    return () => {
      if (verifier) {
        verifier.clear();
        setVerifier(null);
      }
    };
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp({ ...otp, [e.target.name]: e.target.value });
  };

  const sendEmailOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setSendingEmailOtp(true);
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email OTP");
      }

      setOtpSent({ ...otpSent, email: true });
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error sending email OTP.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!otp.emailOtp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    try {
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.emailOtp
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP");
      }

      setStep(2);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid email OTP.");
    }
  };

  const sendMobileOtp = async () => {
    if (!verifier || !formData.mobile) {
      setError("Please complete the reCAPTCHA verification and enter your mobile number.");
      return;
    }

    try {
      setSendingMobileOtp(true);
      
      // Validate phone number format
      const phoneNumber = formData.mobile.startsWith('+91') 
        ? formData.mobile 
        : `+91${formData.mobile}`;

      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier
      );
      
      setConfirmationResult(confirmation);
      setOtpSent({ ...otpSent, mobile: true });
      setError("");
    } catch (error) {
      console.error("Error sending mobile OTP:", error);
      setError(
        error instanceof Error 
          ? `Failed to send OTP: ${error.message}`
          : "Failed to send OTP"
      );
      
      // Reset reCAPTCHA on error
      if (verifier) {
        verifier.clear();
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => console.log("reCAPTCHA verified"),
          'expired-callback': () => console.log("reCAPTCHA expired")
        });
        newVerifier.render();
        setVerifier(newVerifier);
      }
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const verifyMobileOtp = async () => {
    if (!confirmationResult || !otp.mobileOtp) {
      setError("Please enter the OTP first.");
      return;
    }

    try {
      await confirmationResult.confirm(otp.mobileOtp);
      setStep(3);
      setError("");
    } catch (error) {
      console.error("Error verifying mobile OTP:", error);
      setError(
        error instanceof Error 
          ? `Invalid OTP: ${error.message}`
          : "Invalid OTP"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      setAlertMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
      {alertMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {alertMessage}
        </div>
      )}
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
                disabled={sendingEmailOtp}
                className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {sendingEmailOtp ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full inline-block mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            ) : (
              <>
                <input
                  type="text"
                  name="emailOtp"
                  value={otp.emailOtp}
                  onChange={handleOtpChange}
                  className="dark:text-black mt-4 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter mobile number with country code"
              required
            />
            <div id="recaptcha-container" className="mt-4"></div>
            {!otpSent.mobile ? (
              <button
                onClick={sendMobileOtp}
                disabled={sendingMobileOtp}
                className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {sendingMobileOtp ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full inline-block mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            ) : (
              <>
                <input
                  type="text"
                  name="mobileOtp"
                  value={otp.mobileOtp}
                  onChange={handleOtpChange}
                  className="dark:text-black mt-4 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="flex items-center text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="Guest"
                    checked={formData.role === "Guest"}
                    onChange={handleChange}
                    required
                    className="mr-2"
                  />
                  Guest
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700">Confirm Password*</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;