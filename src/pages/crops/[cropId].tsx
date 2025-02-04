import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
//import { FixedSizeList as List } from "react-window";

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

interface RawCropRecord {
  crop: string;
  season: string;
  crop_year: number;
  district_name: string;
  state_name?: string;
  area_?: string;
  production_?: string;
}

// Cache constants
const CROP_DATA_CACHE_KEY = "cachedCropData";
const USER_INPUTS_CACHE_KEY = "cachedUserInputs";
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const processCropRecord = (record: RawCropRecord): CropData => ({
  crop: record.crop,
  season: record.season,
  crop_year: record.crop_year,
  district_name: record.district_name,
  state_name: record.state_name || "N/A",
  area: record.area_ || "NA",
  production_: record.production_ || "NA",
});

export default function CropDetailPage() {
  const router = useRouter();
  const { cropId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);

  // Filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCropYear, setSelectedCropYear] = useState("");

  // Pagination
  const rowsPerPage = 100;
  const [currentPage, setCurrentPage] = useState(1);

  // Cache handling
  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY_MS) return null;
      return data;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }, []);

  const setCachedData = useCallback(<T,>(key: string, data: T) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }, []);

  // Data fetching
  useEffect(() => {
    if (!cropId) return;

    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = `${CROP_DATA_CACHE_KEY}-${cropId}`;
        const cachedCropData = getCachedData(cacheKey);
        const cachedUserInputs = getCachedData(USER_INPUTS_CACHE_KEY);

        if (cachedCropData && cachedUserInputs) {
          setCropData(cachedCropData);
          setUserInputs(cachedUserInputs);
          setLoading(false);
          return;
        }

        const [cropResponse, userInputsResponse] = await Promise.all([
          fetch(
            `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${
              process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY
            }&format=json&limit=all&filters[crop]=${encodeURIComponent(
              cropId as string
            )}`,
            { signal: controller.signal }
          ),
          fetch(
            `/api/get-user-inputs?fruitVegetable=${encodeURIComponent(
              cropId as string
            )}`,
            { signal: controller.signal }
          ),
        ]);

        if (!cropResponse.ok || !userInputsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [cropJson, userData] = await Promise.all([
          cropResponse.json(),
          userInputsResponse.json(),
        ]);

        const processedCropData = cropJson.records.map(processCropRecord);
        setCropData(processedCropData);
        setUserInputs(userData);
        setCachedData(cacheKey, processedCropData);
        setCachedData(USER_INPUTS_CACHE_KEY, userData);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [cropId, getCachedData, setCachedData]);

  // Memoized derived data
  const states = useMemo(
    () => Array.from(new Set(cropData.map((r) => r.state_name))).sort(),
    [cropData]
  );

  const districts = useMemo(
    () =>
      selectedState
        ? Array.from(
            new Set(
              cropData
                .filter((r) => r.state_name === selectedState)
                .map((r) => r.district_name)
            )
          ).sort()
        : [],
    [cropData, selectedState]
  );

  const cropYears = useMemo(
    () =>
      Array.from(
        new Set(
          cropData
            .filter(
              (r) =>
                r.state_name === selectedState &&
                (!selectedDistrict || r.district_name === selectedDistrict)
            )
            .map((r) => r.crop_year)
        )
      )
        .filter((y): y is number => typeof y === "number")
        .sort((a, b) => b - a),
    [cropData, selectedState, selectedDistrict]
  );

  // Filtered and paginated data
  const filteredCropData = useMemo(
    () =>
      cropData.filter(
        (r) =>
          (!selectedState || r.state_name === selectedState) &&
          (!selectedDistrict || r.district_name === selectedDistrict) &&
          (!selectedCropYear || r.crop_year.toString() === selectedCropYear)
      ),
    [cropData, selectedState, selectedDistrict, selectedCropYear]
  );

  const { paginatedData, totalPages } = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    return {
      paginatedData: filteredCropData.slice(start, end),
      totalPages: Math.ceil(filteredCropData.length / rowsPerPage),
    };
  }, [filteredCropData, currentPage]);

  // Handlers
  const handleStateChange = useCallback((value: string) => {
    setSelectedState(value);
    setSelectedDistrict("");
    setSelectedCropYear("");
  }, []);

  const handleDistrictChange = useCallback((value: string) => {
    setSelectedDistrict(value);
    setSelectedCropYear("");
  }, []);

  const handlePageChange = useCallback(
    (delta: number) => {
      setCurrentPage((prev) => Math.max(1, Math.min(prev + delta, totalPages)));
    },
    [totalPages]
  );

  // Reset pagination on filter changes
  useEffect(() => setCurrentPage(1), [
    selectedState,
    selectedDistrict,
    selectedCropYear,
  ]);

  // Virtualized table row renderer
