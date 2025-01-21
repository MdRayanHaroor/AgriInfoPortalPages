import { useEffect, useState } from "react";

export default function DataGovApi() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the API
    fetch(
      "https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=579b464db66ec23bdd00000198902acca33045767c8a79dfc3f0ce11&format=json"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log("API Data:", result);
        setData(result);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Data from data.gov.in API</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
