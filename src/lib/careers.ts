// Careers content lives here as static data (English) rather than in the
// i18n message dictionaries — job descriptions don't need to be translated
// six ways, and keeping them in one typed module makes the listing and the
// detail pages share a single source of truth.

export type CareerTeam =
  | "Engineering"
  | "Research"
  | "Product & Design"
  | "Growth & Marketing"
  | "Go To Market"
  | "Operations"
  | "Support";

export type CareerRole = {
  slug: string;
  title: string;
  team: CareerTeam;
  /** One-line summary shown on the role detail page subheader. */
  summary: string;
  /** "About the role" paragraphs. */
  about: string[];
  /** "In this role, you will" bullets. */
  responsibilities: string[];
  /** "You might thrive here if" bullets. */
  qualifications: string[];
};

// Every role is fully remote / hire-from-anywhere.
export const CAREERS_LOCATION = "Anywhere · Remote";

// Shared "About the team" copy, keyed by team. Mirrors how a real careers
// site reuses a team intro across that team's open roles.
export const TEAM_INTRO: Record<CareerTeam, string> = {
  Engineering:
    "Engineering builds and runs Vercilio end to end — the chat product, the model-routing layer, billing, and the infrastructure that keeps streaming responses fast and reliable for everyone. We ship in small, autonomous teams and value people who can own a problem from idea to production.",
  Research:
    "Research keeps Vercilio on the frontier: evaluating new models the day they land, tuning our routing and reasoning settings, and turning messy real-world usage into measurable quality. We work close to the product, so research here ships.",
  "Product & Design":
    "Product & Design shapes what Vercilio feels like to use. We obsess over a calm, fast, opinionated interface that makes the world's best AI models approachable for everyone — and we sweat the details that make people stay.",
  "Growth & Marketing":
    "Growth & Marketing tells the Vercilio story and gets it in front of the right people. We pair clear writing with rigorous experimentation, and we care as much about the reforestation impact behind every subscription as we do about the funnel.",
  "Go To Market":
    "Go To Market helps individuals, teams, and developers get real value from Vercilio. We listen more than we pitch, turn feedback into roadmap, and build relationships that last well beyond the first signup.",
  Operations:
    "Operations is the connective tissue of a fast-moving startup — finance, people, legal, and the systems that let everyone else move quickly without things breaking. We make the company run so the rest of the team can focus on building.",
  Support:
    "Support is the human voice of Vercilio. We answer real people with care, turn confusion into clarity, and feed what we hear straight back into the product so the same problem doesn't happen twice.",
};