//   const TableRow = useCallback(
//     ({ index, style }: { index: number; style: React.CSSProperties }) => {
//       const record = paginatedData[index];
//       return (
//         <div style={style} className="flex border-b">
//   <div className="flex-1 min-w-0 whitespace-normal break-words border-r p-2">{record.crop}</div>
//   <div className="flex-1 min-w-0 whitespace-normal break-words border-r p-2">{record.season}</div>
//   <div className="flex-[0.5] min-w-0 whitespace-normal break-words border-r p-2">{record.crop_year}</div>
//   <div className="flex-[2] min-w-0 whitespace-normal break-words border-r p-2">{record.district_name}</div>
//   <div className="flex-[2] min-w-0 whitespace-normal break-words border-r p-2">{record.state_name}</div>
//   <div className="flex-[0.5] min-w-0 whitespace-normal break-words border-r p-2">{record.area}</div>
//   <div className="flex-1 min-w-0 whitespace-normal break-words p-2">{record.production_}</div>
// </div>

//       );
//     },
//     [paginatedData]
//   );

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/crops" className="text-blue-500 hover:underline">
          ← Back to Crops
        </Link>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/crops" className="text-blue-500 hover:underline text-sm">
          ⬅ Back to Crops
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-center mb-6">
        {cropId?.toString().toUpperCase()} - Details
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block font-medium mb-2">State</label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="border px-4 py-2 rounded w-full text-black"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="border px-4 py-2 rounded w-full text-black"
            disabled={!selectedState}
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Year</label>
          <select
            value={selectedCropYear}
            onChange={(e) => setSelectedCropYear(e.target.value)}
            className="border px-4 py-2 rounded w-full text-black"
            disabled={!selectedState}
          >
            <option value="">All Years</option>
            {cropYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Inputs */}
<section className="mb-8">
  <h2 className="text-xl font-bold mb-4">User Inputs</h2>
  {loading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-gray-800 rounded animate-pulse"
        />
      ))}
    </div>
  ) : userInputs.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {userInputs.map((input) => (
        <div
          key={input.email}
          className="border p-4 rounded-md bg-gray-800"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{input.name}</h3>
              <p className="text-sm text-gray-300">
                📧 {input.email}
              </p>
              <p className="text-sm text-gray-300">
                📞 {input.phone}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              Submitted:{" "}
              {new Date(input.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-300">
                📍 {input.district}, {input.village}
              </p>
              <p className="text-sm text-gray-300">
                🏞️ {input.state}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-300">
                🌱 {input.fruitVegetable}
              </p>
              <p className="text-sm text-gray-300">
                🧬 Variety: {input.variety}
              </p>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-300">
            <p>🌾 Area: {input.area} acres</p>
            <p>📅 Sown: {input.sownMonth} → Harvest: {input.harvestingMonth}</p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-400">No user inputs found</p>
  )}
</section>

            {/* Agriculture Data */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Agriculture Data</h2>
          <div className="text-sm text-gray-400">
            Showing {filteredCropData.length.toLocaleString()} records
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-gray-800 rounded animate-pulse" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] table-auto w-full border border-gray-200 mt-4 text-sm">
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
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 gap-4">
                <button
                  onClick={() => handlePageChange(-1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  );
}