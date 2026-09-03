import { useEffect, Suspense, lazy } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Tag,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkActions } from "@/components/links/LinkActions";
import { useLinkDetail } from "@/hooks/useLinkDetail";
import { useToast } from "@/context/ToastContext";

const AnalyticsSection = lazy(() =>
  import("@/components/analytics/AnalyticsSection").then((m) => ({
    default: m.AnalyticsSection,
  })),
);

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-green-600",
  DISABLED: "bg-gray-100 text-gray-500",
  DELETED: "bg-red-50 text-red-500",
} as const;

const STATUS_DOT = {
  ACTIVE: "bg-green-500",
  DISABLED: "bg-gray-400",
  DELETED: "bg-red-500",
} as const;

export function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const linkId = Number(id);
  const { link, analytics, loading, notFound, error, featureUnavailable, actionLoading, disable, enable, remove, removed } =
    useLinkDetail(linkId);

  useEffect(() => {
    if (removed) {
      addToast("Link deleted", "success");
      navigate("/dashboard", { replace: true });
    }
  }, [removed, navigate, addToast]);

  if (Number.isNaN(linkId)) {
    return <NotFound />;
  }

  const copy = async () => {
    if (!link) {
      return;
    }
    await navigator.clipboard.writeText(link.shortUrl);
    addToast("Copied to clipboard", "success");
  };

  return (
    <div className="mesh-bg min-h-screen">
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-base font-medium text-gray-500 transition-colors hover:text-orange-600"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="animate-slide-up mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Loading link details...</span>
                <div className="order-first space-y-6 lg:order-last lg:col-span-1">
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl bg-gray-50/80 p-4 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-6">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-200 mb-4" />
                  <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
              </div>
            ) : notFound ? (
              <NotFound />
            ) : featureUnavailable ? (
              <Card className="p-10 text-center">
                <div
                  role="alert"
                  className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base font-medium text-amber-800"
                >
                  <p className="font-semibold">Detailed analytics are available on the Pro plan.</p>
                  <p className="mt-1 text-sm font-normal text-amber-700">
                    Upgrade to Pro to view advanced analytics for your links.
                  </p>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-10 text-center">
                <div
                  role="alert"
                  className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-600"
                >
                  {error}
                </div>
              </Card>
            ) : link ? (
              <>
                <Card className="mb-6 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-400 text-white">
                        <Link2 className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                          Link <span className="gradient-text">#{link.id}</span>
                        </h1>
                        <span
                          className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-medium ${STATUS_STYLES[link.status]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[link.status]}`} />
                          {link.status.charAt(0) + link.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {link.status !== "DELETED" && (
                      <LinkActions
                        link={link}
                        actionLoading={actionLoading}
                        onDisable={async () => {
                          await disable();
                          addToast("Link disabled", "success");
                        }}
                        onEnable={async () => {
                          await enable();
                          addToast("Link enabled", "success");
                        }}
                        onDelete={() => {
                          void remove();
                        }}
                      />
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-gray-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-base font-semibold text-orange-600">
                        {link.shortUrl}
                      </p>
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open short URL in new tab"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-1 truncate text-base text-gray-600">{link.originalUrl}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" size="sm" onClick={copy}>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy URL
                    </Button>
                  </div>
                </Card>

                {analytics && (
                  <Suspense
                    fallback={
                      <Card className="p-6">
                        <div className="h-72 animate-pulse rounded-xl bg-gray-200/70" />
                      </Card>
                    }
                  >
                    <AnalyticsSection analytics={analytics} />
                  </Suspense>
                )}
              </>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="p-6 text-center">
              <div className="gradient-text text-4xl font-extrabold sm:text-6xl">
                {link?.totalClicks.toLocaleString() ?? "—"}
              </div>
              <div className="mt-1 text-base font-medium text-gray-500">Total clicks</div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Link details</h3>
              {link ? (
                <dl className="space-y-3 text-base">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" aria-hidden="true" /> Created
                    </dt>
                    <dd className="font-medium text-gray-700">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" aria-hidden="true" /> Expires
                    </dt>
                    <dd className="font-medium text-gray-700">
                      {link.expiresAt
                        ? new Date(link.expiresAt).toLocaleDateString()
                        : "Never"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Tag className="h-4 w-4" aria-hidden="true" /> Custom
                    </dt>
                    <dd className="font-medium text-gray-700">
                      {link.isCustom ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Clicks</dt>
                    <dd className="font-medium text-gray-700">
                      {link.totalClicks.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-400">—</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mesh-bg min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
        <div className="gradient-text text-6xl font-extrabold">404</div>
        <p className="mt-4 text-lg text-gray-600">This link could not be found.</p>
        <Link to="/dashboard" className="mt-8">
          <Button>Back to dashboard</Button>
        </Link>
      </main>
    </div>
  );
}
