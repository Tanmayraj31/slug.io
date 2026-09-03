import { Link } from "react-router";
import { Copy, ExternalLink } from "lucide-react";
import type { LinkResponseDto } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

const STATUS_STYLES: Record<LinkResponseDto["status"], string> = {
  ACTIVE: "bg-green-50 text-green-600",
  DISABLED: "bg-gray-100 text-gray-500",
  DELETED: "bg-red-50 text-red-500",
};

const STATUS_DOT: Record<LinkResponseDto["status"], string> = {
  ACTIVE: "bg-green-500",
  DISABLED: "bg-gray-400",
  DELETED: "bg-red-500",
};

export function LinkCard({ link }: { link: LinkResponseDto }) {
  const { addToast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(link.shortUrl);
    addToast("Copied to clipboard", "success");
  };

  const statusLabel =
    link.status.charAt(0).toUpperCase() + link.status.slice(1).toLowerCase();

  return (
    <Card
      hover
      padded={false}
      className="flex flex-col gap-4 p-5 md:flex-row md:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[link.status]}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[link.status]}`} />
            {statusLabel}
          </span>
          <span className="text-sm text-gray-400">#{link.id}</span>
        </div>
        <p className="mt-2 truncate text-base font-medium text-gray-700">
          {link.originalUrl}
        </p>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-base font-semibold text-orange-600 transition-colors hover:text-orange-700 hover:underline"
          aria-label="Open short URL in new tab"
        >
          {link.shortUrl}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        {link.expiresAt && (
          <p className="mt-0.5 text-sm text-gray-400">
            Expires {new Date(link.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 md:gap-8">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {link.totalClicks.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-500">clicks</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Link to={`/links/${link.id}`}>
            <Button variant="ghost" size="sm" aria-label="View link details">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
