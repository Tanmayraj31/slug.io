import { Link } from "react-router";
import { Home } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="mesh-bg min-h-screen">
      <Header />
      <main id="main-content" className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
        <div className="animate-slide-up text-center">
          <div className="gradient-text text-6xl font-extrabold sm:text-8xl md:text-9xl">
            404
          </div>
          <p className="mt-4 text-xl font-semibold text-gray-700 sm:text-2xl">
            Page not found
          </p>
          <p className="mt-2 text-lg text-gray-500">
            The page you&apos;re looking for doesn&apos;t exist or was moved
          </p>
          <div className="mt-8">
            <Link to="/">
              <Button icon={<Home className="h-5 w-5" aria-hidden="true" />}>
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
