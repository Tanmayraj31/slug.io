import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Link2, Lock, Mail, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiClientError } from "@/api/client";

export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string; username?: string } = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (username.length > 50) {
      errors.username = "Username must be 50 characters or fewer";
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
      await register(email, password, username || undefined);
      addToast("Account created successfully!", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "VALIDATION_ERROR" && err.details) {
          setFieldErrors({
            email: err.details["email"],
            username: err.details["username"],
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
              Create your <span className="gradient-text">account</span>
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Start shortening URLs in seconds
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
                id="username"
                label="Username"
                type="text"
                placeholder="alice"
                icon={<User className="h-5 w-5" aria-hidden="true" />}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                error={fieldErrors.username}
                autoComplete="username"
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                icon={<Lock className="h-5 w-5" aria-hidden="true" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.password}
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" loading={loading}>
                Create account
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-base text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
