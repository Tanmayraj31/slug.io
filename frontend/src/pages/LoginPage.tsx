import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowRight, Link2, Lock, Mail } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiClientError } from "@/api/client";

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      addToast("Welcome back!", "success");
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "VALIDATION_ERROR" && err.details) {
          setFieldErrors({
            email: err.details["email"],
            password: err.details["password"],
          });
          setError(null);
          return;
        }
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mesh-bg min-h-screen">
      <Header />
      <main id="main-content" className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-16">
        <div className="animate-slide-up w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-400 text-white shadow-lg shadow-orange-500/20">
              <Link2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Enter your credentials to manage your links
            </p>
          </div>

          <Card className="p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-600"
              >
                {error}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-5 w-5" aria-hidden="true" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.password}
                autoComplete="current-password"
              />

              <Button type="submit" className="w-full" loading={loading}>
                Log in
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-base text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
