import { useEffect, useState } from "react";
import Link from "next/link";

export default function Crops() {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // 🔍 Search term state

    useEffect(() => {
        const fetchCrops = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY;
                const apiUrl = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&limit=all`;
                
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error("Failed to fetch crop data");
                
                const data = await response.json();
                
                // Extract unique crops
                const uniqueCrops = Array.from(new Set(data.records.map((record) => record.crop))).sort(
                    (a, b) => a.localeCompare(b)
                );
                
                setCrops(uniqueCrops);
            } catch (err) {
                setError(err.message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCrops();
    }, []);

    // 🔍 Filter crops based on search term
    const filteredCrops = crops.filter((crop) =>
        crop.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="p-6 max-w-6xl mx-auto">
            <div className="mb-4 text-sm">
                <Link href="/" className="text-blue-500 hover:underline">
                    ⬅ Back to Home
                </Link>
            </div>
            
            <h2 className="text-3xl font-bold text-center mb-6">Select a Crop</h2>

            {/* 🔍 Search Bar */}
            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    placeholder="Search for a crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-full max-w-md text-black"
                />
            </div>
           

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>
                </div>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCrops.length > 0 ? (
                        filteredCrops.map((crop, index) => (
                            <Link key={index} href={`/crops/${encodeURIComponent(crop)}`}>
                                <div className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition cursor-pointer">
                                    {crop}
                                </div>
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
