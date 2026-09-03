import { Link2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkCreationForm } from "@/components/links/LinkCreationForm";
import { LinkCard } from "@/components/links/LinkCard";
import { LinkFilters } from "@/components/links/LinkFilters";
import { Pagination } from "@/components/ui/Pagination";
import { useLinks } from "@/hooks/useLinks";

export function DashboardPage() {
  const {
    links,
    total,
    totalPages,
    page,
    status,
    loading,
    error,
    setPage,
    setStatus,
    refresh,
  } = useLinks();

  return (
    <div className="mesh-bg min-h-screen">
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-slide-up mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Link <span className="gradient-text">dashboard</span>
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Create, manage, and analyze your short links
          </p>
        </div>

        <Card className="animate-slide-up-delayed mb-8">
          <LinkCreationForm onCreated={refresh} />
        </Card>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LinkFilters active={status} onChange={setStatus} />

          <div className="text-base text-gray-500">
            {total} {total === 1 ? "link" : "links"}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-600"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-fade-in space-y-4" role="status" aria-busy="true">
            <span className="sr-only">Loading links...</span>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="flex items-center gap-6 md:gap-8">
                    <div className="text-center">
                      <div className="mx-auto h-7 w-12 animate-pulse rounded bg-gray-200" />
                      <div className="mt-1 mx-auto h-3 w-10 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
                      <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <Link2 className="h-6 w-6 text-orange-500" aria-hidden="true" />
            </div>
            <p className="font-medium text-gray-700">
              {status === "ALL" ? "No links yet" : "No links match this filter"}
            </p>
            <p className="mt-1 text-base text-gray-500">
              {status === "ALL"
                ? "Create your first short link above to get started"
                : "Try switching to the All filter to see all your links"}
            </p>
          </Card>
        ) : (
          <>
            <div className="animate-fade-in space-y-4">
              {links.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
