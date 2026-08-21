import { Link } from "react-router";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">URL Shortener</h1>
          <nav className="flex gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900">
          Shorten your links
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Create short, memorable URLs in seconds. Track clicks and manage your
          links with a powerful dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/register"
            className="rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Get started for free
          </Link>
        </div>
      </main>
    </div>
  );
}
