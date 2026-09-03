import { Link, useLocation, useNavigate } from "react-router";
import { Link2, LogOut, Menu, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isAuthenticated = user !== null;

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    navigate("/");
  }

  const navItems = isAuthenticated
    ? [{ label: "Dashboard", to: "/dashboard" }]
    : [
        { label: "Log in", to: "/login" },
        { label: "Sign up", to: "/register" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-amber-400 text-white shadow-md">
            <Link2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Short<span className="gradient-text">Link</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`text-base font-medium transition-colors ${
                location.pathname === item.to ||
                (item.to === "/login" && location.pathname === "/register") ||
                (item.to === "/register" && location.pathname === "/login")
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && user?.username && (
            <span className="flex items-center gap-1.5 text-base font-medium text-gray-500">
              <User className="h-4 w-4" aria-hidden="true" />
              {user.username}
            </span>
          )}
          {isAuthenticated && (
            <button
              className="flex items-center gap-1.5 text-base font-medium text-gray-600 transition-colors hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          )}
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" className="border-t border-gray-200/60 bg-white/95 px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  {item.label}
                </span>
              </Link>
            ))}
            {isAuthenticated && (
              <button
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
