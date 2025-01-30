import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface CropData {
    state_name: string;
    district_name: string;
    season: string;
    crop_year: number;
    area: string;
    production_: string;
}

export default function CropDetailPage() {
    const router = useRouter();
    const { cropId } = router.query; // Get the selected crop from URL
    const [cropData, setCropData] = useState<CropData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [states, setStates] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>("");
    const [districts, setDistricts] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [cropYears, setCropYears] = useState<number[]>([]);
    const [selectedCropYear, setSelectedCropYear] = useState<string>("");
    
    useEffect(() => {
        if (!cropId) return;
        
        const fetchCropData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY || '';
                const apiUrl = new URL(`https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de`);
                apiUrl.searchParams.set("api-key", apiKey);
                apiUrl.searchParams.set("format", "json");
                apiUrl.searchParams.set("filters[crop]", cropId as string);
                apiUrl.searchParams.set("limit", "all"); // Fetch all data
                
                const response = await fetch(apiUrl.toString());
                if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
                
                const data = await response.json();
                
                const processedData = data.records.map((record: { 
                    state_name: string; 
                    district_name: string; 
                    season: string; 
                    crop_year: number; 
                    area_: string | null; 
                    production_: string | null;
                  }) => ({
                    state_name: record.state_name,
                    district_name: record.district_name,
                    season: record.season,
                    crop_year: record.crop_year,
                    area: record.area_ || "NA",
                    production_: record.production_ || "NA",
                  }));
                
                setCropData(processedData);
                
                // Extract unique filters dynamically
                const uniqueStates = Array.from(new Set(processedData.map((record: { state_name: string; }) => record.state_name))).sort() as string[];
                setStates(uniqueStates);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCropData();
    }, [cropId]);
    
    useEffect(() => {
        if (!selectedState) {
            setDistricts([]);
            setCropYears([]);
            return;
        }
        
        setLoading(true);
        const filteredDistricts = Array.from(
            new Set(cropData.filter((record) => record.state_name === selectedState).map((record) => record.district_name))
        ).sort();
        
        const filteredYears = Array.from(
            new Set(
                cropData
                .filter((record) => record.state_name === selectedState)
                .map((record) => record.crop_year)
            )
        )
        .filter((year): year is number => typeof year === "number" && !isNaN(year))
        .sort((a, b) => b - a);
        
        setDistricts(filteredDistricts);
        setCropYears(filteredYears);
        setLoading(false);
    }, [selectedState, cropData]);
    
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
    
    const filteredCropData = useMemo(() => {
        return cropData
        .filter((record) => (selectedState ? record.state_name === selectedState : true))
        .filter((record) => (selectedDistrict ? record.district_name === selectedDistrict : true))
        .filter((record) => (selectedCropYear ? record.crop_year.toString() === selectedCropYear : true))
        .slice(0, ); // Limit to 50 latest records
    }, [cropData, selectedState, selectedDistrict, selectedCropYear]);
    
    if (loading)
        return (
        <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>
        </div>
    );
    
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    
    return (
        <section className="p-6 max-w-6xl mx-auto">
        
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
        
        {/* Data Table */}
        {filteredCropData.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="table-auto w-full border border-gray-200 mt-4 text-sm">
            <thead>
            <tr className="text-black bg-gray-100">
            <th className="px-4 py-2 border">State</th>
            <th className="px-4 py-2 border">District</th>
            <th className="px-4 py-2 border">Season</th>
            <th className="px-4 py-2 border">Year</th>
            <th className="px-4 py-2 border">Area (acres)</th>
            <th className="px-4 py-2 border">Production (tonnes)</th>
            </tr>
            </thead>
            <tbody>
            {filteredCropData.map((record, index) => (
                <tr key={index}>
                <td className="px-4 py-2 border">{record.state_name}</td>
                <td className="px-4 py-2 border">{record.district_name}</td>
                <td className="px-4 py-2 border">{record.season}</td>
                <td className="px-4 py-2 border">{record.crop_year}</td>
                <td className="px-4 py-2 border">{record.area}</td>
                <td className="px-4 py-2 border">{record.production_}</td>
                </tr>
            ))}
            </tbody>
            </table>
            </div>
        ) : (
            <p className="text-gray-400 text-center mt-4">No data available for {cropId}.</p>
        )}
        
        <div className="mt-6 text-center">
        <Link href="/crops" className="text-blue-500 hover:underline">
        ⬅ Back to Crops
        </Link>
        </div>
        </section>
    );
}
