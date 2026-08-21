import { useParams } from "react-router";

export function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Link Detail</h1>
          <p className="text-sm text-gray-500">Link #{id}</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">
            Link detail and analytics will be implemented in Phases 6–7.
          </p>
        </div>
      </main>
    </div>
  );
}
