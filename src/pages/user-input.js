import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function UserInput() {
  const { user } = useContext(AuthContext) || {}; // Get the logged-in user from AuthContext
  
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
  
  // Add these along with your other useState declarations:
  const [showFruitSuggestions, setShowFruitSuggestions] = useState(true);
  const [fruitSuggestionIndex, setFruitSuggestionIndex] = useState(-1);
  
  const [showVarietySuggestions, setShowVarietySuggestions] = useState(true);
  const [varietySuggestionIndex, setVarietySuggestionIndex] = useState(-1);
  
  const [states, setStates] = useState([]); // For state dropdown
  const [districts, setDistricts] = useState([]); // For district dropdown
  const [userInputs, setUserInputs] = useState([]); // For suggestions
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [status, setStatus] = useState("");
  
  const maxVillageLength = 50; // Max length for village input
  
  // Automatically populate fields from logged-in user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.mobile || "",
        state: user.state || "",
        district: user.district || "",
        village: user.village || "",
      }));
    }
  }, [user]);
  
  // Fetch States
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch(
          `https://api.data.gov.in/resource/37231365-78ba-44d5-ac22-3deec40b9197?api-key=${process.env.NEXT_PUBLIC_DISTRICT_API_KEY}&offset=0&limit=all&format=json`
        );
        if (!response.ok) throw new Error("Failed to fetch state data");
        
        const data = await response.json();
        const stateSet = new Set(data.records.map((record) => record.state_name_english));
        setStates([...stateSet].sort()); // Sort alphabetically
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setLoadingStates(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch Districts when State changes
  useEffect(() => {
    if (!formData.state) return;
    
    const fetchDistricts = async () => {
      try {
        setLoadingDistricts(true);
        const response = await fetch(
          `https://api.data.gov.in/resource/37231365-78ba-44d5-ac22-3deec40b9197?api-key=${process.env.NEXT_PUBLIC_DISTRICT_API_KEY}&offset=0&limit=all&format=json`
        );
        if (!response.ok) throw new Error("Failed to fetch district data");
        
        const data = await response.json();
        const filteredDistricts = data.records
        .filter((record) => record.state_name_english === formData.state)
        .map((record) => record.district_name_english)
        .sort();
        setDistricts(filteredDistricts);
      } catch (error) {
        console.error("Error fetching districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    
    fetchDistricts();
  }, [formData.state]);
  
  // Fetch user inputs for suggestions when state changes (or when you want to update suggestions)
  useEffect(() => {
    const fetchUserInputs = async () => {
      try {
        if (!formData.state) return;
        const response = await fetch(
          `/api/get-user-inputs?state=${encodeURIComponent(formData.state)}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("User inputs:", data); // Log to check what data you receive
          setUserInputs(data);
        }
      } catch (error) {
        console.error("Error fetching user inputs:", error);
      }
    };
    fetchUserInputs();
  }, [formData.state]);  
  
  // Compute suggestions for Fruit/Vegetable/Seed based on userInputs, state, and district
  const fruitSuggestions = useMemo(() => {
    const suggestions = userInputs
    .filter(
      (input) =>
        input.state === formData.state &&
      input.district === formData.district &&
      input.fruitVegetable.trim() !== ""
    )
    .map((input) => input.fruitVegetable);
    return Array.from(new Set(suggestions));
  }, [userInputs, formData.state, formData.district]);  
  
  // Compute suggestions for Variety based on userInputs, state, and district
  const varietySuggestions = useMemo(() => {
    const suggestions = userInputs
    .filter(
      (input) =>
        input.state === formData.state &&
      input.district === formData.district &&
      input.variety.trim() !== ""
    )
    .map((input) => input.variety);
    return Array.from(new Set(suggestions));
  }, [userInputs, formData.state, formData.district]);
  
  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "state") {
      setFormData((prev) => ({ ...prev, state: value, district: "" })); // Reset district when state changes
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    
    if (formData.sownMonth && formData.harvestingMonth) {
      const sownDate = new Date(formData.sownMonth);
      const harvestDate = new Date(formData.harvestingMonth);
      
      if (harvestDate <= sownDate) {
        setStatus("⚠️ Harvesting month must be after sowing month");
        return;
      }
    }
    
    try {
      const response = await fetch("/api/store-user-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus("✅ Submitted successfully!");
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
        setStatus(`❌ Error: ${result.error || "Something went wrong."}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("❌ Error: Network issue. Please try again later.");
    }
  };
  
  return (
    <section className="p-6 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-4 text-center">User Input Form</h1>
    
    {loadingStates ? (
      <p className="text-center text-gray-400">🔄 Loading...</p>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      {/* Name */}
      <div>
      <label className="block font-medium mb-2">Name*</label>
      <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      required
      className="border px-4 py-2 rounded w-full text-black focus:ring-2 focus:ring-blue-500"
      />
      </div>
      
      {/* Phone */}
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
      
      {/* Email */}
      <div>
      <label className="block font-medium mb-2">Email*</label>
      <input
      type="email"
      name="email"
      value={formData.email}
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
      {loadingDistricts ? (
        <p className="text-sm text-gray-400">🔄 Loading...</p>
      ) : (
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
      )}
      </div>
      
      {/* Village Input with Character Counter */}
      <div>
      <label className="block font-medium mb-2">Village*</label>
      <input
      type="text"
      name="village"
      value={formData.village}
      onChange={handleChange}
      required
      className="border px-4 py-2 rounded w-full text-black"
      maxLength={maxVillageLength}
      />
      <p className="text-sm text-gray-400 mt-1">
      {formData.village.length}/{maxVillageLength} characters
      </p>
      </div>
      
      {/* Fruit/Vegetable/Seed with Suggestions */}
      <div className="relative">
      <label className="block font-medium mb-2">Fruit/Vegetable/Seed*</label>
      <input
      type="text"
      name="fruitVegetable"
      value={formData.fruitVegetable}
      onChange={(e) => {
        handleChange(e);
        setShowFruitSuggestions(true); // Ensure the suggestions are shown on input change
        setFruitSuggestionIndex(-1);
      }}
      onKeyDown={(e) => {
        const filtered = fruitSuggestions.filter((sugg) =>
          sugg.toLowerCase().includes(formData.fruitVegetable.toLowerCase())
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFruitSuggestionIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFruitSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (fruitSuggestionIndex >= 0 && fruitSuggestionIndex < filtered.length) {
        e.preventDefault();
        setFormData({ ...formData, fruitVegetable: filtered[fruitSuggestionIndex] });
        setFruitSuggestionIndex(-1);
        setShowFruitSuggestions(false);
      }
    }
  }}
  required
  className="border px-4 py-2 rounded w-full text-black"
  />
  {formData.fruitVegetable && showFruitSuggestions && fruitSuggestions && fruitSuggestions.length > 0 && (
    <ul className="absolute z-50 border border-gray-300 bg-white mt-1 max-h-40 overflow-y-auto text-black w-full">
    {fruitSuggestions
      .filter((sugg) =>
        sugg.toLowerCase().includes(formData.fruitVegetable.toLowerCase())
    )
    .map((sugg, index) => (
      <li
      key={index}
      onClick={() => {
        setFormData({ ...formData, fruitVegetable: sugg });
        setFruitSuggestionIndex(-1);
        setShowFruitSuggestions(false);
      }}
      className={`px-4 py-2 cursor-pointer hover:bg-gray-200 ${
        fruitSuggestionIndex === index ? "bg-gray-300" : ""
      }`}
      >
      {sugg}
      </li>
    ))}
    </ul>
  )}
  </div>
  
  
  {/* Variety with Suggestions */}
  <div className="relative">
  <label className="block font-medium mb-2">Variety</label>
  <input
  type="text"
  name="variety"
  value={formData.variety}
  onChange={(e) => {
    handleChange(e);
    setShowVarietySuggestions(true);
    setVarietySuggestionIndex(-1);
  }}
  onKeyDown={(e) => {
    const filtered = varietySuggestions.filter((sugg) =>
      sugg.toLowerCase().includes(formData.variety.toLowerCase())
  );
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setVarietySuggestionIndex((prev) =>
      prev < filtered.length - 1 ? prev + 1 : prev
  );
} else if (e.key === "ArrowUp") {
  e.preventDefault();
  setVarietySuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
} else if (e.key === "Enter") {
  if (varietySuggestionIndex >= 0 && varietySuggestionIndex < filtered.length) {
    e.preventDefault();
    setFormData({ ...formData, variety: filtered[varietySuggestionIndex] });
    setVarietySuggestionIndex(-1);
    setShowVarietySuggestions(false);
  }
}
}}
className="border px-4 py-2 rounded w-full text-black"
/>
{formData.variety && showVarietySuggestions && varietySuggestions && varietySuggestions.length > 0 && (
  <ul className="absolute z-50 border border-gray-300 bg-white mt-1 max-h-40 overflow-y-auto text-black w-full">
  {varietySuggestions
    .filter((sugg) =>
      sugg.toLowerCase().includes(formData.variety.toLowerCase())
  )
  .map((sugg, index) => (
    <li
    key={index}
    onClick={() => {
      setFormData({ ...formData, variety: sugg });
      setVarietySuggestionIndex(-1);
      setShowVarietySuggestions(false);
    }}
    className={`px-4 py-2 cursor-pointer hover:bg-gray-200 ${
      varietySuggestionIndex === index ? "bg-gray-300" : ""
    }`}
    >
    {sugg}
    </li>
  ))}
  </ul>
)}
</div>


{/* Area */}
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

{/* Sown Month */}
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

{/* Harvesting Month */}
<div>
  <label className="block font-medium mb-2">Harvesting Month*</label>
  <input
    type="month"
    name="harvestingMonth"
    value={formData.harvestingMonth}
    onChange={handleChange}
    required
    className="border px-4 py-2 rounded w-full text-black"
    min={formData.sownMonth || undefined}  // Only allow harvesting month >= sownMonth
  />
</div>


{/* Submit Button */}
<div>
<button
type="submit"
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
>
Submit
</button>
</div>
</form>
)}

{status && <p className="mt-4 text-center text-lg">{status}</p>}
</section>
);
}
