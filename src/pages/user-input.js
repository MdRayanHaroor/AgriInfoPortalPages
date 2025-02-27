import { useState, useEffect, useContext, useMemo } from "react";
import Link from "next/link";
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
          console.log("User inputs:", data);
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation and Back Link */}
        <div className="mb-6 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            ⬅ Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-center mb-4 text-green-600">
            Crop Information Submission
          </h1>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Help us build a comprehensive agricultural database by sharing details 
            about your crop. Your input supports farmers, researchers, and 
            agricultural planners across India.
          </p>
        </div>

        {/* Main Form Container */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white shadow-md rounded-lg p-8 space-y-6"
        >
          {/* Personal Information Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number*
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                pattern="[0-9]{10}"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Enter your email address"
            />
          </div>

          {/* Location Information */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State*
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                disabled={loadingStates}
              >
                <option value="">
                  {loadingStates ? "Loading states..." : "Select State"}
                </option>
                {states.map((state, index) => (
                  <option key={index} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                District*
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                disabled={!formData.state || loadingDistricts}
              >
                <option value="">
                  {loadingDistricts 
                    ? "Loading districts..." 
                    : !formData.state 
                      ? "Select State First" 
                      : "Select District"}
                </option>
                {districts.map((district, index) => (
                  <option key={index} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                Village*
              </label>
              <input
                type="text"
                id="village"
                name="village"
                value={formData.village}
                onChange={handleChange}
                required
                maxLength={maxVillageLength}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Enter your village name"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.village.length}/{maxVillageLength} characters
              </p>
            </div>
          </div>

          {/* Crop Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="fruitVegetable" className="block text-sm font-medium text-gray-700 mb-2">
                Crop Type*
              </label>
              <input
                type="text"
                id="fruitVegetable"
                name="fruitVegetable"
                value={formData.fruitVegetable}
                onChange={(e) => {
                  handleChange(e);
                  setShowFruitSuggestions(true);
                  setFruitSuggestionIndex(-1);
                }}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Enter crop type (e.g., Rice, Wheat)"
              />
              {formData.fruitVegetable && showFruitSuggestions && fruitSuggestions && fruitSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
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
                        className={`px-4 py-2 cursor-pointer hover:bg-green-100 ${
                          fruitSuggestionIndex === index ?"bg-green-200" : ""
                        }`}
                      >
                        {sugg}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <label htmlFor="variety" className="block text-sm font-medium text-gray-700 mb-2">
                Crop Variety 
                <span className="text-gray-500 text-xs ml-2">(Optional)</span>
              </label>
              <input
                type="text"
                id="variety"
                name="variety"
                value={formData.variety}
                onChange={(e) => {
                  handleChange(e);
                  setShowVarietySuggestions(true);
                  setVarietySuggestionIndex(-1);
                }}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Enter specific variety (if applicable)"
              />
              {formData.variety && showVarietySuggestions && varietySuggestions && varietySuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
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
                        className={`px-4 py-2 cursor-pointer hover:bg-green-100 ${
                          varietySuggestionIndex === index ? "bg-green-200" : ""
                        }`}
                      >
                        {sugg}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Crop Details */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Cultivated Area (Acres)*
              </label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Enter area in acres"
              />
            </div>

            <div>
              <label htmlFor="sownMonth" className="block text-sm font-medium text-gray-700 mb-2">
                Sowing Month*
              </label>
              <input
                type="month"
                id="sownMonth"
                name="sownMonth"
                value={formData.sownMonth}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>

            <div>
              <label htmlFor="harvestingMonth" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Harvest Month*
              </label>
              <input
                type="month"
                id="harvestingMonth"
                name="harvestingMonth"
                value={formData.harvestingMonth}
                onChange={handleChange}
                required
                min={formData.sownMonth || undefined}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>
          </div>

          {/* Submission Section */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit Crop Information
            </button>
          </div>
        </form>

        {/* Status Message */}
        {status && (
          <div className={`mt-4 p-4 rounded text-center ${
            status.includes("successfully") 
              ? "bg-green-100 text-green-800" 
              : status.includes("Error") 
                ? "bg-red-100 text-red-800" 
                : "bg-yellow-100 text-yellow-800"
          }`}>
            {status}
          </div>
        )}

        {/* Additional Information Section */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Why Submit Your Crop Information?
          </h2>
          <ul className="space-y-3 text-blue-700 list-disc list-inside">
            <li>
              Help create a comprehensive agricultural database
            </li>
            <li>
              Receive personalized agricultural insights and recommendations
            </li>
            <li>
              Contribute to research and policy-making in agriculture
            </li>
            <li>
              Connect with potential buyers and traders
            </li>
          </ul>
          <p className="mt-4 text-sm text-blue-600">
            Note: Your information is confidential and will be used 
            solely for agricultural research and market insights.
          </p>
        </div>
      </div>
    </div>
  );
}