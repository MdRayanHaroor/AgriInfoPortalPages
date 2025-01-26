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
}

export default function StateDetailPage() {
  const router = useRouter();
  const [stateData, setStateData] = useState<RecordData[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStateData = async () => {
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

      try {
        setLoading(true);

        // Fetch data from data.gov.in API
        const apiKey = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
        const apiUrl = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&filters[state_name]=${encodeURIComponent(
          stateName
        )}`;
        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) {
          throw new Error(`Failed to fetch API data: ${apiResponse.status}`);
        }
        const apiData = await apiResponse.json();
        const apiRecords = apiData.records.map((record: RecordData) => ({
          crop: record.crop,
          season: record.season,
          crop_year: record.crop_year,
          district_name: record.district_name,
        }));
        setStateData(apiRecords);

        // Fetch user inputs from MongoDB Atlas
        const userInputsResponse = await fetch(`/api/get-user-inputs?state=${encodeURIComponent(stateName)}`);
        if (!userInputsResponse.ok) {
          throw new Error(`Failed to fetch user inputs: ${userInputsResponse.status}`);
        }
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

<h2 className="text-xl font-bold mt-8">User Inputs</h2>
      {userInputs.length ? (
        <table className="table-auto w-full border border-gray-200 mt-4">
          <thead>
            <tr className="text-black bg-gray-100">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">District</th>
              <th className="px-4 py-2 border">Village</th>
              <th className="px-4 py-2 border">Fruit/Vegetable</th>
              <th className="px-4 py-2 border">Variety</th>
              <th className="px-4 py-2 border">Area (Acres)</th>
              <th className="px-4 py-2 border">Sown Month</th>
              <th className="px-4 py-2 border">Harvesting Month</th>
            </tr>
          </thead>
          <tbody>
            {userInputs.map((input: UserInputData, index: number) => (
              <tr key={index}>
                <td className="px-4 py-2 border">{input.name}</td>
                <td className="px-4 py-2 border">{input.email}</td>
                <td className="px-4 py-2 border">{input.phone}</td>
                <td className="px-4 py-2 border">{input.district}</td>
                <td className="px-4 py-2 border">{input.village}</td>
                <td className="px-4 py-2 border">{input.fruitVegetable}</td>
                <td className="px-4 py-2 border">{input.variety}</td>
                <td className="px-4 py-2 border">{input.area}</td>
                <td className="px-4 py-2 border">{input.sownMonth}</td>
                <td className="px-4 py-2 border">{input.harvestingMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No user inputs available for the selected state.</p>
      )}

      <h2 className="text-xl font-bold mt-8">State Agriculture Data (data.gov.in)</h2>
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
