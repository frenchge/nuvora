"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Self-serve account deletion. We don't try to embed a fancy modal here —
// a confirm dialog asking the user to type DELETE keeps the surface area
// small and matches what GitHub / Stripe / Vercel do for destructive
// account actions.
export function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  const { signOut } = useClerk();

  async function onDelete() {
    const typed = window.prompt(
      "This is permanent. Type DELETE (in caps) to confirm you want to permanently remove your account, your chat history, and any active subscription.",
    );
    if (typed !== "DELETE") return;

    setBusy(true);
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
      // Clerk user is gone server-side; clear the client session and bounce
      // to the marketing home page.
      await signOut({ redirectUrl: "/" });
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Button
      variant="destructive"
      disabled={busy}
      onClick={onDelete}
      className="gap-2"
    >
      {busy ? "Deleting…" : "Delete my account"}
    </Button>
  );
}
