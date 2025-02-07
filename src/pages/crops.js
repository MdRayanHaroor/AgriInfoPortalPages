import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Cache key for localStorage
const CROP_CACHE_KEY = 'cachedCrops';
// Debounce time for search input (ms)
const DEBOUNCE_TIME = 300;

// Moved outside component to prevent recreation
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CROP_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('LocalStorage access error:', error);
    return null;
  }
};

export default function Crops() {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchCrops = async () => {
            try {
                const cached = getCachedData();
                if (cached) {
                    setCrops(cached);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(null);
                
                const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY;
                const apiUrl = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&limit=all`;
                
                const response = await fetch(apiUrl, { signal });
                if (!response.ok) throw new Error("Failed to fetch crop data");
                
                const data = await response.json();
                
                // Optimized unique crop extraction
                const cropSet = new Set();
                data.records.forEach((record) => cropSet.add(record.crop));
                const uniqueCrops = Array.from(cropSet).sort((a, b) => a.localeCompare(b));
                
                setCrops(uniqueCrops);
                localStorage.setItem(CROP_CACHE_KEY, JSON.stringify(uniqueCrops));
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || "An error occurred");
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchCrops();
        return () => controller.abort();
    }, []);

    // Debounced search term update
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(searchInput);
        }, DEBOUNCE_TIME);

        return () => clearTimeout(handler);
    }, [searchInput]);

    // Memoized filtered crops
    const filteredCrops = useMemo(() => {
        if (!searchTerm) return crops;
        const lowerTerm = searchTerm.toLowerCase();
        return crops.filter(crop => crop.toLowerCase().includes(lowerTerm));
    }, [crops, searchTerm]);

    return (
        <main className="p-6 max-w-6xl mx-auto">
            <div className="mb-4 text-sm">
                <Link href="/" className="text-blue-500 hover:underline">
                    ⬅ Back to Home
                </Link>
            </div>
            
            <h2 className="text-3xl font-bold text-center mb-6">Select a Crop</h2>

            {/* Optimized search input */}
            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    placeholder="Search for a crop..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border px-4 py-2 rounded w-full max-w-md text-black"
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-10 w-10 border-t-2 dark:border-white border-black rounded-full"></div>
                </div>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCrops.length > 0 ? (
                        filteredCrops.map((crop, index) => (
                            <Link 
                                key={`${crop}-${index}`} 
                                href={`/crops/${encodeURIComponent(crop)}`}
                                legacyBehavior
                            >
                                <a className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition cursor-pointer block">
                                    {crop}
                                </a>
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center col-span-full">
                            No crops found matching &quot;{searchTerm}&quot;.
                        </p>
                    )}
                </div>
            )}
        </main>
    );
}