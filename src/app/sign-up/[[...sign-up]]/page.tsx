import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/components/auth/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Start using better AI with real impact built in."
      subtitle="Create your account to access the best models in one place, with usage that can help support environmental work each month."
    >
      <SignUp appearance={clerkAuthAppearance} />
    </AuthShell>
  );
}
