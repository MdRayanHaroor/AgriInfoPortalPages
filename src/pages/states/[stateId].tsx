import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StateMap from "@/components/StateMap";
import { stateIdToStateNameMapping } from "@/data/statesMap";

interface RecordData {
  crop: string;
  season: string;
  crop_year: number;
  district_name: string;
}

interface ApiRecord {
  crop: string;
  season: string;
  crop_year: number;
  district_name: string;
  // Other API fields can be added if needed
}

export default function StateDetailPage() {
  const router = useRouter();
  const [stateData, setStateData] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawStateId = router.query.stateId;
    const stateId = Array.isArray(rawStateId) ? rawStateId[0] : rawStateId;

    if (!stateId) {
      setError("Invalid state ID");
      setLoading(false);
      return;
    }

    const stateName = stateIdToStateNameMapping[stateId]; // For API queries
    if (!stateName) {
      setError("Invalid state ID");
      setLoading(false);
      return;
    }

    // Build the API URL for the state
    const apiKey = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
    const url = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&filters[state_name]=${encodeURIComponent(
      stateName
    )}`;

    console.log("Fetching data from URL:", url);

    fetch(url)
      .then((res) => {
        console.log("Response Status:", res.status);
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Data:", data);
        const records = data.records.map((record: ApiRecord) => ({
          crop: record.crop,
          season: record.season,
          crop_year: record.crop_year,
          district_name: record.district_name,
        }));
        setStateData(records);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router.query.stateId]);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        State: {router.query.stateId?.toString().toUpperCase()}
      </h1>
      <StateMap
        stateId={router.query.stateId?.toString() || ""}
        topoUrl="/india-states-topo.json"
      />

      <h2 className="text-xl font-bold mt-8">State Agriculture Data</h2>
      {stateData.length ? (
        <table className="table-auto w-full border border-gray-200 mt-4">
          <thead>
            <tr className="text-black bg-gray-100">
              <th className="px-4 py-2 border">Crop</th>
              <th className="px-4 py-2 border">Season</th>
              <th className="px-4 py-2 border">Year</th>
              <th className="px-4 py-2 border">District</th>
            </tr>
          </thead>
          <tbody>
            {stateData.map((record: RecordData, index: number) => (
              <tr key={index}>
                <td className="px-4 py-2 border">{record.crop}</td>
                <td className="px-4 py-2 border">{record.season}</td>
                <td className="px-4 py-2 border">{record.crop_year}</td>
                <td className="px-4 py-2 border">{record.district_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available for the selected state.</p>
      )}
    </section>
  );
}
