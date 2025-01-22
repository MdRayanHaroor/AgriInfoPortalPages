import Link from "next/link";

export default function About() {
  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">About AgriInfo Portal</h1>
      <p className="mb-4 text-lg">
        Welcome to the AgriInfo Portal, your go-to source for comprehensive and
        up-to-date agricultural information for each state in India.
      </p>
      <p className="mb-4 text-lg">
        This website provides two types of information about each state&apos;s
        agriculture:
      </p>
      <ol className="list-decimal list-inside mb-4 text-lg">
        <li>
          <strong>Data from the data.gov.in API:</strong> Our portal integrates
          with the official government data source to provide authentic and
          real-time agricultural data such as crop details, seasons, and
          district-wise statistics.
        </li>
        <li>
          <strong>User-Contributed Information (Feature Coming Soon):</strong>{" "}
          In the near future, users will be able to input and share their
          agricultural data and insights for specific states and districts. This
          feature aims to empower the community by providing crowd-sourced
          insights alongside official data.
        </li>
      </ol>
      <p className="mb-4 text-lg">
        Our mission is to help farmers, researchers, and policymakers access
        reliable agricultural data to make informed decisions and promote
        sustainable farming practices.
      </p>
      <p className="mb-4 text-lg">
        Explore the map on our <Link href="/" className="text-blue-600 underline">Home Page</Link> or select a state from the <Link href="/states" className="text-blue-600 underline">States Page</Link> to view detailed information.
      </p>
      <p className="text-lg">
        Have suggestions or ideas? We’d love to hear from you! Contact us at{" "}
        <a href="mailto:contact@agriinfoportal.com" className="text-blue-600 underline">
          contact@agriinfoportal.com
        </a>.
      </p>
    </section>
  );
}
