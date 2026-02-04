type Params = Promise<{ name: string; year: string }>;

export default async function TournamentYearPage({
  params,
}: {
  params: Params;
}) {
  const { name, year } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        {decodeURIComponent(name)} - {year}
      </h1>
      <p className="text-sm text-gray-400">
        Tournament detail placeholder for {decodeURIComponent(name)} ({year})
      </p>
    </main>
  );
}
