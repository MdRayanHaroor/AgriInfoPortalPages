import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function Contact() {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  // When the user is available, pre-fill the name and email fields.
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      // This endpoint both sends the email and inserts the data into the contactForm collection.
      const response = await fetch("/api/insert-contact-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "contact" }),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("Message sent successfully!");
        // Reset the message field only – keep name/email prefilled
        setFormData((prev) => ({ ...prev, message: "" }));
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      setStatus("Failed to send the message. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="text-green-600 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Contact Form Container */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-green-600 text-white p-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Have questions, feedback, or suggestions about agricultural information? 
              We&apos;re here to help! Fill out the form below, and our team will get back to you.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Write your message here..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "Sending..."}
              className={`w-full py-3 rounded-md transition-colors flex items-center justify-center ${
                status === "Sending..." 
                  ? "bg-gray-500 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {status === "Sending..." ? (
                <>
                  <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></div>
                  Sending Message...
                </>
              ) : (
                "Send Message"
              )}
            </button>

            {status && (
              <p className={`mt-4 text-center ${
                status.includes("Error") 
                  ? "text-red-600" 
                  : status.includes("successfully") 
                    ? "text-green-600" 
                    : "text-gray-600"
              }`}>
                {status}
              </p>
            )}
          </form>
        </div>

        {/* Additional Contact Information */}
        <div className="mt-8 bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Alternative Contact Methods
          </h2>
          <div className="flex justify-center space-x-6">
            <div>
              <h3 className="font-medium text-gray-700">Email</h3>
              <a 
                href="mailto:mohammedrayan977@gmail.com" 
                className="text-green-600 hover:underline"
              >
                mohammedrayan977@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}