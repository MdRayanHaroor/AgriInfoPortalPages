import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-green-600 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About AgriInfo Portal</h1>
          <p className="text-green-100 max-w-2xl mx-auto">
            Empowering agricultural communities through comprehensive, 
            accessible, and up-to-date information across India
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-4">
              AgriInfo Portal is dedicated to bridging the information gap in 
              agricultural data by providing a comprehensive platform that 
              combines official government data with user-contributed insights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Data Sources
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">
                  Official Government Data
                </h3>
                <p className="text-gray-700">
                  We integrate directly with the data.gov.in API to provide 
                  authentic, real-time agricultural data including:
                </p>
                <ul className="list-disc list-inside text-gray-600 pl-4">
                  <li>Crop details</li>
                  <li>Seasonal information</li>
                  <li>District-wise agricultural statistics</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">
                  Community-Contributed Insights
                </h3>
                <p className="text-gray-700">
                  Our platform allows users to share their agricultural 
                  experiences and local insights, creating a collaborative 
                  knowledge base that complements official data.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Key Features
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">
                  Interactive Map
                </h3>
                <p className="text-gray-600">
                  Explore agricultural data across different states 
                  through our intuitive interactive map.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">
                  Crop Insights
                </h3>
                <p className="text-gray-600">
                  Discover detailed information about various crops 
                  and their cultivation across India.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">
                  Bidding Platform
                </h3>
                <p className="text-gray-600">
                  Connect farmers and traders through our transparent 
                  agricultural bidding system.
                </p>
              </div>
            </div>
          </section>

          <section className="text-center">
            <p className="text-gray-700">
              Ready to explore? Start by visiting our{" "}
              <Link href="/" className="text-green-600 hover:underline">
                Home Page
              </Link>{" "}
              or selecting a state from the{" "}
              <Link href="/states" className="text-green-600 hover:underline">
                States Page
              </Link>.
            </p>
          </section>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-100 p-8 text-center">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Got Questions or Suggestions?
          </h2>
          <p className="text-gray-700 mb-4">
            We&apos;re always eager to hear from our users and improve our platform.
          </p>
          <div className="flex justify-center">
            <Link 
              href="/contact" 
              className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}