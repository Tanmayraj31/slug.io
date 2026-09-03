import { useState } from "react";
import { Power, Trash2 } from "lucide-react";
import type { LinkResponseDto } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface LinkActionsProps {
  link: LinkResponseDto;
  actionLoading: boolean;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
}

export function LinkActions({
  link,
  actionLoading,
  onDisable,
  onEnable,
  onDelete,
}: LinkActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = link.status === "ACTIVE";

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {link.status === "DELETED" ? null : (
          <Button
            variant={isActive ? "secondary" : "primary"}
            size="sm"
            loading={actionLoading}
            onClick={isActive ? onDisable : onEnable}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
            {isActive ? "Disable" : "Enable"}
          </Button>
        )}
        {link.status !== "DELETED" && (
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>

      <Dialog
        open={confirmOpen}
        title="Delete this link?"
        description={`This will permanently disable "${link.shortUrl}". This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={actionLoading}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
