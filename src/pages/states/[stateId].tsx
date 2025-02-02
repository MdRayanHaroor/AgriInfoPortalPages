import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import StateMap from "@/components/StateMap";
import { stateIdToStateNameMapping } from "@/data/statesMap";

interface RecordData {
  crop: string;
  season: string;
  crop_year: number;
  district_name: string;
  state_name: string;
  area: string;
  production_: string;
}

interface UserInputData {
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  fruitVegetable: string;
  variety: string;
  area: number;
  sownMonth: string;
  harvestingMonth: string;
  createdAt: Date;
}

export default function StateDetailPage() {
  const router = useRouter();
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cropYears, setCropYears] = useState<number[]>([]);
  const [selectedCropYear, setSelectedCropYear] = useState<string>("");
  const [crops, setCrops] = useState<string[]>([]); // 🌱 New State for Crops
  const [selectedCrop, setSelectedCrop] = useState<string>(""); // 🌾 Selected Crop
  const [allStateData, setAllStateData] = useState<RecordData[]>([]); // New state for complete dataset
  
  const DISTRICT_NAME_MAPPING: { [key: string]: string } = {
    'Bagalkote': 'Bagalkot',
    // Add other district mappings here if needed
  };
  
  function getMappedDistrict(district: string): string {
    return DISTRICT_NAME_MAPPING[district] || district;
  }
  
  useEffect(() => {
    const fetchStateData = async () => {
      const rawStateId = router.query.stateId;
      const stateId = Array.isArray(rawStateId) ? rawStateId[0] : rawStateId;
      
      
      if (!stateId) {
        setError("Invalid state ID");
        setLoading(false);
        return;
      }
      
      const stateName = stateIdToStateNameMapping[stateId];
      if (!stateName) {
        setError("Invalid state ID");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch districts
        const districtResponse = await fetch(
          `https://api.data.gov.in/resource/37231365-78ba-44d5-ac22-3deec40b9197?api-key=${process.env.NEXT_PUBLIC_DISTRICT_API_KEY}&offset=0&limit=all&format=json`
        );
        if (!districtResponse.ok) throw new Error("Failed to fetch district data");
        
        const districtData = await districtResponse.json();
        const filteredDistricts = districtData.records
        .filter((record: { state_name_english: string }) => record.state_name_english === stateName)
        .map((record: { district_name_english: string }) => record.district_name_english)
        .sort();
        
        setDistricts(filteredDistricts);
        
        // Fetch agriculture data with filtering for district & crop year
        const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY || '';
        const apiUrl = new URL("https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de");
        apiUrl.searchParams.set("api-key", apiKey);
        apiUrl.searchParams.set("format", "json");
        apiUrl.searchParams.set("filters[state_name]", stateName);
        // apiUrl.searchParams.set("sort[crop_year]", "desc"); // Sort by latest crop year
        
        if (selectedDistrict) {
          const mappedDistrict = getMappedDistrict(selectedDistrict);
          apiUrl.searchParams.set("filters[district_name]", mappedDistrict.toUpperCase());
        }
        if (selectedCropYear) {
          apiUrl.searchParams.set("filters[crop_year]", selectedCropYear);
        }
        if (selectedCrop) { // 🌱 New crop filtering logic
          apiUrl.searchParams.set("filters[crop]", selectedCrop);
        }
        
        apiUrl.searchParams.set("limit", "all");
        
        const apiResponse = await fetch(apiUrl.toString());
        if (!apiResponse.ok) throw new Error(`Failed to fetch API data: ${apiResponse.status}`);
        
        const apiData = await apiResponse.json();
        const apiRecords = apiData.records.map((record: {
          crop: string;
          season: string;
          crop_year: number;
          district_name: string;
          state_name: string | null;
          area_: string | null;
          production_: string | null;
        }) => ({
          crop: record.crop,
          season: record.season,
          crop_year: record.crop_year,
          district_name: record.district_name,
          state_name: record.state_name || "N/A",
          area: record.area_ || "NA",
          production_: record.production_ || "NA",
        }));
        
        //setStateData(apiRecords);
        setAllStateData(apiRecords);
        
        // Extract all unique crop years dynamically from API response
        const allCropYearsSet = new Set<number>();
        const allCropsSet = new Set<string>();
        
        apiData.records.forEach((record: { crop_year: number; crop: string }) => {
          const year = record.crop_year;
          if (year && !isNaN(Number(year))) {
            allCropYearsSet.add(Number(year));
          }
          if (record.crop) {
            allCropsSet.add(record.crop); // 🌾 Store unique crops
          }
        });
        
        const allCropYearsArray = Array.from(allCropYearsSet).sort((a, b) => b - a);
        setCropYears(allCropYearsArray);
        
        const allCropsArray = Array.from(allCropsSet).sort(); // Sort crops alphabetically
        setCrops(allCropsArray); // ✅ Store all unique years correctly
        
        
        
        // Fetch user inputs
        const userInputsResponse = await fetch(
          `/api/get-user-inputs?state=${encodeURIComponent(stateName)}`
        );
        if (!userInputsResponse.ok) throw new Error("Failed to fetch user inputs");
        
        const userInputsData = await userInputsResponse.json();
        setUserInputs(userInputsData);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Fetch Error:", err.message);
          setError(err.message);
        } else {
          console.error("Unknown error occurred:", err);
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStateData();
  }, [router.query.stateId, selectedDistrict, selectedCropYear, selectedCrop, getMappedDistrict]); // Added selectedCropYear as a dependency
  
  const displayedData = useMemo(() => {
    // Filter data based on selections
    const filtered = allStateData.filter(record => {
      const mappedDistrict = getMappedDistrict(selectedDistrict);
      const matchesDistrict = selectedDistrict 
      ? record.district_name === mappedDistrict.toUpperCase()
      : true;
      const matchesYear = selectedCropYear
      ? record.crop_year.toString() === selectedCropYear
      : true;
      const matchesCrop = selectedCrop
      ? record.crop.toLowerCase() === selectedCrop.toLowerCase() // 🌱 New Crop Filtering
      : true;
      return matchesDistrict && matchesYear && matchesCrop;
    });
    
    // Sort based on filter state
    const sorted = [...filtered];
    if (!selectedDistrict && !selectedCropYear) {
      sorted.sort((a, b) => {
        const districtCompare = a.district_name.localeCompare(b.district_name);
        return districtCompare !== 0 ? districtCompare : b.crop_year - a.crop_year;
      });
    } else if (!selectedDistrict) {
      sorted.sort((a, b) => a.district_name.localeCompare(b.district_name));
    } else if (!selectedCropYear) {
      sorted.sort((a, b) => b.crop_year - a.crop_year);
    }
    
    // Return first 50 items
    return sorted.slice(0, );
  }, [allStateData, selectedDistrict, selectedCropYear, selectedCrop, getMappedDistrict]);
  
  
  // const handleSort = () => {
  //   const sortedData = [...stateData].sort((a, b) => {
  //     return sortOrder === "asc" ? b.crop_year - a.crop_year : a.crop_year - b.crop_year;
  //   });
  //   setStateData(sortedData);
  //   setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  // };
  
  const filteredUserInputs = selectedDistrict
  ? userInputs.filter((input) => input.district === selectedDistrict)
  : userInputs;
  
  if (loading) return (
    <div className="flex justify-center items-center h-64">
    <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>
    </div>
  );
  
  if (error) return <p>Error: {error}</p>;
  
  return (
    <section className="p-4">
    <h1 className="text-2xl font-bold mb-4">
    State: {router.query.stateId?.toString().toUpperCase()}
    </h1>
    <div className="mb-6">
    <StateMap
    stateId={router.query.stateId?.toString() || ""}
    topoUrl="/india-states-topo.json"
    />
    </div>
    
    <div className="mb-6">
    <label className="block font-medium mb-2">Filter by District</label>
    <select
    value={selectedDistrict}
    onChange={(e) => setSelectedDistrict(e.target.value)}
    className="border px-4 py-2 rounded w-full text-black"
    >
    <option value="">All Districts</option>
    {districts.map((district, index) => (
      <option key={index} value={district}>
      {district}
      </option>
    ))}
    </select>
    </div>
    
    <div className="mb-6">
    <label className="block font-medium mb-2">Filter by Crop Year</label>
    <select
    value={selectedCropYear}
    onChange={(e) => setSelectedCropYear(e.target.value)}
    className="border px-4 py-2 rounded w-full text-black"
    >
    <option value="">All Years</option>
    {cropYears.map((year, index) => (
      <option key={index} value={year}>
      {year}
      </option>
    ))}
    </select>
    </div>
    
    <div className="mb-6">
    <label className="block font-medium mb-2">Filter by Crop</label>
    <select
    value={selectedCrop}
    onChange={(e) => setSelectedCrop(e.target.value)}
    className="border px-4 py-2 rounded w-full text-black"
    >
    <option value="">All Crops</option> {/* 🌾 Default Option */}
    {crops.map((crop, index) => (
      <option key={index} value={crop}>
      {crop}
      </option>
    ))}
    </select>
    </div>
    
    
    
    <h2 className="text-xl font-bold mt-8 mb-2">User Inputs</h2>
    {filteredUserInputs.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Increased gap for better spacing */}
      {filteredUserInputs.map((input, index) => (
        <div key={index} className="border p-4 rounded-md bg-gray-800 text-white shadow-md">
        <h3 className="text-lg font-semibold mb-1">{input.name}</h3> {/* Added `mb-1` for spacing */}
        <p className="text-sm text-gray-300">{input.email} | {input.phone}</p>
        <p className="text-sm text-gray-300">📍 {input.district}, {input.village}</p>
        <p className="text-sm text-gray-300">🌿 {input.fruitVegetable} ({input.variety})</p>
        <p className="text-sm text-gray-300">📏 Area: {input.area} acres</p>
        <p className="text-sm text-gray-300">📅 Sown: {input.sownMonth} | Harvest: {input.harvestingMonth}</p>
        <p className="text-xs text-gray-400 mt-2">
        Submitted on: {new Date(input.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        </p>
        </div>
      ))}
      </div>
    ) : (
      <p className="text-gray-400 mt-4">No user inputs available for the selected state/district.</p>
    )}
    
    
    
    <h2 className="text-xl font-bold mt-8">State Agriculture Data (data.gov.in)</h2>
    <p className="text-gray-400 text-sm mb-2">
    Showing <b>{displayedData.length}</b> rows of agriculture data for <b>{selectedDistrict || "All Districts"}</b>.
    </p>
    <div className="overflow-x-auto">
    {displayedData.length ? (
      <table className="table-auto w-full border border-gray-200 mt-4 text-sm">
      <thead>
      <tr className="text-black bg-gray-100">
      <th className="px-4 py-2 border">Crop</th>
      <th className="px-4 py-2 border">Season</th>
      <th className="px-4 py-2 border">
      Year
      {/* <button
        onClick={handleSort}
        className="ml-2 text-blue-500 underline"
        >
        {sortOrder === "asc" ? "↑" : "↓"}
        </button> */}
        </th>
        <th className="px-4 py-2 border">District</th>
        <th className="px-4 py-2 border">State</th>
        <th className="px-4 py-2 border">Area (acres)</th>
        <th className="px-4 py-2 border">Production (tonnes)</th>
        </tr>
        </thead>
        <tbody>
        {displayedData.map((record, index) => (
          <tr key={index}>
          <td className="px-4 py-2 border">{record.crop}</td>
          <td className="px-4 py-2 border">{record.season}</td>
          <td className="px-4 py-2 border">{record.crop_year}</td>
          <td className="px-4 py-2 border">{record.district_name}</td>
          <td className="px-4 py-2 border">{record.state_name}</td>
          <td className="px-4 py-2 border">{record.area}</td>
          <td className="px-4 py-2 border">{record.production_}</td>
          </tr>
        ))}
        </tbody>
        </table>
      ) : (
        <p>No data available for the selected state/district.</p>
      )}
      </div>
      </section>
    );
  }