type Params = Promise<{ id: string }>;

export default async function MemberClubDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Member Club</h1>
      <p className="text-sm text-gray-400">
        Member club detail placeholder (ID: {id})
      </p>
    </main>
  );
}
