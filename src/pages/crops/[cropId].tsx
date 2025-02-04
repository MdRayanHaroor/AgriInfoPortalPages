import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface CropData {
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

export default function CropDetailPage() {
  const router = useRouter();
  const { cropId } = router.query; // Get the selected crop from URL

  const [cropData, setCropData] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);

  // Filters
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [cropYears, setCropYears] = useState<number[]>([]);
  const [selectedCropYear, setSelectedCropYear] = useState<string>("");
  // Add the missing filter state for crop
  const [selectedCrop] = useState<string>("");

  // Pagination state for agriculture data table
  const rowsPerPage = 100;
  const [currentPage, setCurrentPage] = useState(1);


  // Fetch crop and user inputs data
  useEffect(() => {
    if (!cropId) return;

    const fetchCropData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY || "";
        const apiUrl = new URL(
          "https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de"
        );
        apiUrl.searchParams.set("api-key", apiKey);
        apiUrl.searchParams.set("format", "json");
        apiUrl.searchParams.set("filters[crop]", cropId as string);
        apiUrl.searchParams.set("limit", "all"); // Fetch all data

        const response = await fetch(apiUrl.toString());
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

        const data = await response.json();
        const processedData = data.records.map((record: {
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

        setCropData(processedData);

        // Fetch user inputs (for suggestions or filtering)
        const userInputsResponse = await fetch(
          `/api/get-user-inputs?fruitVegetable=${encodeURIComponent(cropId as string)}`
        );
        if (!userInputsResponse.ok) throw new Error("Failed to fetch user inputs");

        const userInputsData = await userInputsResponse.json();
        setUserInputs(userInputsData);

        // Extract unique states from processedData
        const uniqueStates = Array.from(
          new Set(processedData.map((record: { state_name: string }) => record.state_name))
        ).sort() as string[];
        setStates(uniqueStates);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCropData();
  }, [cropId]);

  // Update District and Crop Years when selectedState changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setCropYears([]);
      return;
    }

    setLoading(true);
    const filteredDistricts = Array.from(
      new Set(
        cropData.filter((record) => record.state_name === selectedState).map((record) => record.district_name)
      )
    ).sort();

    const filteredYears = Array.from(
      new Set(cropData.filter((record) => record.state_name === selectedState).map((record) => record.crop_year))
    )
      .filter((year): year is number => typeof year === "number" && !isNaN(year))
      .sort((a, b) => b - a);

    setDistricts(filteredDistricts);
    setCropYears(filteredYears);
    setLoading(false);
  }, [selectedState, cropData]);

  // Update Crop Years when selectedDistrict changes
  useEffect(() => {
    if (!selectedDistrict) return;

    setLoading(true);
    const filteredYears = Array.from(
      new Set(
        cropData
          .filter((record) => record.state_name === selectedState && record.district_name === selectedDistrict)
          .map((record) => record.crop_year)
      )
    )
      .filter((year): year is number => typeof year === "number" && !isNaN(year))
      .sort((a, b) => b - a);

    setCropYears(filteredYears);
    setLoading(false);
  }, [selectedDistrict, selectedState, cropData]);

  // useMemo to filter and sort agriculture data
  const filteredCropData = useMemo(() => {
    return cropData
      .filter((record) => (selectedState ? record.state_name === selectedState : true))
      .filter((record) => (selectedDistrict ? record.district_name === selectedDistrict : true))
      .filter((record) => (selectedCropYear ? record.crop_year.toString() === selectedCropYear : true))
      .filter((record) => (selectedCrop ? record.crop.toLowerCase() === selectedCrop.toLowerCase() : true));
  }, [cropData, selectedState, selectedDistrict, selectedCropYear, selectedCrop]);

  // Pagination calculations for agriculture data table
  const totalPages = Math.ceil(filteredCropData.length / rowsPerPage);
  const paginatedData = filteredCropData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset currentPage to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedDistrict, selectedCropYear, selectedCrop]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>
      </div>
    );

  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <section className="p-4">
      <div className="mb-4">
        <Link href="/crops" className="text-blue-500 hover:underline text-sm">
        ⬅ Back to Crops
        </Link>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">{cropId?.toString().toUpperCase()} - Details</h1>
        
        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* State Filter */}
        <div>
        <label className="block font-medium mb-2">Filter by State</label>
        <select
        value={selectedState}
        onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedDistrict(""); // Reset district on state change
            setSelectedCropYear(""); // Reset year on state change
        }}
        className="border px-4 py-2 rounded w-full text-black"
        >
        <option value="">All States</option>
        {states.map((state, index) => (
            <option key={index} value={state}>
            {state}
            </option>
        ))}
        </select>
        </div>
        
        {/* District Filter */}
        <div>
        <label className="block font-medium mb-2">Filter by District</label>
        <select
        value={selectedDistrict}
        onChange={(e) => setSelectedDistrict(e.target.value)}
        className="border px-4 py-2 rounded w-full text-black"
        disabled={!selectedState}
        >
        <option value="">All Districts</option>
        {districts.map((district, index) => (
            <option key={index} value={district}>
            {district}
            </option>
        ))}
        </select>
        </div>
        
        {/* Crop Year Filter */}
        <div>
        <label className="block font-medium mb-2">Filter by Year</label>
        <select
        value={selectedCropYear}
        onChange={(e) => setSelectedCropYear(e.target.value)}
        className="border px-4 py-2 rounded w-full text-black"
        disabled={!selectedState}
        >
        <option value="">All Years</option>
        {cropYears.map((year, index) => (
            <option key={index} value={year.toString()}>
            {year}
            </option>
        ))}
        </select>
        </div>
        </div>

      <h2 className="text-xl font-bold mt-8 mb-2">User Inputs</h2>
      {userInputs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {userInputs.map((input, index) => (
            <div key={index} className="border p-4 rounded-md bg-gray-800 text-white shadow-md">
              <h3 className="text-lg font-semibold mb-1">{input.name}</h3>
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
        Showing <b>{filteredCropData.length}</b> rows of agriculture data for <b>{selectedDistrict || "All Districts"}</b>.
      </p>
      <div className="overflow-x-auto">
        {paginatedData.length ? (
          <table className="table-auto w-full border border-gray-200 mt-4 text-sm">
            <thead>
              <tr className="text-black bg-gray-100">
                <th className="px-4 py-2 border">Crop</th>
                <th className="px-4 py-2 border">Season</th>
                <th className="px-4 py-2 border">Year</th>
                <th className="px-4 py-2 border">District</th>
                <th className="px-4 py-2 border">State</th>
                <th className="px-4 py-2 border">Area (acres)</th>
                <th className="px-4 py-2 border">Production (tonnes)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, index) => (
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

      {/* Pagination Controls for Agriculture Data Table */}
      {filteredCropData.length > rowsPerPage && (
        <div className="flex justify-center items-center mt-4 space-x-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/crops" className="text-blue-500 hover:underline">
          ⬅ Back to Crops
        </Link>
      </div>
    </section>
  );
}
