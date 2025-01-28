import { useState, useEffect } from "react";

export default function UserInput() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    district: "",
    village: "",
    fruitVegetable: "",
    variety: "",
    area: "",
    sownMonth: "",
    harvestingMonth: "",
  });

  const [states, setStates] = useState([]); // For state dropdown
  const [districts, setDistricts] = useState([]); // For district dropdown
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Fetch state and district data from the API
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.data.gov.in/resource/37231365-78ba-44d5-ac22-3deec40b9197?api-key=${process.env.NEXT_PUBLIC_DISTRICT_API_KEY}&offset=0&limit=all&format=json`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data from the API");
        }
        const data = await response.json();

        // Extract and sort unique state names
        const stateSet = new Set(
          data.records.map((record) => record.state_name_english)
        );
        const sortedStates = [...stateSet].sort(); // Sort alphabetically
        setStates(sortedStates);

        // Prepopulate districts for the selected state
        if (formData.state) {
          const filteredDistricts = data.records
            .filter(
              (record) => record.state_name_english === formData.state
            )
            .map((record) => record.district_name_english)
            .sort(); // Sort districts alphabetically
          setDistricts(filteredDistricts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [formData.state]); // Refetch districts when state changes

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      setFormData((prev) => ({ ...prev, state: value, district: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    if (formData.sownMonth && formData.harvestingMonth) {
      const sownDate = new Date(formData.sownMonth);
      const harvestDate = new Date(formData.harvestingMonth);
      
      if (harvestDate <= sownDate) {
        setStatus("Error: Harvesting month must be after sowing month");
        return;
      }
    }

    try {
      const response = await fetch("/api/store-user-input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Submission successful:", result);
        setStatus("Submitted successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          state: "",
          district: "",
          village: "",
          fruitVegetable: "",
          variety: "",
          area: "",
          sownMonth: "",
          harvestingMonth: "",
        });
      } else {
        const errorData = await response.json();
        console.error("Error response from API:", errorData);
        setStatus("Error: Submission failed. Please check your inputs.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("Error: Submission failed. Please check your inputs.");
    }
  };

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">User Input Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Phone*</label>
          <input
            type="tel"
            name="phone"
            pattern="[0-9]{10}"
            value={formData.phone}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        {/* State Dropdown */}
        <div>
          <label className="block font-medium mb-2">State*</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          >
            <option value="">Select State</option>
            {states.map((state, index) => (
              <option key={index} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* District Dropdown */}
        <div>
          <label className="block font-medium mb-2">District*</label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
            disabled={!formData.state}
          >
            <option value="">Select District</option>
            {districts.map((district, index) => (
              <option key={index} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Village*</label>
          <input
            type="text"
            name="village"
            value={formData.village}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Fruit/Vegetable*</label>
          <input
            type="text"
            name="fruitVegetable"
            value={formData.fruitVegetable}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Variety</label>
          <input
            type="text"
            name="variety"
            value={formData.variety}
            onChange={handleChange}
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Area (in acres)*</label>
          <input
            type="number"
            name="area"
            value={formData.area}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Sown Month*</label>
          <input
            type="month"
            name="sownMonth"
            value={formData.sownMonth}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Harvesting Month*</label>
          <input
            type="month"
            name="harvestingMonth"
            value={formData.harvestingMonth}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </div>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </section>
  );
}
