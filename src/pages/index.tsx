import Link from "next/link"

export default function Home() {
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Welcome to the Agriculture Information Portal
      </h1>
      <p className="text-lg text-gray-600 mb-6 text-center">
        Explore state-wise agriculture details, crop information, and more.
        Click on a state to learn more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          href="/states/ap"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Andhra Pradesh
        </Link>
        <Link
          href="/states/tg"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Telangana
        </Link>
        <Link
          href="/states/mh"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Maharashtra
        </Link>
        <Link
          href="/states/tn"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Tamil Nadu
        </Link>
        <Link
          href="/states/kl"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Kerala
        </Link>
        <Link
          href="/states/jk"
          className="block p-4 bg-blue-100 rounded shadow hover:bg-blue-200 transition"
        >
          Jammu & Kashmir
        </Link>
      </div>
    </main>
  )
}
