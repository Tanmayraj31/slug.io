import { Link } from "react-router";
import {
  BarChart3,
  Link2,
  ShieldCheck,
  TrendingUp,
  Zap,
  Globe,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    icon: Zap,
    title: "Create in seconds",
    description:
      "Paste any long URL and get a clean, short link instantly. No sign-up friction, no waiting.",
  },
  {
    icon: BarChart3,
    title: "Powerful analytics",
    description:
      "Track clicks, referrers, devices, and countries over time. Know exactly how your links perform.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable & secure",
    description:
      "Fast redirects with 99.9% uptime. Your links keep working, backed by a robust API.",
  },
];

const stats = [
  { label: "Links created", value: "1M+" },
  { label: "Clicks tracked", value: "50M+" },
  { label: "Uptime", value: "99.9%" },
];

export function HomePage() {
  const { user } = useAuth();
  const isAuthenticated = user !== null;

  return (
    <div className="mesh-bg min-h-screen">
      <Header />

      <main id="main-content" className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 text-center">
          <div className="animate-fade-in mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 bg-orange-50/60 px-4 py-1.5 text-sm font-medium text-orange-700 backdrop-blur">
              <Globe className="h-4 w-4" aria-hidden="true" />
              Free forever plan · No credit card required
            </span>
          </div>

          <h1
            className="animate-slide-up mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-7xl"
          >
            Simple links,{" "}
            <span className="gradient-text">serious insights</span>
          </h1>

          <p
            className="animate-slide-up-delayed mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl"
          >
            Shorten any URL and watch its performance unfold. Clean tracking,
            beautiful analytics, and links you can trust — all in one place.
          </p>

          <div className="animate-slide-up-delayed mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="glow-hover">
                  Go to your dashboard
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="glow-hover">
                    Get started for free
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="secondary">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="animate-fade-in mt-16 grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="gradient-text text-3xl font-extrabold md:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-base font-medium text-gray-500 md:text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} hover className="p-7">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-400/15">
                  <feature.icon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-4">
            <Card className="overflow-hidden">
              <div className="grid items-center gap-8 p-8 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-6 w-6 text-orange-600" aria-hidden="true" />
                    <span className="text-base font-semibold text-orange-600">
                      Link management
                    </span>
                  </div>
                  <h2 className="mt-3 text-4xl font-bold text-gray-900">
                    One dashboard for{" "}
                    <span className="gradient-text">every link</span>
                  </h2>
                  <p className="mt-4 text-lg text-gray-600">
                    Organize, filter, and manage all your short links from a
                    single view. Status filters, pagination, and one-click
                    actions keep everything under control.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" /> Click tracking
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-500">
                      <Globe className="h-4 w-4" aria-hidden="true" /> Global reach
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
                      <Gauge className="h-4 w-4" aria-hidden="true" /> Instant redirects
                    </span>
                  </div>
                </div>

                <div className="glass-card-hover rounded-xl bg-gray-50/80 p-7">
                  <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-gray-700">
                        https://example.com/very/long/path/that/goes/on/forever
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-orange-600">
                        shrtl.ink/7x4f2q
                      </p>
                    </div>
                    <span className="ml-3 flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                      <div className="text-xl font-bold text-gray-900">1,240</div>
                      <div className="text-sm font-medium text-gray-500">
                        Clicks
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                      <div className="text-xl font-bold text-gray-900">34</div>
                      <div className="text-sm font-medium text-gray-500">
                        Countries
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                      <div className="text-xl font-bold text-gray-900">72%</div>
                      <div className="text-sm font-medium text-gray-500">
                        Mobile
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/60 bg-white/60 py-8 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 text-center text-base text-gray-500">
          <span className="font-medium text-gray-700">ShortLink</span> — shorten
          link is a way to tracking your links.
        </div>
      </footer>
    </div>
  );
}
