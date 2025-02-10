import { useState, useEffect, useContext } from "react";
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
    <section className="p-6 max-w-4xl mx-auto">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Contact Us</h1>
        <p className="mb-4 text-lg text-center">
          Have questions, feedback, or suggestions? We&apos;d love to hear from you! Fill out the form below, and we&apos;ll get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-lg font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="text-black border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-lg font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="text-black border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-lg font-medium mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              className="text-black border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded transition flex items-center gap-2 ${
              status === "Sending..." ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            disabled={status === "Sending..."}
          >
            {status === "Sending..." ? (
              <>
                <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full"></div>
                Sending...
              </>
            ) : (
              "Send"
            )}
          </button>
        </form>
        {status && (
          <p className={`mt-4 text-lg ${status.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
