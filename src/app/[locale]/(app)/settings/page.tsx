import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import {
  CreditCard,
  Leaf,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAN_DISPLAY, PLAN_ORDER } from "@/lib/plans";
import {
  fetchAction,
  fetchQuery,
  getRequiredConvexToken,
} from "@/lib/convex-server";
import { cn, formatCredits, formatEur } from "@/lib/utils";
import {
  CancelSubscriptionButton,
  CheckoutButton,
  PortalButton,
  ResumeSubscriptionButton,
} from "../billing/_buttons";
import { DeleteAccountButton } from "./_delete-account-button";
import { ContributionChart } from "../contribution/_contribution-chart";
import { SettingsShell } from "./_settings-shell";
import { savePersonalInfo } from "./actions";
import type { PlanName } from "@/lib/types";

export const dynamic = "force-dynamic";

const SETTINGS_TABS = [
  { id: "personal", label: "Personal info", icon: "user" },
  { id: "billing", label: "Billing", icon: "credit-card" },
  { id: "contribution", label: "Contribution", icon: "leaf" },
  { id: "security", label: "Security", icon: "shield" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

type SettingsPageProps = {
  searchParams?: Promise<{
    tab?: string;
    saved?: string;
    success?: string;
    canceled?: string;
    plan?: string;
    session_id?: string;
  }>;
};

type BillingAddon = {
  key: string;
  credits: number;
  price: number;
};

type BillingPayment = {
  id: string;
  amount: number;
  status: string;
  type: string;
  description?: string | null;
  created_at: string;
};

function normalizeTab(value: string | undefined): SettingsTab {
  if (value === "plan") return "billing";
  return SETTINGS_TABS.some((tab) => tab.id === value)
    ? (value as SettingsTab)
    : "personal";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const activeTab = normalizeTab(params?.tab);
  const justSaved = params?.saved === "1";
  const justSucceeded = params?.success === "1";
  const justCanceled = params?.canceled === "1";
  const sessionId = params?.session_id;
  const PLAN_KEYS: PlanName[] = ["free", "basic", "starter", "pro"];
  const subscribedPlan = PLAN_KEYS.includes(params?.plan as PlanName)
    ? (params!.plan as PlanName)
    : null;

  const token = await getRequiredConvexToken();
  let syncError: string | null = null;

  if (justSucceeded && sessionId) {
    try {
      await fetchAction(
        api.stripe.syncCheckoutSession,
        { sessionId },
        { token },
      );
    } catch (error) {
      syncError =
        error instanceof Error
          ? error.message
          : "We could not refresh your plan yet.";
    }
  }

  const [profile, billing, creditsStatus, contribution, clerkUser] = await Promise.all([
    fetchQuery(api.users.me, {}, { token }),
    fetchQuery(api.stripe.getBillingPageData, {}, { token }),
    fetchQuery(api.credits.getCreditsStatus, {}, { token }),
    fetchQuery(api.contributions.getContributionDashboard, {}, { token }),
    currentUser(),
  ]);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const currentPlan =
    PLAN_DISPLAY[profile.plan_name as keyof typeof PLAN_DISPLAY];
  const currentSubscription = billing.subscription;
  const firstName = clerkUser?.firstName ?? "";
  const lastName = clerkUser?.lastName ?? "";
  // The welcome modal is rendered globally by PlanWelcomeWatcher in
  // AppShell — it watches profile.pending_plan_welcome reactively so it
  // pops up the instant either Stripe sync or an admin grant flips the flag,
  // regardless of which route the user is currently on.
  const showWelcomeModal =
    subscribedPlan !== null && subscribedPlan !== "free";
  const accountLooksRefreshed =
    (subscribedPlan ? profile.plan_name === subscribedPlan : false) ||
    (justSucceeded &&
      currentSubscription?.status &&
      ["active", "trialing", "past_due"].includes(currentSubscription.status) &&
      profile.plan_name !== "free");
  const resolvedSyncError = accountLooksRefreshed ? null : syncError;

  return (
    <>
      <SettingsShell
        tabs={SETTINGS_TABS}
        initialTab={activeTab}
        heading="Settings"
        subtitle="Update your details, billing, and contribution settings."
        badgeLabel={currentPlan.label}
        email={profile.email ?? "No email on file"}
        notifications={
          <>
            {justSaved && (
              <Notice>
                Your details were updated.
              </Notice>
            )}
            {justSucceeded && !resolvedSyncError && !showWelcomeModal && (
              <Notice>
                Your payment went through. Your plan and credits have been refreshed.
              </Notice>
            )}
            {justCanceled && (
              <Notice>
                Checkout was canceled.
              </Notice>
            )}
            {resolvedSyncError && (
              <Notice variant="error">
                Your payment succeeded, but we could not refresh the account automatically yet. Try reloading this page in a moment.
              </Notice>
            )}
          </>
        }
        sections={{
          personal: (
                <section className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Personal info
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Keep your account details up to date.
                    </p>
                  </div>

                  <form action={savePersonalInfo} className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Field
                        label="First name"
                        name="firstName"
                        defaultValue={firstName}
                      />
                      <Field
                        label="Last name"
                        name="lastName"
                        defaultValue={lastName}
                      />
                    </div>

                    <div className="grid gap-6 border-t border-border/50 pt-6 md:grid-cols-2">
                      <ReadOnlyField label="Email" value={profile.email ?? "No email available"} />
                      <ReadOnlyField label="Member since" value={formatDate(profile.created_at)} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit">Save changes</Button>
                      <p className="text-xs text-muted-foreground">
                        These details appear across your account.
                      </p>
                    </div>
                  </form>
                </section>
          ),
          billing: (
                <section className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Billing
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your plan, add credits, and review recent payments.
                    </p>
                  </div>

                  <div className="grid gap-6 border-b border-border/50 pb-8 md:grid-cols-3">
                    <SummaryItem
                      label="Credits available"
                      value={formatCredits(creditsStatus.balance)}
                      hint="Ready to use right now"
                    />
                    <SummaryItem
                      label="Current plan"
                      value={currentPlan.label}
                      hint={`${formatCredits(currentPlan.credits)} credits each month`}
                    />
                    <SummaryItem
                      label="Status"
                      value={currentSubscription?.status ?? "Free"}
                      hint={
                        currentSubscription?.current_period_end
                          ? `${currentSubscription.cancel_at_period_end ? "Ends" : "Renews"} ${new Date(currentSubscription.current_period_end).toLocaleDateString()}`
                          : "No active renewal"
                      }
                    />
                    <SummaryItem
                      label="Contribution events"
                      value={String(contribution.summary.totalEvents)}
                      hint="Successful paid charges"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Plans</h3>
                        <p className="text-sm text-muted-foreground">
                          Pick the tier that fits how often you use the app.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {profile.stripe_customer_id && <PortalButton />}
                        {currentSubscription &&
                          ["active", "trialing", "past_due"].includes(
                            currentSubscription.status,
                          ) &&
                          (currentSubscription.cancel_at_period_end ? (
                            <ResumeSubscriptionButton />
                          ) : (
                            <CancelSubscriptionButton
                              endsAt={
                                currentSubscription.current_period_end
                                  ? Date.parse(
                                      currentSubscription.current_period_end,
                                    )
                                  : null
                              }
                            />
                          ))}
                      </div>
                    </div>

                    <div className="divide-y divide-border/50 border-y border-border/50">
                      {PLAN_ORDER.map((planName) => {
                        const plan = PLAN_DISPLAY[planName];
                        const isCurrent = profile.plan_name === plan.name;
                        return (
                          <div
                            key={plan.name}
                            className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold">{plan.label}</h4>
                                {plan.highlighted && (
                                  <Badge variant="secondary" className="rounded-full">
                                    Popular
                                  </Badge>
                                )}
                                {isCurrent && (
                                  <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {plan.price === 0
                                  ? "Free"
                                  : `${formatEur(plan.price, { precision: 0 })} / month`}
                                {" · "}
                                {formatCredits(plan.credits)} credits each month
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {plan.name === "free"
                                  ? "Access to smaller models and a lighter monthly allowance."
                                  : "All paid AI models included on every paid plan."}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {`${plan.trees} trees planted each month`}
                              </p>
                            </div>
                            <div className="w-full lg:w-44">
                              {plan.name === "free" ? (
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  disabled={isCurrent}
                                >
                                  {isCurrent ? "Current plan" : "Free"}
                                </Button>
                              ) : isCurrent ? (
                                <Button variant="secondary" className="w-full" disabled>
                                  Current plan
                                </Button>
                              ) : (
                                <CheckoutButton kind="subscription" planName={plan.name} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 border-b border-border/50 pb-8">
                    <div>
                      <h3 className="text-lg font-semibold">Credit add-ons</h3>
                      <p className="text-sm text-muted-foreground">
                        Add credits without changing your monthly plan.
                      </p>
                    </div>
                    <div className="divide-y divide-border/50 border-y border-border/50">
                      {(billing.addons as BillingAddon[]).map((addon) => (
                        <div
                          key={addon.key}
                          className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="text-base font-medium">
                              {formatCredits(addon.credits)} credits
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatEur(addon.price)}
                            </div>
                          </div>
                          <div className="w-full sm:w-40">
                            <CheckoutButton kind="addon" addonKey={addon.key} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Recent payments</h3>
                      <p className="text-sm text-muted-foreground">
                        Your latest charges and renewals.
                      </p>
                    </div>
                    <div className="divide-y divide-border/50 border-y border-border/50">
                      {billing.payments.length === 0 ? (
                        <div className="py-5 text-sm text-muted-foreground">
                          No payments yet.
                        </div>
                      ) : (
                        (billing.payments as BillingPayment[]).map((payment) => (
                          <div
                            key={payment.id}
                            className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {payment.description ?? payment.type}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(payment.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="secondary" className="rounded-full capitalize">
                                {payment.status}
                              </Badge>
                              <span className="font-medium">
                                {formatEur(Number(payment.amount))}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
          ),
          contribution: (
                <section>
                  <ContributionChart
                    timeline={contribution.timeline}
                    totalTrees={contribution.summary.totalTrees}
                    bare
                  />
                </section>
          ),
          security: (
                <section className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Security
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review sign-in details and session controls.
                    </p>
                  </div>

                  <div className="space-y-5 border-y border-border/50 py-6">
                    <ReadOnlyField
                      label="Signed in as"
                      value={profile.email ?? "Unknown email"}
                    />
                  </div>

                  <SignOutButton redirectUrl="/">
                    <Button variant="outline" className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </SignOutButton>

                  <div className="mt-12 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
                    <h3 className="text-base font-semibold text-destructive">
                      Delete account
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Permanently delete your Vercilio account, your chat
                      history, your contribution records, and your sign-in.
                      Any active subscription is canceled immediately. This
                      cannot be undone.
                    </p>
                    <div className="mt-4">
                      <DeleteAccountButton />
                    </div>
                  </div>
                </section>
          ),
        }}
      />
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <Input
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-full bg-white dark:bg-card"
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="flex h-11 items-center rounded-full border border-border/60 bg-white px-4 text-sm text-foreground dark:bg-card">
        {value}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold capitalize">{value}</div>
      <div className="text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}

function Notice({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "error";
}) {
  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-secondary/50 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
