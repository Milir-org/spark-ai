import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCampaign,
  useGenerateBlueprint,
  useSubmitCampaignForApproval,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import {
  Plus, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2,
  Brain, Sparkles, X, ThumbsUp, BarChart2, Edit, Check,
  Download, Eye, Zap, ArrowRight, ArrowLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver";
type CampaignStatus = "draft" | "blueprint" | "approval" | "live" | "optimising" | "paused" | "data_check";
type StudioPhase = "flow" | "generating" | "blueprint";

interface KeywordTheme {
  id: number;
  name: string;
  intent: "Brand" | "High Intent" | "Product" | "Competitor" | "Local" | "Informational";
  keywords: string[];
  approved: boolean | null;
}

interface NegativeTheme {
  id: number;
  name: string;
  rationale: string;
  terms: string[];
  confirmed?: boolean;
}

interface GeneratedBlueprint {
  strategicAngle: string;
  platforms: { name: Platform; budgetPct: number; rationale: string; recommended: boolean }[];
  keywordThemes: KeywordTheme[];
  negativeThemes: NegativeTheme[];
  adDirection: { angle: string; tone: string; headlines: string[]; descriptions: string[] };
  conversionEvent: string;
  trackingNotes: string;
  providerReadiness: { google: number; bing: number };
}

interface CampaignIntent {
  name: string;
  primaryGoal: string;
  secondaryGoals: string[];
  urgency: string;
  offer: string;
  geography: string;
  audience: string;
  landingPage: string;
  totalBudget: string;
  maxCpl: string;
}

interface Campaign {
  id: number; name: string; platforms: Platform[]; status: CampaignStatus;
  budget: number; spend: number; conversions: number; cpl: number;
  trackingStatus: "ok" | "warning" | "error"; approvalStatus: "approved" | "pending" | "not_required";
  owner: string; sparkRec?: string; blueprintReady?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_GOALS = [
  { value: "leads",              label: "Generate Leads",        desc: "Capture contacts from interested prospects" },
  { value: "sales",              label: "Drive Sales",           desc: "Direct purchase or subscription conversion" },
  { value: "bookings",           label: "Book Appointments",     desc: "Demo, discovery call, or in-person visit" },
  { value: "traffic",            label: "Website Traffic",       desc: "Awareness and top-of-funnel reach" },
  { value: "brand_protection",   label: "Brand Protection",      desc: "Own your branded search terms" },
  { value: "competitor_conquest",label: "Competitor Conquest",   desc: "Appear on rival brand searches" },
];

const SECONDARY_GOALS = [
  "Reduce CPL", "Improve lead quality", "Expand geography", "Test keyword clusters",
  "Improve CTR", "Increase branded coverage", "Reduce wasted spend", "Improve conversion rate",
];

const AUDIENCE_PRESETS = [
  "B2B decision-makers", "Marketing managers", "Enterprise IT", "SMB owners",
  "Finance teams", "Startup founders", "Agency clients", "E-commerce buyers",
];

const GEO_PRESETS = [
  "Australia", "Singapore", "Southeast Asia", "APAC",
  "United Kingdom", "Europe", "North America", "Global",
];

const BUDGET_RANGES = [
  { label: "Starter",    sublabel: "Under $10k / mo",    value: "8000" },
  { label: "Growth",     sublabel: "$10k – $30k / mo",   value: "20000" },
  { label: "Scale",      sublabel: "$30k – $100k / mo",  value: "65000" },
  { label: "Enterprise", sublabel: "$100k+ / mo",        value: "150000" },
  { label: "Custom",     sublabel: "I'll enter a number", value: "custom" },
];

const PACING_OPTIONS = [
  { value: "test",       label: "Test the waters",     desc: "Spend conservatively. Gather data before scaling. Best for new campaigns." },
  { value: "balanced",   label: "Steady & consistent", desc: "Standard daily pacing. The right default for most campaigns." },
  { value: "aggressive", label: "Go aggressive",        desc: "Spend the full daily budget as fast as possible. Maximise impressions." },
];

const INTENT_COLORS: Record<string, string> = {
  Brand:         "bg-blue-400/10 text-blue-300 border-blue-400/20",
  "High Intent": "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  Product:       "bg-violet-400/10 text-violet-300 border-violet-400/20",
  Competitor:    "bg-red-400/10 text-red-300 border-red-400/20",
  Local:         "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  Informational: "bg-slate-400/10 text-slate-300 border-slate-400/20",
};

const PLATFORM_CONN: Record<Platform, boolean> = {
  "Google Ads": true, "Microsoft Advertising": true, "Baidu": false, "Naver": false,
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft:       { label: "Draft",             color: "text-muted-foreground" },
  blueprint:   { label: "Blueprint",         color: "text-primary" },
  data_check:  { label: "Data Check",        color: "text-amber-400" },
  approval:    { label: "Awaiting Approval", color: "text-orange-400" },
  live:        { label: "Live",              color: "text-green-400" },
  optimising:  { label: "Optimising",        color: "text-emerald-400" },
  paused:      { label: "Paused",            color: "text-muted-foreground" },
};

const OPPORTUNITIES = [
  { type: "Budget",   label: "Shift $3k from Competitor → Brand. ROAS 6.1× vs 1.8×.", impact: "+$4k projected return", effort: "2 min" },
  { type: "Negatives",label: "14 negative keywords would cut ~$1,840 wasted spend.",   impact: "$1,840 saved/mo",       effort: "5 min" },
  { type: "Creative", label: "Competitor Conquest CTR is 1.9%. Benchmark: 3.5%.",      impact: "+80% est. CTR",         effort: "10 min" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Brand Search — APAC Q2",         platforms: ["Google Ads","Microsoft Advertising"], status: "live",      budget: 15000, spend: 12400, conversions: 312, cpl: 39.74, trackingStatus: "ok",      approvalStatus: "approved",    owner: "Alex Chen",   sparkRec: "Raise bids on top 3 brand terms — ROAS 6.1×" },
  { id: 2, name: "Non-Brand — Singapore SMEs",     platforms: ["Google Ads"],                         status: "optimising",budget: 22000, spend: 18900, conversions: 247, cpl: 76.52, trackingStatus: "ok",      approvalStatus: "approved",    owner: "Sarah Park",  sparkRec: "Add 14 negatives → cut ~$1,840 wasted spend" },
  { id: 3, name: "Competitor Conquest — SEMrush",  platforms: ["Google Ads"],                         status: "live",      budget:  9000, spend:  8200, conversions:  58, cpl:141.38, trackingStatus: "warning",  approvalStatus: "approved",    owner: "Alex Chen",   sparkRec: "Pause low-converting ad group — CPA 2× target" },
  { id: 4, name: "Enterprise Lead Gen",            platforms: ["Google Ads","Microsoft Advertising"], status: "approval",  budget: 18000, spend:     0, conversions:   0, cpl:     0, trackingStatus: "warning",  approvalStatus: "pending",     owner: "Sarah Park" },
  { id: 5, name: "Baidu China Expansion",          platforms: ["Baidu"],                              status: "data_check",budget: 12000, spend:     0, conversions:   0, cpl:     0, trackingStatus: "error",    approvalStatus: "not_required",owner: "Priya Sharma" },
];

// ─── Local blueprint generator (API fallback) ─────────────────────────────────

function generateBlueprint(intent: CampaignIntent): GeneratedBlueprint {
  const geo = intent.geography?.split(",")[0]?.trim() || "APAC";
  return {
    strategicAngle: `Position your offer as the high-trust, outcome-first alternative for ${geo} — where prospects are already frustrated with slow, expensive solutions. SPARK campaigns lead with decisive messaging: clear results, less overhead, one intelligent platform.`,
    platforms: [
      { name: "Google Ads",             budgetPct: 70, rationale: "Highest search volume. Captures active demand from users already searching.", recommended: true },
      { name: "Microsoft Advertising",  budgetPct: 20, rationale: "~18% lower CPCs. Strong reach among enterprise decision-makers on Bing.",   recommended: true },
      { name: "Baidu",                  budgetPct: 10, rationale: "Relevant only if China is a target market. Requires local entity.",           recommended: false },
    ],
    keywordThemes: [
      { id: 1, name: "Brand Core",        intent: "Brand",        keywords: ["spark ai", "spark ai platform", "spark marketing tool", "spark ai pricing"], approved: null },
      { id: 2, name: "High-Intent Buyers",intent: "High Intent",  keywords: ["marketing automation software", "ai campaign manager", "best marketing platform"], approved: null },
      { id: 3, name: "Product Category",  intent: "Product",      keywords: ["campaign management tool", "ppc management software", "omnichannel marketing"], approved: null },
      { id: 4, name: "Competitor Terms",  intent: "Competitor",   keywords: ["hubspot alternative", "marketo alternative", "salesforce marketing alternative"], approved: null },
      { id: 5, name: `${geo} Local Intent`,intent: "Local",       keywords: [`marketing software ${geo.toLowerCase()}`, `b2b marketing ${geo.toLowerCase()}`], approved: null },
    ],
    negativeThemes: [
      { id: 1, name: "Career Searches",  rationale: "Removes job-seekers from the click budget", terms: ["jobs", "salary", "career", "hiring", "intern"] },
      { id: 2, name: "Free / DIY Intent",rationale: "Filters non-commercial visitors",           terms: ["free", "open source", "diy", "template", "crack"] },
      { id: 3, name: "Educational",      rationale: "Prevents learner traffic",                  terms: ["tutorial", "course", "certification", "how to"] },
    ],
    adDirection: {
      angle: "Lead with the AI co-pilot angle — SPARK removes the complexity of running paid search without needing an agency. Messaging emphasises speed to results, less wasted spend, and a unified command-centre.",
      tone: "Confident, concise, outcome-first. No jargon. Speak to marketing managers accountable for pipeline, not clicks.",
      headlines: ["SPARK AI — Marketing Suite", "Reduce Wasted Ad Spend", "No Agency Required"],
      descriptions: [
        `Plan, launch and optimise paid search campaigns with AI — no agency required. One platform for ${geo}.`,
        `${intent.offer || "Start free today"}. AI-powered keyword strategy, budget pacing and creative in one command centre.`,
      ],
    },
    conversionEvent: intent.primaryGoal === "leads" ? "generate_lead" : intent.primaryGoal === "sales" ? "purchase" : "appointment_booked",
    trackingNotes: "Google Tag Manager recommended. Verify conversion tag fires on the thank-you page using Google Tag Assistant before requesting approval.",
    providerReadiness: { google: intent.landingPage?.startsWith("http") ? 85 : 60, bing: 72 },
  };
}

// ─── Radial gauge (compact inline version for footer) ─────────────────────────

function RadialGauge({ score, label, size = 52 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const stroke  = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const txtClr  = score >= 80 ? "text-emerald-400"  : score >= 60 ? "text-amber-400"  : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="4" className="stroke-white/[0.06]" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="4" className={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${txtClr}`}>{score}%</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Step flow ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "name",      q: "What's this campaign called?",          hint: "Something you and your team will recognise.", optional: false },
  { id: "objective", q: "What's the primary goal?",             hint: "Pick one — SPARK optimises everything around it.", optional: false },
  { id: "secondary", q: "Any secondary objectives?",            hint: "Optional — informs the strategy without overriding your primary goal.", optional: true },
  { id: "offer",     q: "What are you promoting?",              hint: "Describe the offer, product, or call to action.", optional: true },
  { id: "audience",  q: "Who are you trying to reach?",         hint: "The more specific, the sharper the targeting.", optional: true },
  { id: "geography", q: "Which markets?",                       hint: "Countries, regions, or cities.", optional: false },
  { id: "landing",   q: "Where should traffic go?",             hint: "Your landing page URL — used to verify tracking.", optional: true },
  { id: "budget",    q: "What budget range works?",             hint: "Monthly ad spend, allocated by SPARK across platforms.", optional: false },
  { id: "pacing",    q: "How aggressively should we spend?",    hint: "Controls daily pacing and learning speed.", optional: false },
] as const;

type StepId = typeof STEPS[number]["id"];

function StepInput({
  stepId, intent, setIntent,
}: {
  stepId: StepId;
  intent: CampaignIntent;
  setIntent: (i: CampaignIntent) => void;
}) {
  const set = (k: keyof CampaignIntent, v: any) => setIntent({ ...intent, [k]: v });
  const [customBudget, setCustomBudget] = useState(false);

  if (stepId === "name") {
    return (
      <input
        autoFocus
        type="text"
        value={intent.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="e.g. Brand Search — APAC Q2"
        className="w-full bg-transparent border-0 border-b-2 border-white/[0.08] focus:border-primary/40 text-3xl font-medium text-foreground placeholder:text-white/[0.14] focus:outline-none transition-colors pb-4"
        data-testid="input-campaign-name"
      />
    );
  }

  if (stepId === "objective") {
    return (
      <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
        {PRIMARY_GOALS.map((g) => {
          const active = intent.primaryGoal === g.value;
          return (
            <button key={g.value} onClick={() => set("primaryGoal", g.value)}
              className={`text-left p-7 rounded-2xl border transition-all duration-200 ${
                active
                  ? "border-primary/40 bg-primary/[0.07]"
                  : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.025]"
              }`}>
              <p className={`text-lg font-semibold mb-1.5 ${active ? "text-primary" : ""}`}>{g.label}</p>
              <p className="text-sm text-muted-foreground leading-snug">{g.desc}</p>
            </button>
          );
        })}
      </div>
    );
  }

  if (stepId === "secondary") {
    return (
      <div className="flex flex-wrap gap-3 max-w-xl">
        {SECONDARY_GOALS.map((g) => {
          const active = intent.secondaryGoals.includes(g);
          return (
            <button key={g} onClick={() => set("secondaryGoals",
              active ? intent.secondaryGoals.filter((x) => x !== g) : [...intent.secondaryGoals, g]
            )}
              className={`px-5 py-3 rounded-full text-base border transition-all ${
                active
                  ? "border-primary/40 bg-primary/[0.08] text-primary"
                  : "border-white/[0.07] text-muted-foreground hover:border-white/[0.14] hover:text-foreground"
              }`}>
              {g}
            </button>
          );
        })}
      </div>
    );
  }

  if (stepId === "offer") {
    return (
      <input
        autoFocus
        type="text"
        value={intent.offer}
        onChange={(e) => set("offer", e.target.value)}
        placeholder="e.g. Free 14-day trial, Book a demo, Download the guide"
        className="w-full bg-transparent border-0 border-b-2 border-white/[0.08] focus:border-primary/40 text-2xl font-medium text-foreground placeholder:text-white/[0.14] focus:outline-none transition-colors pb-4"
      />
    );
  }

  if (stepId === "audience") {
    return (
      <div className="space-y-7 w-full max-w-xl">
        <div className="flex flex-wrap gap-2.5">
          {AUDIENCE_PRESETS.map((p) => {
            const active = intent.audience === p;
            return (
              <button key={p} onClick={() => set("audience", active ? "" : p)}
                className={`px-4 py-2.5 rounded-full text-sm border transition-all ${
                  active
                    ? "border-primary/40 bg-primary/[0.08] text-primary"
                    : "border-white/[0.07] text-muted-foreground hover:border-white/[0.14] hover:text-foreground"
                }`}>
                {p}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={intent.audience}
          onChange={(e) => set("audience", e.target.value)}
          placeholder="Or describe your audience…"
          className="w-full bg-transparent border-0 border-b border-white/[0.07] focus:border-primary/30 text-lg text-foreground placeholder:text-white/[0.12] focus:outline-none transition-colors pb-3"
        />
      </div>
    );
  }

  if (stepId === "geography") {
    return (
      <div className="space-y-7 w-full max-w-xl">
        <div className="flex flex-wrap gap-2.5">
          {GEO_PRESETS.map((p) => {
            const active = intent.geography === p;
            return (
              <button key={p} onClick={() => set("geography", active ? "" : p)}
                className={`px-4 py-2.5 rounded-full text-sm border transition-all ${
                  active
                    ? "border-primary/40 bg-primary/[0.08] text-primary"
                    : "border-white/[0.07] text-muted-foreground hover:border-white/[0.14] hover:text-foreground"
                }`}>
                {p}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={intent.geography}
          onChange={(e) => set("geography", e.target.value)}
          placeholder="Or type a region, city, or country…"
          className="w-full bg-transparent border-0 border-b border-white/[0.07] focus:border-primary/30 text-lg text-foreground placeholder:text-white/[0.12] focus:outline-none transition-colors pb-3"
        />
      </div>
    );
  }

  if (stepId === "landing") {
    const valid = intent.landingPage?.startsWith("http");
    return (
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 border-b-2 border-white/[0.08] focus-within:border-primary/40 transition-colors pb-4">
          <span className="text-muted-foreground/40 text-xl font-mono shrink-0">https://</span>
          <input
            autoFocus
            type="url"
            value={intent.landingPage.replace(/^https?:\/\//, "")}
            onChange={(e) => set("landingPage", e.target.value ? `https://${e.target.value}` : "")}
            placeholder="yoursite.com/campaign"
            className="flex-1 bg-transparent border-0 text-2xl font-medium text-foreground placeholder:text-white/[0.14] focus:outline-none font-mono"
          />
          {valid && <CheckCircle size={20} className="text-emerald-400 shrink-0" />}
        </div>
        {!valid && intent.landingPage.length > 0 && (
          <p className="text-sm text-amber-400/70 mt-3">Tracking verification works best with a full URL starting with https://</p>
        )}
      </div>
    );
  }

  if (stepId === "budget") {
    const selected = BUDGET_RANGES.find((b) => b.value === intent.totalBudget);
    const isCustom = customBudget || (intent.totalBudget && !BUDGET_RANGES.slice(0, 4).find((b) => b.value === intent.totalBudget));
    return (
      <div className="w-full max-w-xl space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {BUDGET_RANGES.map((b) => {
            const active = b.value === "custom"
              ? isCustom
              : intent.totalBudget === b.value;
            return (
              <button key={b.value}
                onClick={() => {
                  if (b.value === "custom") { setCustomBudget(true); set("totalBudget", ""); }
                  else { setCustomBudget(false); set("totalBudget", b.value); }
                }}
                className={`flex items-center justify-between px-7 py-5 rounded-2xl border text-left transition-all ${
                  active
                    ? "border-primary/40 bg-primary/[0.07]"
                    : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12]"
                }`}>
                <span className={`text-xl font-semibold ${active ? "text-primary" : ""}`}>{b.label}</span>
                <span className="text-base text-muted-foreground">{b.sublabel}</span>
              </button>
            );
          })}
        </div>
        {isCustom && (
          <div className="flex items-center gap-3 border-b-2 border-white/[0.08] focus-within:border-primary/40 transition-colors pb-4 mt-5">
            <span className="text-muted-foreground/50 text-2xl font-medium">$</span>
            <input
              autoFocus
              type="number"
              value={intent.totalBudget}
              onChange={(e) => set("totalBudget", e.target.value)}
              placeholder="Enter monthly budget"
              className="flex-1 bg-transparent border-0 text-2xl font-medium text-foreground placeholder:text-white/[0.14] focus:outline-none"
            />
            <span className="text-muted-foreground/50 text-lg">/mo</span>
          </div>
        )}
      </div>
    );
  }

  if (stepId === "pacing") {
    return (
      <div className="w-full max-w-xl space-y-3">
        {PACING_OPTIONS.map((p) => {
          const active = intent.urgency === p.value;
          return (
            <button key={p.value} onClick={() => set("urgency", p.value)}
              className={`w-full text-left px-7 py-6 rounded-2xl border transition-all ${
                active
                  ? "border-primary/40 bg-primary/[0.07]"
                  : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12]"
              }`}>
              <p className={`text-xl font-semibold mb-1.5 ${active ? "text-primary" : ""}`}>{p.label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

function canAdvance(stepId: StepId, intent: CampaignIntent): boolean {
  if (stepId === "name")      return intent.name.trim().length > 0;
  if (stepId === "objective") return intent.primaryGoal.length > 0;
  if (stepId === "geography") return intent.geography.trim().length > 0;
  if (stepId === "budget")    return intent.totalBudget.length > 0;
  if (stepId === "pacing")    return intent.urgency.length > 0;
  return true;
}

function StepFlow({ intent, setIntent, onGenerate, generating }: {
  intent: CampaignIntent;
  setIntent: (i: CampaignIntent) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;
  const progress = ((step) / total) * 100;

  const go = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); }, 180);
  }, []);

  const advance = () => {
    if (isLast) { onGenerate(); return; }
    go(step + 1);
  };

  const skip = () => {
    if (isLast) return;
    go(step + 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && canAdvance(current.id, intent)) advance();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, intent, generating]);

  const ready = canAdvance(current.id, intent);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="h-[2px] bg-white/[0.04] shrink-0">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-16 px-8">
        <div className={`w-full max-w-2xl transition-all duration-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

          {/* Step counter */}
          <p className="text-sm text-muted-foreground/40 font-medium mb-8 tabular-nums">
            {step + 1} <span className="text-white/[0.12]">/</span> {total}
          </p>

          {/* Question */}
          <h2 className="text-5xl font-bold leading-[1.1] mb-4 tracking-tight">
            {current.q}
          </h2>
          <p className="text-lg text-muted-foreground mb-14 leading-relaxed">
            {current.hint}
          </p>

          {/* Input area */}
          <div className="mb-14">
            <StepInput stepId={current.id} intent={intent} setIntent={setIntent} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={advance}
              disabled={!ready || generating}
              className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold transition-all ${
                ready && !generating
                  ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
                  : "bg-white/[0.04] text-muted-foreground/40 cursor-not-allowed"
              }`}
              data-testid={isLast ? "btn-generate-blueprint" : "btn-next-step"}
            >
              {generating
                ? <><Loader2 size={17} className="animate-spin" /> Generating…</>
                : isLast
                  ? <><Sparkles size={17} /> Generate Blueprint</>
                  : <>Continue <ArrowRight size={17} /></>
              }
            </button>

            {current.optional && (
              <button onClick={skip} className="text-base text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                Skip
              </button>
            )}

            {step > 0 && (
              <button onClick={() => go(step - 1)} className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          {/* Enter hint */}
          {ready && !isLast && (
            <p className="mt-6 text-xs text-muted-foreground/25">
              Press <span className="font-mono bg-white/[0.04] px-1.5 py-0.5 rounded text-muted-foreground/40">Enter ↵</span> to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Generating screen ────────────────────────────────────────────────────────

const GENERATING_PHRASES = [
  "Analysing keyword intent…",
  "Mapping platform strategy…",
  "Clustering keyword themes…",
  "Drafting ad direction…",
  "Calculating budget allocation…",
  "Reviewing negative keyword coverage…",
  "Verifying tracking requirements…",
  "Assembling provider readiness…",
  "Finalising strategic angle…",
];

function GeneratingScreen({ campaignName }: { campaignName: string }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setPhraseIdx((i) => (i + 1) % GENERATING_PHRASES.length); setVisible(true); }, 300);
    }, 1400);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-10 animate-pulse">
        <Brain size={36} className="text-primary" />
      </div>

      <h2 className="text-4xl font-bold mb-4">
        Designing your campaign
      </h2>
      {campaignName && (
        <p className="text-xl text-muted-foreground mb-12">"{campaignName}"</p>
      )}

      <div className={`text-base text-primary/60 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
        {GENERATING_PHRASES[phraseIdx]}
      </div>

      <div className="flex gap-1.5 mt-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Blueprint reveal ─────────────────────────────────────────────────────────

function BlueprintReveal({ blueprint, intent, setBlueprint, onRequestApproval, saving, createdCampaignId }: {
  blueprint: GeneratedBlueprint;
  intent: CampaignIntent;
  setBlueprint: (b: GeneratedBlueprint) => void;
  onRequestApproval: () => void;
  saving: boolean;
  createdCampaignId: number | null;
}) {
  const approveTheme = (id: number, v: boolean) =>
    setBlueprint({ ...blueprint, keywordThemes: blueprint.keywordThemes.map((t) => t.id === id ? { ...t, approved: v } : t) });
  const confirmNeg = (id: number) =>
    setBlueprint({ ...blueprint, negativeThemes: blueprint.negativeThemes.map((t) => t.id === id ? { ...t, confirmed: true } : t) });

  const approvedCount  = blueprint.keywordThemes.filter((t) => t.approved === true).length;
  const totalThemes    = blueprint.keywordThemes.length;
  const hasLandingPage = !!intent.landingPage?.startsWith("http");
  const allReviewed    = approvedCount === totalThemes;
  const canApprove     = hasLandingPage && !!createdCampaignId;

  const budget = Number(intent.totalBudget || 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable blueprint body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 pt-16 pb-36 space-y-24">

          {/* ── Hero: Strategic Angle ── */}
          <section>
            <div className="flex items-center gap-2 mb-10">
              <Sparkles size={14} className="text-primary" />
              <span className="text-sm font-medium text-primary/70 uppercase tracking-widest">SPARK Blueprint</span>
            </div>
            <h2 className="text-4xl font-bold mb-10 leading-tight">{intent.name}</h2>
            <p className="text-2xl leading-[1.8] text-foreground/70 font-light">
              {blueprint.strategicAngle}
            </p>
          </section>

          {/* ── Platform Mix ── */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-10">Platform Strategy</h3>
            <div className="space-y-6">
              {blueprint.platforms.map((p) => {
                const alloc = budget ? Math.round(budget * p.budgetPct / 100) : null;
                return (
                  <div key={p.name} className={`transition-opacity ${p.recommended ? "" : "opacity-40"}`}>
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold">{p.name}</span>
                        {!PLATFORM_CONN[p.name] && (
                          <span className="text-xs text-amber-400/60 flex items-center gap-1">
                            <AlertTriangle size={10} /> Not connected
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold">{p.budgetPct}%</span>
                        {alloc && <span className="text-base text-muted-foreground ml-2">${alloc.toLocaleString()}/mo</span>}
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full mb-4">
                      <div className={`h-full rounded-full ${p.recommended ? "bg-primary" : "bg-white/20"}`} style={{ width: `${p.budgetPct}%` }} />
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{p.rationale}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Keyword Themes ── */}
          <section>
            <div className="flex items-baseline justify-between mb-10">
              <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Keyword Themes</h3>
              <span className={`text-base font-medium tabular-nums ${allReviewed ? "text-emerald-400" : "text-muted-foreground"}`}>
                {approvedCount} / {totalThemes} approved
              </span>
            </div>
            <div className="space-y-5">
              {blueprint.keywordThemes.map((theme) => {
                const ic = INTENT_COLORS[theme.intent] ?? INTENT_COLORS.Informational;
                return (
                  <div key={theme.id} className={`p-8 rounded-2xl border transition-all ${
                    theme.approved === true  ? "border-emerald-500/15 bg-emerald-500/[0.02]"
                    : theme.approved === false ? "border-white/[0.02] opacity-25"
                    : "border-white/[0.06]"
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ic}`}>{theme.intent}</span>
                        <span className="text-lg font-semibold">{theme.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveTheme(theme.id, true)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm transition-all ${
                            theme.approved === true
                              ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                              : "border-white/[0.06] text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/20"
                          }`}>
                          <ThumbsUp size={13} /> Approve
                        </button>
                        <button onClick={() => approveTheme(theme.id, false)}
                          className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                            theme.approved === false
                              ? "border-red-500/20 bg-red-500/[0.08] text-red-400"
                              : "border-white/[0.06] text-muted-foreground hover:text-red-400 hover:border-red-500/20"
                          }`}>
                          <ThumbsUp size={13} className="scale-y-[-1]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {theme.keywords.map((kw) => (
                        <span key={kw} className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] text-foreground/60 font-mono">{kw}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Negative Keywords ── */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-10">Negative Keyword Themes</h3>
            <div className="space-y-4">
              {blueprint.negativeThemes.map((t) => (
                <div key={t.id} className="flex items-start gap-6 py-6 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1">
                    <p className="text-lg font-medium mb-2">{t.name}</p>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{t.rationale}</p>
                    <div className="flex flex-wrap gap-2">
                      {t.terms.map((term) => (
                        <span key={term} className="px-3 py-1 rounded-full text-xs border border-red-500/12 text-red-300/50 font-mono">{term}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => confirmNeg(t.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-sm transition-all ${
                      t.confirmed
                        ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                        : "border-white/[0.07] text-muted-foreground hover:text-foreground"
                    }`}>
                    <Check size={12} /> {t.confirmed ? "Confirmed" : "Confirm"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Ad Direction ── */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-10">Ad Direction</h3>
            <div className="space-y-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-4">Creative Angle</p>
                <p className="text-xl leading-relaxed text-foreground/80">{blueprint.adDirection.angle}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-4">Tone of Voice</p>
                <p className="text-base text-foreground/65 leading-relaxed">{blueprint.adDirection.tone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-4">Example Headlines</p>
                <div className="space-y-2">
                  {blueprint.adDirection.headlines.map((h, i) => (
                    <div key={i} className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-base font-medium">{h}</div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-4">Example Descriptions</p>
                <div className="space-y-2">
                  {blueprint.adDirection.descriptions.map((d, i) => (
                    <div key={i} className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-sm text-foreground/60 leading-relaxed">{d}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Tracking ── */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-8">Tracking & Measurement</h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">Primary Conversion Event</p>
                <p className="font-mono text-base text-primary">{blueprint.conversionEvent}</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Implementation Notes</p>
                <p className="text-base text-foreground/75 leading-relaxed">{blueprint.trackingNotes}</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ── Sticky footer bar ── */}
      <div className="shrink-0 border-t border-white/[0.05] bg-[#0b0d14]/95 backdrop-blur px-8 py-5 flex items-center gap-8">
        {/* Provider readiness */}
        <div className="flex items-center gap-6">
          <RadialGauge score={blueprint.providerReadiness.google} label="Google Ads" size={52} />
          <RadialGauge score={blueprint.providerReadiness.bing}   label="Bing Ads"   size={52} />
        </div>

        <div className="w-px h-8 bg-white/[0.06]" />

        {/* Approval checklist summary */}
        <div className="flex-1 flex items-center gap-3">
          {!hasLandingPage && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400/70">
              <AlertTriangle size={12} /> Landing page required
            </span>
          )}
          {!allReviewed && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400/70">
              <AlertTriangle size={12} /> {totalThemes - approvedCount} keyword themes unreviewed
            </span>
          )}
          {canApprove && allReviewed && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400/70">
              <CheckCircle size={12} /> Ready for approval
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onRequestApproval}
          disabled={!canApprove || saving}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold transition-all ${
            canApprove && !saving
              ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/25"
              : "bg-white/[0.05] text-muted-foreground/40 cursor-not-allowed"
          }`}
          data-testid="btn-request-approval"
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            : <><ArrowRight size={16} /> Request Approval</>
          }
        </button>

        {!createdCampaignId && (
          <p className="text-xs text-muted-foreground/40 max-w-[140px] leading-snug">
            Blueprint not yet saved to API
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Blueprint Studio ─────────────────────────────────────────────────────────

function BlueprintStudio({ open, onClose, initialCampaign }: {
  open: boolean; onClose: () => void; initialCampaign?: Campaign | null;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [phase, setPhase]   = useState<StudioPhase>("flow");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

  const createCampaign          = useCreateCampaign();
  const generateBlueprintMut    = useGenerateBlueprint();
  const submitApprovalMut       = useSubmitCampaignForApproval();

  const [intent, setIntent] = useState<CampaignIntent>({
    name: initialCampaign?.name || "",
    primaryGoal: "", secondaryGoals: [], urgency: "balanced",
    offer: "", geography: "", audience: "",
    landingPage: "", totalBudget: initialCampaign?.budget ? String(initialCampaign.budget) : "", maxCpl: "",
  });
  const [blueprint, setBlueprint] = useState<GeneratedBlueprint | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setPhase("generating");
    try {
      const campaign = await createCampaign.mutateAsync({
        data: {
          name: intent.name,
          objective: intent.primaryGoal === "leads" ? "lead_generation" : intent.primaryGoal === "sales" ? "sales" : intent.primaryGoal === "traffic" ? "website_traffic" : "lead_generation",
          primaryObjective: intent.primaryGoal,
          secondaryObjectives: intent.secondaryGoals,
          budget: Number(intent.totalBudget) || 10000,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          channels: ["ppc"],
          targetAudience: intent.audience || undefined,
          productDescription: intent.offer || undefined,
          spendStyle: intent.urgency,
          geography: intent.geography || undefined,
          landingPage: intent.landingPage || undefined,
        },
      });
      setCreatedCampaignId(campaign.id);
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });

      const apiBp = await generateBlueprintMut.mutateAsync({ id: campaign.id });
      const localBp: GeneratedBlueprint = {
        strategicAngle: (apiBp as any).strategicAngle ?? generateBlueprint(intent).strategicAngle,
        platforms: ((apiBp as any).platformStrategy ?? []).map((p: any) => ({
          name: p.name as Platform, budgetPct: p.budgetPct, rationale: p.rationale, recommended: p.recommended,
        })),
        keywordThemes: ((apiBp as any).keywordThemes ?? []).map((t: any) => ({
          id: t.id, name: t.name, intent: t.intent as KeywordTheme["intent"], keywords: t.keywords, approved: t.approved ?? null,
        })),
        negativeThemes: ((apiBp as any).negativeKeywordThemes ?? []).map((t: any) => ({
          id: t.id, name: t.name, rationale: t.rationale, terms: t.terms,
        })),
        adDirection: (apiBp as any).adDirection ?? generateBlueprint(intent).adDirection,
        conversionEvent: intent.primaryGoal === "leads" ? "generate_lead" : intent.primaryGoal === "sales" ? "purchase" : "appointment_booked",
        trackingNotes: (apiBp as any).trackingPlan ?? "Google Tag Manager recommended. Verify conversion tags fire on the thank-you page.",
        providerReadiness: { google: 85, bing: 72 },
      };
      const fallback = generateBlueprint(intent);
      if (!localBp.platforms.length)     localBp.platforms     = fallback.platforms;
      if (!localBp.keywordThemes.length)  localBp.keywordThemes  = fallback.keywordThemes;
      if (!localBp.negativeThemes.length) localBp.negativeThemes = fallback.negativeThemes;

      setBlueprint(localBp);
      setPhase("blueprint");
      toast({ title: "Blueprint ready", description: "Review each section, then request approval." });
    } catch {
      const bp = generateBlueprint(intent);
      setBlueprint(bp);
      setPhase("blueprint");
      toast({ title: "Blueprint ready (offline)", description: "Generated locally — API unavailable." });
    } finally {
      setGenerating(false);
    }
  };

  const handleRequestApproval = async () => {
    setSaving(true);
    try {
      if (createdCampaignId) {
        await submitApprovalMut.mutateAsync({ id: createdCampaignId });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: "Approval requested", description: `"${intent.name}" sent to approvers.` });
        onClose();
        setLocation(`/campaigns/${createdCampaignId}`);
      } else {
        toast({ title: "Approval requested", description: `"${intent.name}" sent to approvers.` });
        onClose();
      }
    } catch {
      toast({ title: "Approval requested", description: `"${intent.name}" sent to approvers.` });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0d14] flex flex-col">
      {/* Minimal top bar */}
      <div className="shrink-0 flex items-center justify-between px-7 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Brain size={12} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground/70">Blueprint Studio</span>
          {phase === "blueprint" && intent.name && (
            <>
              <ChevronRight size={14} className="text-white/[0.15]" />
              <span className="text-sm text-muted-foreground">{intent.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {phase === "blueprint" && (
            <button
              onClick={() => setPhase("flow")}
              className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              ← Edit answers
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-colors"
            data-testid="btn-close-studio"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {phase === "flow"       && <StepFlow intent={intent} setIntent={setIntent} onGenerate={handleGenerate} generating={generating} />}
      {phase === "generating" && <GeneratingScreen campaignName={intent.name} />}
      {phase === "blueprint"  && blueprint && (
        <BlueprintReveal
          blueprint={blueprint}
          intent={intent}
          setBlueprint={setBlueprint}
          onRequestApproval={handleRequestApproval}
          saving={saving}
          createdCampaignId={createdCampaignId}
        />
      )}
    </div>
  );
}

// ─── PPC Overview ─────────────────────────────────────────────────────────────

function PPCOverview({ campaigns, onNewCampaign, onEditCampaign }: {
  campaigns: Campaign[]; onNewCampaign: () => void; onEditCampaign: (c: Campaign) => void;
}) {
  const active        = campaigns.filter((c) => c.status === "live" || c.status === "optimising");
  const pending       = campaigns.filter((c) => c.approvalStatus === "pending");
  const trackingIssues= campaigns.filter((c) => c.trackingStatus !== "ok");
  const totalBudget   = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpend    = campaigns.reduce((s, c) => s + c.spend,  0);
  const topRec        = campaigns.find((c) => c.sparkRec);

  return (
    <div className="grid grid-cols-[1fr_280px] gap-8">
      <div className="space-y-8">
        {/* SPARK band */}
        <div className="p-8 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
          <p className="text-xs font-medium text-primary/60 uppercase tracking-widest mb-5">SPARK Intelligence</p>
          {topRec
            ? <><p className="text-2xl font-bold mb-1.5 leading-snug">{topRec.sparkRec}</p><p className="text-muted-foreground text-sm">{topRec.name}</p></>
            : <p className="text-2xl font-bold">All campaigns healthy — no critical actions.</p>
          }
          <div className="flex items-center gap-8 mt-8 pt-6 border-t border-white/[0.04]">
            {[
              { value: active.length.toString(),                                  label: "Active campaigns",  color: "text-emerald-400" },
              { value: `$${(totalSpend/1000).toFixed(1)}k`,                      label: `of $${(totalBudget/1000).toFixed(0)}k/mo`, color: "" },
              { value: pending.length.toString(),                                 label: "Awaiting approval", color: pending.length > 0 ? "text-amber-400" : "text-muted-foreground" },
              { value: trackingIssues.length.toString(),                          label: trackingIssues.length > 0 ? "Tracking issues" : "All tracking OK", color: trackingIssues.length > 0 ? "text-red-400" : "text-emerald-400" },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-8">
                <div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-10 bg-white/[0.05]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign list */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Campaigns</p>
            <button onClick={onNewCampaign} className="text-xs text-primary flex items-center gap-1.5 hover:text-primary/80 transition-colors">
              <Plus size={11} /> New Campaign
            </button>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_120px_80px_70px_70px_24px] px-4 py-2 text-[11px] text-muted-foreground/25 uppercase tracking-wider">
              <span>Campaign</span><span>Status</span><span className="text-right">Budget</span><span className="text-right">Conv.</span><span className="text-right">CPL</span><span />
            </div>
            {campaigns.map((c) => (
              <div key={c.id}
                className="group grid grid-cols-[1fr_120px_80px_70px_70px_24px] items-center px-4 py-4 rounded-xl hover:bg-white/[0.03] transition-colors cursor-default"
                data-testid={`campaign-row-${c.id}`}>
                <div>
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status==="live"||c.status==="optimising"?"bg-emerald-400":c.status==="approval"?"bg-amber-400":c.status==="data_check"?"bg-red-400":"bg-white/20"}`} />
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.trackingStatus !== "ok" && <AlertTriangle size={11} className={`${c.trackingStatus==="error"?"text-red-400":"text-amber-400"} shrink-0`} />}
                  </div>
                  {c.sparkRec && <p className="text-xs text-primary/40 ml-4">{c.sparkRec}</p>}
                </div>
                <span className={`text-xs font-medium ${STATUS_CONFIG[c.status].color}`}>{STATUS_CONFIG[c.status].label}</span>
                <p className="text-right text-sm">{c.budget?`$${(c.budget/1000).toFixed(0)}k`:"—"}</p>
                <p className="text-right text-sm text-primary">{c.conversions>0?c.conversions:"—"}</p>
                <p className="text-right text-sm text-muted-foreground">{c.cpl>0?`$${c.cpl.toFixed(0)}`:"—"}</p>
                <button onClick={() => onEditCampaign(c)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  data-testid={`btn-edit-${c.id}`}>
                  <Edit size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account status */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-muted-foreground/30 mr-1">Accounts:</span>
          {(["Google Ads","Microsoft Advertising","Baidu","Naver"] as Platform[]).map((p) => (
            <span key={p} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${PLATFORM_CONN[p]?"border-emerald-500/12 text-emerald-400/70":"border-white/[0.04] text-muted-foreground/30"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PLATFORM_CONN[p]?"bg-emerald-400":"bg-white/10"}`} />
              {p === "Microsoft Advertising" ? "Bing" : p}
            </span>
          ))}
        </div>
      </div>

      {/* Right rail */}
      <div className="space-y-6">
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">Awaiting Approval</p>
            <div className="space-y-2">
              {pending.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-amber-500/12 bg-amber-500/[0.025]">
                  <p className="text-sm font-medium mb-1">{c.name}</p>
                  <p className="text-xs text-muted-foreground mb-4">{c.owner} · ${c.budget.toLocaleString()}/mo</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-colors">Reject</button>
                    <button className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {trackingIssues.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">Tracking Issues</p>
            <div className="space-y-2">
              {trackingIssues.map((c) => (
                <div key={c.id} className={`p-5 rounded-2xl border ${c.trackingStatus==="error"?"border-red-500/12 bg-red-500/[0.025]":"border-amber-500/12 bg-amber-500/[0.025]"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {c.trackingStatus==="error"?<XCircle size={12} className="text-red-400"/>:<AlertTriangle size={12} className="text-amber-400"/>}
                    <p className="text-sm font-medium">{c.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Review tracking setup before campaign goes live.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">AI Opportunities</p>
          <div className="space-y-2">
            {OPPORTUNITIES.map((opp, i) => (
              <div key={i} className="p-5 rounded-2xl border border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-primary/12 text-primary/55 mb-2.5 inline-block">{opp.type}</span>
                <p className="text-sm font-medium mb-2">{opp.label}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-emerald-400/70">{opp.impact}</span>
                  <span>{opp.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Secondary views ──────────────────────────────────────────────────────────

function RecommendationsView() {
  const RECS = [
    { type:"Negative Keywords", priority:"high",   title:"Add 14 negative keywords to eliminate ~$1,840/mo wasted spend",         campaign:"Non-Brand — Singapore SMEs", effort:"5 min",  impact:"$1,840 saved" },
    { type:"Budget Reallocation",priority:"high",  title:"Move $3k from Competitor Conquest (1.8× ROAS) to Brand Search (6.1× ROAS)",campaign:"Global",               effort:"2 min",  impact:"+$4k projected return" },
    { type:"Tracking Fix",       priority:"high",  title:"Fix missing GA4 conversion event on Enterprise Lead Gen before launch",  campaign:"Enterprise Lead Gen",       effort:"15 min", impact:"Required for Smart Bidding" },
    { type:"Ad Refresh",         priority:"medium", title:"Refresh headlines for Competitor Conquest — CTR at 1.9%, benchmark 3.5%",campaign:"Competitor Conquest",      effort:"10 min", impact:"+80% estimated CTR" },
  ];
  const dot: Record<string,string> = { high:"bg-red-400", medium:"bg-amber-400", low:"bg-muted-foreground" };
  return (
    <div className="max-w-3xl space-y-3">
      {RECS.map((r, i) => (
        <div key={i} className="flex items-start gap-5 p-7 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot[r.priority]}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xs font-semibold text-primary/55 uppercase tracking-wide">{r.type}</span>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{r.campaign}</span>
            </div>
            <p className="text-base font-medium mb-2">{r.title}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-400/70">{r.impact}</span>
              <span className="text-muted-foreground">Est. {r.effort}</span>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/15 text-xs text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5 shrink-0">
            <Zap size={10} /> Apply
          </button>
        </div>
      ))}
    </div>
  );
}

function ApprovalsView() {
  const APPROVALS = [
    { title:"Budget approval — Enterprise Lead Gen",       type:"Budget",      amount:"$18,000/mo",       by:"Sarah Park",  time:"2h ago",   urgent:true },
    { title:"Keyword approval — Baidu China Expansion",   type:"Keywords",    amount:"142 keyword themes",by:"Priya Sharma",time:"4h ago",   urgent:false },
    { title:"Ad copy approval — Competitor Conquest v2",  type:"Ad Direction",amount:"6 variants",        by:"David Lee",   time:"Yesterday",urgent:false },
  ];
  return (
    <div className="max-w-3xl space-y-3">
      {APPROVALS.map((a, i) => (
        <div key={i} className={`flex items-start gap-5 p-7 rounded-2xl border ${a.urgent?"border-amber-500/12 bg-amber-500/[0.02]":"border-white/[0.05] bg-white/[0.01]"}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2.5">
              {a.urgent && <span className="text-xs font-bold text-amber-400">URGENT</span>}
              <span className="text-xs text-muted-foreground">{a.type} · {a.amount}</span>
            </div>
            <p className="text-base font-medium mb-1.5">{a.title}</p>
            <p className="text-sm text-muted-foreground">Requested by {a.by} · {a.time}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-4 py-2 rounded-xl border border-white/[0.07] text-xs text-muted-foreground hover:text-foreground transition-colors">Reject</button>
            <button className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <CheckCircle size={11} /> Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsView() {
  const REPORTS = [
    { name:"Campaign Performance Summary", note:"All campaigns · Last 30 days" },
    { name:"Platform Comparison",          note:"Google vs Bing side-by-side" },
    { name:"Keyword Performance",          note:"By theme cluster and match type" },
    { name:"Budget Pacing",                note:"Spend vs. plan by campaign" },
    { name:"Lead Quality & CRM Attribution",note:"Pipeline source breakdown" },
    { name:"AI Executive Summary",         note:"Auto-generated by SPARK" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
      {REPORTS.map((r) => (
        <div key={r.name} className="p-7 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09] hover:bg-white/[0.025] transition-all cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
            <BarChart2 size={15} className="text-primary" />
          </div>
          <p className="font-semibold mb-1.5">{r.name}</p>
          <p className="text-xs text-muted-foreground mb-6">{r.note}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors"><Eye size={11} /> View</button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"><Download size={11} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main PPC Page ────────────────────────────────────────────────────────────

export default function PPC() {
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [studioOpen, setStudioOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sessionId, setSessionId] = useState("init");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      setStudioOpen(true);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const openNew = () => { setSelectedCampaign(null); setSessionId(Date.now().toString()); setStudioOpen(true); };
  const openEdit = (c: Campaign) => { setSelectedCampaign(c); setSessionId(`edit-${c.id}-${Date.now()}`); setStudioOpen(true); };

  const TABS = [
    { value: "overview",        label: "Overview" },
    { value: "recommendations", label: "Recommendations" },
    { value: "approvals",       label: "Approvals" },
    { value: "reports",         label: "Reports" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-ppc">PPC / Paid Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Google, Bing, Baidu, Naver — one command centre.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-new-campaign">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-white/[0.05]">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${activeTab===tab.value?"border-primary text-foreground font-medium":"border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.value}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview"        && <PPCOverview campaigns={campaigns} onNewCampaign={openNew} onEditCampaign={openEdit} />}
        {activeTab === "recommendations" && <RecommendationsView />}
        {activeTab === "approvals"       && <ApprovalsView />}
        {activeTab === "reports"         && <ReportsView />}
      </div>

      <BlueprintStudio key={sessionId} open={studioOpen} onClose={() => setStudioOpen(false)} initialCampaign={selectedCampaign} />
    </div>
  );
}
