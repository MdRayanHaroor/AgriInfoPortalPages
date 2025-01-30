import { useEffect, useState } from "react";
import Link from "next/link";

export default function Crops() {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
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
    
    return (
        <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-4 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">
        ⬅ Back to Home
        </Link>
        </div>
        <h2 className="text-3xl font-bold text-center mb-6">Select a Crop</h2>
        {loading ? (
            <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-t-2 border-white-500 rounded-full"></div>
            </div>
        ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {crops.map((crop, index) => (
                <Link key={index} href={`/crops/${encodeURIComponent(crop)}`}>
                <div className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition cursor-pointer">
                {crop}
                </div>
                </Link>
            ))}
            </div>
        )}
        {/* <div className="mt-6 text-center">
        <Link href="/" className="text-blue-500 hover:underline">
        ⬅ Back to Home
        </Link>
        </div> */}
        </main>
    );
}
