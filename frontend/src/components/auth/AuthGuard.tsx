import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link2 } from "lucide-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mesh-bg flex min-h-screen items-center justify-center" role="status" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-400 text-white">
            <Link2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
