import { useState } from "react";

const stateToDistrictMapping = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "Guntur", "Kadapa", "Kurnool"],
  "Telangana": ["Adilabad", "Hyderabad", "Karimnagar", "Nizamabad", "Warangal"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Baramulla", "Anantnag", "Pulwama"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro", "Bomdila"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Ambikapur"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "New Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Rohtak", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kannur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Manipur": ["Imphal", "Bishnupur", "Thoubal", "Ukhrul", "Churachandpur"],
  "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Baghmara", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Lawngtlai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Wokha", "Zunheboto"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
  "Puducherry": ["Pondicherry", "Karaikal", "Yanam", "Mahe"],
  "Punjab": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing"],
  "Tripura": ["Agartala", "Udaipur", "Kailashahar", "Dharmanagar", "Ambassa"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Allahabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Howrah", "Durgapur"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott"],
  "Ladakh": ["Leh", "Kargil"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar"],
};

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

  const [districts, setDistricts] = useState([]);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      const availableDistricts = stateToDistrictMapping[value] || [];
      setDistricts(availableDistricts);
      setFormData((prev) => ({ ...prev, state: value, district: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

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
        setStatus(`Error: ${errorData.error || "Submission failed"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus(`Error: ${error.message || "Something went wrong"}`);
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
            value={formData.phone}
            onChange={handleChange}
            required
            className="border px-4 py-2 rounded w-full text-black"
          />
        </div>

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
            {Object.keys(stateToDistrictMapping).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

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
            {districts.map((district) => (
              <option key={district} value={district}>
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
