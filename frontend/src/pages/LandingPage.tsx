export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Beautiful Table
          </h1>
          <p className="text-xl text-gray-600">
            Transform your data into stunning, interactive tables
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Get Started
            </h2>
            <p className="text-gray-600 mb-6">
              Upload your TSV or CSV files and create beautiful tables in seconds.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Upload File
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Easy Upload
              </h3>
              <p className="text-gray-600">
                Simply drag and drop your TSV or CSV files
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Smart Parsing
              </h3>
              <p className="text-gray-600">
                Automatically detects and parses your data format
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Beautiful Design
              </h3>
              <p className="text-gray-600">
                Professional tables with customizable styling
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
