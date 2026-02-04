type Params = Promise<{ name: string }>;

export default async function TournamentHistoryPage({
  params,
}: {
  params: Params;
}) {
  const { name } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        {decodeURIComponent(name)} - History
      </h1>
      <p className="text-sm text-gray-400">
        Tournament history placeholder for {decodeURIComponent(name)}
      </p>
    </main>
  );
}
