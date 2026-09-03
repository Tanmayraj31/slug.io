import { useState, type FormEvent } from "react";
import { Link2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createLink } from "@/api/links";
import { useToast } from "@/context/ToastContext";
import { ApiClientError } from "@/api/client";

interface LinkCreationFormProps {
  onCreated: () => Promise<void> | void;
}

export function LinkCreationForm({ onCreated }: LinkCreationFormProps) {
  const { addToast } = useToast();
  const [url, setUrl] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [planLimitError, setPlanLimitError] = useState<string | null>(null);

  function validateUrl(value: string): boolean {
    if (!value.trim()) {
      setFieldError("URL is required");
      return false;
    }
    try {
      new URL(value);
      setFieldError(undefined);
      return true;
    } catch {
      setFieldError("Please enter a valid URL (e.g. https://example.com)");
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateUrl(url)) {
      return;
    }
    setLoading(true);
    setPlanLimitError(null);
    try {
      await createLink({ originalUrl: url });
      setUrl("");
      setFieldError(undefined);
      addToast("Link shortened!", "success");
      await onCreated();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "PLAN_LIMIT_REACHED") {
          setPlanLimitError(err.message);
        } else if (err.code === "VALIDATION_ERROR" && err.details) {
          const urlError = err.details["originalUrl"] ?? err.details["url"];
          setFieldError(urlError ?? err.message);
        } else {
          setFieldError(err.message);
        }
      } else {
        setFieldError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 md:flex-row md:items-end"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex-1">
        {planLimitError && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <p className="font-semibold">{planLimitError}</p>
              <p className="mt-1 text-sm text-amber-600">
                Upgrade to Pro for unlimited links and advanced analytics.
              </p>
            </div>
          </div>
        )}
        <Input
          id="new-link"
          label="Paste a long URL"
          type="url"
          placeholder="https://example.com/very/long/url/to/shorten"
          icon={<Link2 className="h-5 w-5" aria-hidden="true" />}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (fieldError) {
              setFieldError(undefined);
            }
            if (planLimitError) {
              setPlanLimitError(null);
            }
          }}
          error={fieldError}
        />
      </div>
      <Button type="submit" size="lg" icon={<Plus className="h-5 w-5" aria-hidden="true" />} loading={loading}>
        Shorten link
      </Button>
    </form>
  );
}
