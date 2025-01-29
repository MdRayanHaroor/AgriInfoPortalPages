import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
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
          Have questions, feedback, or suggestions? We&apos;d love to hear from
          you! Fill out the form below, and we&apos;ll get back to you as soon as
          possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-2" htmlFor="name">
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
            <label className="block text-lg font-medium mb-2" htmlFor="email">
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
            <label className="block text-lg font-medium mb-2" htmlFor="message">
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

          {/* Improved Button */}
          <button
            type="submit"
            className={`px-4 py-2 rounded transition flex items-center gap-2 ${
              status === "Sending..."
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
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

        {/* Success / Error Message */}
        {status && (
          <p className={`mt-4 text-lg ${status.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
