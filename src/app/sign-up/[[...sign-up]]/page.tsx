import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

// Auth pages shouldn't surface in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <SignUp appearance={{ elements: { card: "shadow-none" } }} />
    </div>
  );
}