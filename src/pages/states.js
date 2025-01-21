import Link from "next/link"

export default function States() {
  return (
    <>
      {/* Navbar */}
      {/* <nav className="bg-black text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <Link href="/">AgriInfo Portal</Link>
          </h1>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/states" className="hover:underline">States</Link>
            <Link href="/about" className="hover:underline">About</Link>
          </div>
        </div>
      </nav> */}

      {/* States Buttons */}
      <main className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Select a State
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Link
            href="/states/ap"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Andhra Pradesh
          </Link>
          <Link
            href="/states/tg"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Telangana
          </Link>
          <Link
            href="/states/mh"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Maharashtra
          </Link>
          <Link
            href="/states/tn"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Tamil Nadu
          </Link>
          <Link
            href="/states/kl"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Kerala
          </Link>
          <Link
            href="/states/jk"
            className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
          >
            Jammu & Kashmir
          </Link>
        </div>
      </main>
    </>
  )
}
