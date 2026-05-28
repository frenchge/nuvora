import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/components/auth/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell
      title="Come back to the AI workspace that does a little more."
      subtitle="Sign in to pick up your chats, your credits, and the environmental contribution your account helps fund."
    >
      <SignIn appearance={clerkAuthAppearance} />
    </AuthShell>
  );
}
