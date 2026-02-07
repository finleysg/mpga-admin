export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">
            MPGA Administration
          </h2>
        </div>
        <div className="px-6 py-8 text-center text-gray-500">
          Welcome to the MPGA admin dashboard.
        </div>
      </div>
    </main>
  );
}
