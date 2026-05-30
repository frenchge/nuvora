"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    if (!open) {
      setConfirmation("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  async function onDelete() {
    if (confirmation !== "DELETE") {
      setError("Type DELETE exactly to confirm account removal.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const r = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.error ?? "Couldn't delete the account.");
      }

      await signOut({ redirectUrl: "/" });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const canDelete = confirmation === "DELETE" && !busy;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="destructive" className="gap-2">
          Delete my account
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div className="border-b border-border/50 bg-[linear-gradient(180deg,rgba(255,94,94,0.09),rgba(255,94,94,0))] px-6 py-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/12 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-semibold tracking-tight">
                    Permanently delete your account
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    This will permanently remove your Vercilio account, chat history,
                    and any active subscription. This action cannot be undone.
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 md:px-7">
            <div className="space-y-2">
              <label
                htmlFor="delete-account-confirmation"
                className="text-sm font-medium text-foreground"
              >
                Type <span className="font-semibold tracking-[0.14em]">DELETE</span> to
                confirm
              </label>
              <Input
                id="delete-account-confirmation"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="DELETE"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                disabled={busy}
                className="h-12 rounded-2xl border-border/70 text-base"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="min-w-32 rounded-xl" disabled={busy}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                className="min-w-40 rounded-xl"
                disabled={!canDelete}
                onClick={onDelete}
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