export const CAREER_ROLES: CareerRole[] = [
  // ── Engineering ───────────────────────────────────────────────────────
  {
    slug: "founding-engineer",
    title: "Founding Engineer",
    team: "Engineering",
    summary: "Help define the architecture and culture of Vercilio's engineering team from the ground up.",
    about: [
      "As a Founding Engineer you'll have outsized influence over what we build and how we build it. You'll work directly with the founders on the hardest problems across the stack — from the streaming chat experience to the model-routing layer that picks the right model for every message.",
      "This is a role for someone who thrives in ambiguity, ships quickly, and cares deeply about craft. You'll set patterns the rest of the team will build on for years.",
    ],
    responsibilities: [
      "Own features end to end across the frontend, backend, and infrastructure.",
      "Design the systems that route, stream, and bill millions of AI requests reliably.",
      "Set engineering standards — testing, observability, and code review — as we grow.",
      "Make pragmatic build-vs-buy calls that keep us moving fast.",
    ],
    qualifications: [
      "You've shipped and operated production software that real users depend on.",
      "You're comfortable owning a problem from a vague idea to a deployed, monitored feature.",
      "You write clear code and clear explanations, and you raise the bar for those around you.",
      "Bonus: you've worked with LLM APIs, streaming, or high-throughput backends.",
    ],
  },
  {
    slug: "senior-full-stack-engineer",
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    summary: "Build polished, fast product features across our Next.js frontend and Convex backend.",
    about: [
      "You'll work across the entire product surface — shipping user-facing features, refining the chat experience, and making sure everything stays fast and reliable as we scale.",
      "We care about people who can move between the database and the pixel, and who hold a high bar for the experience users actually feel.",
    ],
    responsibilities: [
      "Design and ship full-stack features from schema to UI.",
      "Improve performance, accessibility, and reliability across the app.",
      "Collaborate closely with design and product on the details that matter.",
      "Keep our codebase healthy through reviews, refactors, and good tests.",
    ],
    qualifications: [
      "Strong experience with TypeScript and a modern React framework (Next.js a plus).",
      "Comfort owning backend data models and APIs, not just the frontend.",
      "A track record of shipping high-quality features at a steady pace.",
      "An eye for UX detail and a bias toward simple solutions.",
    ],
  },
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    team: "Engineering",
    summary: "Own the model-routing, prompting, and evaluation layer at the heart of Vercilio.",
    about: [
      "You'll own the layer that makes Vercilio feel smart: how we route between models, how we structure prompts and tools, and how we measure whether the output is actually good.",
      "This role sits between research and product — you'll turn frontier model capabilities into features people rely on every day.",
    ],
    responsibilities: [
      "Build and tune our auto-router so every message gets the best-fit model.",
      "Design prompting, tool-use, and retrieval patterns that improve answer quality.",
      "Create evaluations that catch regressions before users do.",
      "Integrate new models and capabilities as they're released.",
    ],
    qualifications: [
      "Hands-on experience building with LLM APIs in production.",
      "A rigorous, measurement-driven approach to quality.",
      "Strong software fundamentals — this is an engineering role, not just prompting.",
      "Curiosity about where models are heading and what they can't yet do.",
    ],
  },
  {
    slug: "infrastructure-engineer",
    title: "Infrastructure Engineer",
    team: "Engineering",
    summary: "Keep streaming responses fast, observable, and reliable at scale.",
    about: [
      "You'll own the systems that keep Vercilio up: deployments, observability, performance, and cost. When thousands of streams are open at once, you make sure they stay fast and stable.",
      "You like making the invisible parts of a product excellent, and you measure your success in nines and latency percentiles.",
    ],
    responsibilities: [
      "Own CI/CD, deployments, and environment management.",
      "Build observability — metrics, logs, traces, and alerting — across the stack.",
      "Profile and tune latency for streaming AI workloads.",
      "Keep infrastructure spend efficient as usage grows.",
    ],
    qualifications: [
      "Experience operating production systems and on-call rotations.",
      "Comfort with cloud infrastructure, edge runtimes, and serverless platforms.",
      "A pragmatic, automation-first mindset.",
      "Bonus: experience with high-throughput, low-latency streaming systems.",
    ],
  },

  // ── Research ──────────────────────────────────────────────────────────
  {
    slug: "research-engineer",
    title: "Research Engineer",
    team: "Research",
    summary: "Evaluate models, tune routing, and turn real usage into measurable quality.",
    about: [
      "You'll bridge research and engineering — running evaluations, analyzing real-world usage, and shipping improvements to how Vercilio selects and uses models.",
      "Your work shows up in the product quickly: better routing, better defaults, better answers.",
    ],
    responsibilities: [
      "Build evaluation harnesses for new and existing models.",
      "Analyze usage data to find where quality breaks down.",
      "Prototype and ship improvements to routing and reasoning settings.",
      "Keep us current as the model landscape shifts week to week.",
    ],
    qualifications: [
      "Strong analytical skills and comfort with data.",
      "Solid software engineering — you can ship your own experiments.",
      "Familiarity with modern LLMs and their evaluation.",
      "A bias toward measurable, reproducible results.",
    ],
  },

  // ── Product & Design ──────────────────────────────────────────────────
  {
    slug: "product-designer",
    title: "Product Designer",
    team: "Product & Design",
    summary: "Design a calm, fast, opinionated interface for the world's best AI models.",
    about: [
      "You'll shape how Vercilio looks and feels — from the core chat experience to onboarding, pricing, and everything in between. You'll own problems end to end, from research to polished, shipped UI.",
      "We want a designer who sweats the details and can hold the whole experience in their head.",
    ],
    responsibilities: [
      "Own design for major product areas, end to end.",
      "Turn fuzzy problems into clear, elegant flows.",
      "Build and maintain our design system alongside engineering.",
      "Prototype quickly and validate with real users.",
    ],
    qualifications: [
      "A portfolio of shipped product work you're proud of.",
      "Strong interaction and visual design fundamentals.",
      "Comfort working closely with engineers in a fast-moving team.",
      "Care for accessibility and performance, not just aesthetics.",
    ],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    team: "Product & Design",
    summary: "Decide what we build next and why, then help the team ship it.",
    about: [
      "You'll work with design, engineering, and the founders to set priorities, sharpen the roadmap, and make sure what we ship actually moves the needle for users.",
      "This is a hands-on PM role at an early company — equal parts strategy, writing, and getting things over the line.",
    ],
    responsibilities: [
      "Define problems clearly and prioritize ruthlessly.",
      "Write crisp specs and keep teams aligned on outcomes.",
      "Use data and user feedback to guide decisions.",
      "Drive launches from idea to release to iteration.",
    ],
    qualifications: [
      "Experience shipping consumer or developer products.",
      "Excellent written communication and judgment.",
      "Comfort with ambiguity and a strong sense of ownership.",
      "Genuine curiosity about AI and how people use it.",
    ],
  },

  // ── Growth & Marketing ────────────────────────────────────────────────
  {
    slug: "growth-marketer",
    title: "Growth Marketer",
    team: "Growth & Marketing",
    summary: "Find scalable, honest ways to bring Vercilio to more people.",
    about: [
      "You'll own acquisition end to end — experimenting across channels, sharpening our messaging, and building durable growth loops. You'll care about both the numbers and the reforestation mission behind them.",
      "We want someone rigorous and creative who can run experiments and tell a clear story.",
    ],
    responsibilities: [
      "Plan and run growth experiments across channels.",
      "Own landing pages, messaging, and conversion.",
      "Build dashboards and report on what's working.",
      "Partner with product on activation and retention.",
    ],
    qualifications: [
      "A track record of measurable growth results.",
      "Comfort with analytics and experimentation.",
      "Strong instincts for clear, honest messaging.",
      "Bias toward action and iteration.",
    ],
  },
  {
    slug: "content-and-community-lead",
    title: "Content & Community Lead",
    team: "Growth & Marketing",
    summary: "Build Vercilio's voice across the blog, social, and our community.",
    about: [
      "You'll own how Vercilio shows up in writing and in public — the blog, social channels, and the community of people who use us every day. You'll turn product and impact stories into content people want to share.",
      "You write well, move fast, and genuinely enjoy talking with users.",
    ],
    responsibilities: [
      "Plan and produce content across the blog and social channels.",
      "Grow and nurture our community.",
      "Tell our reforestation impact story with credibility.",
      "Turn user conversations into content and feedback.",
    ],
    qualifications: [
      "Excellent writing and a strong sense of voice.",
      "Experience growing an audience or community.",
      "Comfort working across formats and platforms.",
      "Self-directed and organized.",
    ],
  },

  // ── Go To Market ──────────────────────────────────────────────────────
  {
    slug: "account-executive",
    title: "Account Executive",
    team: "Go To Market",
    summary: "Help teams adopt Vercilio and turn their feedback into roadmap.",
    about: [
      "You'll own relationships with teams evaluating and adopting Vercilio — understanding their needs, helping them succeed, and bringing what you learn back to product.",
      "We value people who listen more than they pitch and who build trust that lasts.",
    ],
    responsibilities: [
      "Own the full cycle from first conversation to successful adoption.",
      "Understand customer needs deeply and match them to the product.",
      "Feed structured feedback back to product and engineering.",
      "Help shape our go-to-market motion as we grow.",
    ],
    qualifications: [
      "Experience in a customer-facing role, ideally at a SaaS or AI company.",
      "Genuine curiosity and great listening skills.",
      "Clear, honest communication.",
      "Comfort in an early-stage, build-it-yourself environment.",
    ],
  },

  // ── Operations ────────────────────────────────────────────────────────
  {
    slug: "chief-of-staff",
    title: "Chief of Staff",
    team: "Operations",
    summary: "Work alongside the founders to make the whole company run better.",
    about: [
      "You'll be a force multiplier for the founders — driving priorities, running the operating cadence, and jumping into whatever is most important that week.",
      "This is a high-trust, high-ownership role for someone who can think strategically and execute relentlessly.",
    ],
    responsibilities: [
      "Run the company's planning and operating rhythm.",
      "Drive cross-functional projects that don't have an obvious owner.",
      "Prepare analysis and communication for key decisions.",
      "Fill gaps across operations, finance, and people as we grow.",
    ],
    qualifications: [
      "Experience in operations, consulting, founding, or a similar high-ownership role.",
      "Exceptional organization and judgment.",
      "Comfort switching between strategy and hands-on execution.",
      "Discretion and strong communication.",
    ],
  },
  {
    slug: "operations-and-finance-lead",
    title: "Operations & Finance Lead",
    team: "Operations",
    summary: "Build the financial and operational backbone of a fast-growing startup.",
    about: [
      "You'll own the systems that keep the business healthy — finance, billing, vendor management, and the operational processes that let everyone else move fast.",
      "You like turning chaos into clean, scalable systems.",
    ],
    responsibilities: [
      "Own budgeting, forecasting, and financial reporting.",
      "Manage billing, subscriptions, and our reforestation contributions.",
      "Set up scalable operational and compliance processes.",
      "Keep spend efficient and transparent.",
    ],
    qualifications: [
      "Experience in finance or operations, ideally at a startup.",
      "Strong analytical and spreadsheet skills.",
      "Detail-oriented and trustworthy with sensitive data.",
      "A builder's mindset for processes and systems.",
    ],
  },

  // ── Support ───────────────────────────────────────────────────────────
  {
    slug: "customer-support-specialist",
    title: "Customer Support Specialist",
    team: "Support",
    summary: "Be the human voice of Vercilio and turn problems into product fixes.",
    about: [
      "You'll help real people with real questions — quickly, kindly, and clearly — and you'll feed what you learn back into the product so the same issue doesn't recur.",
      "You're patient, empathetic, and genuinely care about a great experience.",
    ],
    responsibilities: [
      "Answer customer questions across email and chat.",
      "Diagnose issues and escalate clearly when needed.",
      "Write and maintain help content.",
      "Turn recurring problems into product feedback.",
    ],
    qualifications: [
      "Excellent written communication and empathy.",
      "Calm, organized, and reliable under volume.",
      "Comfort with technical products.",
      "A genuine desire to help people.",
    ],
  },
];

export function getCareerRole(slug: string): CareerRole | undefined {
  return CAREER_ROLES.find((role) => role.slug === slug);
}

// Roles sorted alphabetically by title, the way OpenAI lists them.
export function listCareerRoles(): CareerRole[] {
  return [...CAREER_ROLES].sort((a, b) => a.title.localeCompare(b.title));
}
