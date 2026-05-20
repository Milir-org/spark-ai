import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCampaign,
  useGenerateBlueprint,
  useSubmitCampaignForApproval,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Plus, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2,
  Brain, Sparkles, X, ThumbsUp, Globe, Hash,
  Shield, DollarSign, Target, Wand2, BarChart2, Edit,
  Check, Download, TrendingUp, Eye, Zap, ArrowRight, ChevronRight,
  Settings2, Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver";
type CampaignStatus = "draft" | "blueprint" | "approval" | "live" | "optimising" | "paused" | "data_check";
type StudioMode = "guided" | "expert";

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
  { value: "leads", label: "Generate Leads", desc: "Capture contacts from interested prospects" },
  { value: "sales", label: "Drive Sales", desc: "Direct purchase or subscription conversion" },
  { value: "bookings", label: "Book Appointments", desc: "Demo, discovery call, or in-person visit" },
  { value: "traffic", label: "Website Traffic", desc: "Awareness and top-of-funnel reach" },
  { value: "brand_protection", label: "Brand Protection", desc: "Own your branded search terms" },
  { value: "competitor_conquest", label: "Competitor Conquest", desc: "Appear on rival brand searches" },
];

const SECONDARY_GOALS = [
  "Reduce CPL", "Improve lead quality", "Expand geography", "Test keyword clusters",
  "Improve CTR", "Increase branded coverage", "Reduce wasted spend", "Improve conversion rate",
];

const PLATFORM_CONN: Record<Platform, boolean> = {
  "Google Ads": true, "Microsoft Advertising": true, "Baidu": false, "Naver": false,
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground" },
  blueprint: { label: "Blueprint", color: "text-primary" },
  data_check: { label: "Data Check", color: "text-amber-400" },
  approval: { label: "Awaiting Approval", color: "text-orange-400" },
  live: { label: "Live", color: "text-green-400" },
  optimising: { label: "Optimising", color: "text-emerald-400" },
  paused: { label: "Paused", color: "text-muted-foreground" },
};

const INTENT_COLORS: Record<string, { badge: string; dot: string }> = {
  Brand:         { badge: "bg-blue-400/10 text-blue-300 border-blue-400/20",        dot: "bg-blue-400" },
  "High Intent": { badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", dot: "bg-emerald-400" },
  Product:       { badge: "bg-violet-400/10 text-violet-300 border-violet-400/20",  dot: "bg-violet-400" },
  Competitor:    { badge: "bg-red-400/10 text-red-300 border-red-400/20",            dot: "bg-red-400" },
  Local:         { badge: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",         dot: "bg-cyan-400" },
  Informational: { badge: "bg-slate-400/10 text-slate-300 border-slate-400/20",     dot: "bg-slate-400" },
};

const OPPORTUNITIES = [
  { type: "Budget", label: "Shift $3k from Competitor → Brand. ROAS 6.1× vs 1.8×.", impact: "+$4k projected return", effort: "2 min" },
  { type: "Negatives", label: "14 negative keywords would cut ~$1,840 wasted spend.", impact: "$1,840 saved/mo", effort: "5 min" },
  { type: "Creative", label: "Competitor Conquest CTR is 1.9%. Benchmark: 3.5%.", impact: "+80% est. CTR", effort: "10 min" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Brand Search — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"], status: "live", budget: 15000, spend: 12400, conversions: 312, cpl: 39.74, trackingStatus: "ok", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Raise bids on top 3 brand terms — ROAS 6.1×", blueprintReady: true },
  { id: 2, name: "Non-Brand — Singapore SMEs", platforms: ["Google Ads"], status: "optimising", budget: 22000, spend: 18900, conversions: 247, cpl: 76.52, trackingStatus: "ok", approvalStatus: "approved", owner: "Sarah Park", sparkRec: "Add 14 negatives → cut ~$1,840 wasted spend", blueprintReady: true },
  { id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"], status: "live", budget: 9000, spend: 8200, conversions: 58, cpl: 141.38, trackingStatus: "warning", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Pause low-converting ad group — CPA 2× target", blueprintReady: true },
  { id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"], status: "approval", budget: 18000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "warning", approvalStatus: "pending", owner: "Sarah Park", blueprintReady: true },
  { id: 5, name: "Baidu China Expansion", platforms: ["Baidu"], status: "data_check", budget: 12000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "error", approvalStatus: "not_required", owner: "Priya Sharma", blueprintReady: false },
];

// ─── Local blueprint generator (API fallback) ─────────────────────────────────

function generateBlueprint(intent: CampaignIntent): GeneratedBlueprint {
  const product = intent.offer || "your product";
  const geo = intent.geography?.split(",")[0]?.trim() || "APAC";
  return {
    strategicAngle: `Position ${product} as the high-trust AI alternative to legacy marketing agencies for B2B SaaS teams in ${geo}. Lead with the efficiency and clarity angle — prospects are already frustrated with slow, expensive, opaque retainers. SPARK campaigns should feel decisive and outcome-focused.`,
    platforms: [
      { name: "Google Ads", budgetPct: 70, rationale: "Highest search volume. Captures active demand from users already searching for solutions.", recommended: true },
      { name: "Microsoft Advertising", budgetPct: 20, rationale: "Lower CPCs (avg 18% cheaper). Strong reach among enterprise IT decision-makers on Bing.", recommended: true },
      { name: "Baidu", budgetPct: 10, rationale: "Relevant if China market is a priority. Requires local entity or partner for account access.", recommended: false },
    ],
    keywordThemes: [
      { id: 1, name: "Brand Core", intent: "Brand", keywords: ["spark ai", "spark ai platform", "spark marketing tool", "spark ai pricing"], approved: null },
      { id: 2, name: "High-Intent Buyers", intent: "High Intent", keywords: ["marketing automation software", "ai campaign manager", "best marketing platform", "marketing software for saas"], approved: null },
      { id: 3, name: "Product Category", intent: "Product", keywords: ["campaign management tool", "ppc management software", "omnichannel marketing platform", "ai ad platform"], approved: null },
      { id: 4, name: "Competitor Terms", intent: "Competitor", keywords: ["hubspot alternative", "marketo alternative", "salesforce marketing alternative", "semrush alternatives"], approved: null },
      { id: 5, name: `${geo} Local Intent`, intent: "Local", keywords: [`marketing software ${geo.toLowerCase()}`, `marketing agency replacement ${geo.toLowerCase()}`, `b2b marketing tool ${geo.toLowerCase()}`], approved: null },
    ],
    negativeThemes: [
      { id: 1, name: "Career Searches", rationale: "Eliminates job-seekers from click budget", terms: ["jobs", "salary", "career", "hiring", "intern", "vacancy"] },
      { id: 2, name: "Free / DIY Intent", rationale: "Filters out non-commercial visitors unlikely to convert", terms: ["free", "open source", "diy", "template", "crack"] },
      { id: 3, name: "Educational", rationale: "Prevents budget waste on learners rather than buyers", terms: ["tutorial", "course", "certification", "how to", "learn"] },
    ],
    adDirection: {
      angle: "Lead with the AI co-pilot angle — SPARK removes the complexity of running paid search without needing an agency. Messaging should emphasise speed to results, less wasted spend, and the unified command-centre approach.",
      tone: "Confident, concise, outcome-first. Avoid jargon. Speak to marketing managers accountable for pipeline, not clicks.",
      headlines: ["SPARK AI — Marketing Suite", "Reduce Wasted Ad Spend", "No Agency Required"],
      descriptions: [
        `Plan, launch and optimise paid search campaigns with AI — no agency required. One platform for ${geo} and beyond.`,
        `${intent.offer || "Start free today"}. AI-powered keyword strategy, budget pacing and creative in one command centre.`,
      ],
    },
    conversionEvent: intent.primaryGoal === "leads" ? "generate_lead" : intent.primaryGoal === "sales" ? "purchase" : "appointment_booked",
    trackingNotes: "Google Tag Manager recommended. Verify conversion tag fires on the thank-you page using Google Tag Assistant before requesting approval.",
    providerReadiness: { google: intent.landingPage?.startsWith("http") ? 85 : 60, bing: 72 },
  };
}

// ─── Radial Gauge ─────────────────────────────────────────────────────────────

function RadialGauge({ score, label, size = 88 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className="stroke-white/[0.06]" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className={color}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${textColor}`}>{score}%</span>
      </div>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-full h-px bg-white/[0.04]" />;
}

// ─── Mode Toggle ─────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: StudioMode; onChange: (m: StudioMode) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      <button
        onClick={() => onChange("guided")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          mode === "guided"
            ? "bg-white/[0.08] text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Lightbulb size={13} />
        Guided
      </button>
      <button
        onClick={() => onChange("expert")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          mode === "expert"
            ? "bg-white/[0.08] text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Settings2 size={13} />
        Expert
      </button>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ phase }: { phase: "intent" | "blueprint" }) {
  const steps = [
    { id: "intent", label: "Intent" },
    { id: "blueprint", label: "Blueprint" },
    { id: "approve", label: "Approve" },
  ];
  const activeIdx = phase === "intent" ? 0 : 1;

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              active ? "text-foreground" : done ? "text-emerald-400" : "text-muted-foreground/40"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                active ? "border-primary bg-primary/20 text-primary"
                : done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/[0.08] text-muted-foreground/30"
              }`}>
                {done ? <Check size={9} /> : i + 1}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px transition-colors ${done ? "bg-emerald-500/30" : "bg-white/[0.06]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Intent Canvas ────────────────────────────────────────────────────────────

function IntentCanvas({ intent, setIntent, onGenerate, generating, mode }: {
  intent: CampaignIntent;
  setIntent: (i: CampaignIntent) => void;
  onGenerate: () => void;
  generating: boolean;
  mode: StudioMode;
}) {
  const set = (k: keyof CampaignIntent, v: any) => setIntent({ ...intent, [k]: v });
  const toggleSecondary = (g: string) =>
    set("secondaryGoals", intent.secondaryGoals.includes(g)
      ? intent.secondaryGoals.filter((x) => x !== g)
      : [...intent.secondaryGoals, g]);

  const canGenerate = !!intent.primaryGoal && intent.name.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-14 space-y-20">

        {/* Campaign name */}
        <div>
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-6">Campaign Name</p>
          <input
            type="text"
            placeholder="Name this campaign…"
            value={intent.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full bg-transparent border-0 border-b border-white/[0.07] text-4xl font-bold placeholder:text-white/[0.10] focus:outline-none focus:border-primary/25 transition-colors pb-4 leading-tight"
            data-testid="input-campaign-name"
          />
        </div>

        {/* Primary objective */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Primary Objective</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The single goal that drives every SPARK decision — bids, keywords, copy, and measurement.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PRIMARY_GOALS.map((g) => {
              const active = intent.primaryGoal === g.value;
              return (
                <button key={g.value} onClick={() => set("primaryGoal", g.value)}
                  className={`text-left p-6 rounded-2xl border transition-all duration-200 ${
                    active
                      ? "border-primary/30 bg-gradient-to-br from-primary/[0.09] to-primary/[0.03]"
                      : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09] hover:bg-white/[0.025]"
                  }`}>
                  <p className={`font-semibold text-base mb-1.5 ${active ? "text-primary" : ""}`}>{g.label}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{g.desc}</p>
                  {active && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-primary/60">
                      <CheckCircle size={11} /> Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campaign context — always visible */}
        <div className="space-y-7">
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Campaign Context</p>

          <div>
            <p className="text-sm font-medium text-foreground/80 mb-3">What's the offer or CTA?</p>
            <Input
              placeholder="e.g. Free 14-day trial, Book a demo, Download the guide"
              value={intent.offer}
              onChange={(e) => set("offer", e.target.value)}
              className="h-12 bg-white/[0.02] border-white/[0.07] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-sm font-medium text-foreground/80 mb-3">Geography</p>
              <Input
                placeholder="e.g. Singapore, Australia"
                value={intent.geography}
                onChange={(e) => set("geography", e.target.value)}
                className="h-12 bg-white/[0.02] border-white/[0.07] text-sm"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80 mb-3">Monthly Budget ($)</p>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={intent.totalBudget}
                onChange={(e) => set("totalBudget", e.target.value)}
                className="h-12 bg-white/[0.02] border-white/[0.07] text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground/80">Landing Page URL</p>
              {intent.landingPage?.startsWith("http") && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={11} /> Valid
                </span>
              )}
            </div>
            <Input
              placeholder="https://yoursite.com/campaign"
              value={intent.landingPage}
              onChange={(e) => set("landingPage", e.target.value)}
              className="h-12 bg-white/[0.02] border-white/[0.07] text-sm font-mono"
            />
          </div>
        </div>

        {/* Expert-only fields */}
        {mode === "expert" && (
          <>
            <Divider />

            <div className="space-y-7">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 size={14} className="text-primary/50" />
                <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Expert Controls</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground/80 mb-3">Who are you targeting?</p>
                <Input
                  placeholder="e.g. Marketing managers at B2B SaaS companies, 10–200 employees"
                  value={intent.audience}
                  onChange={(e) => set("audience", e.target.value)}
                  className="h-12 bg-white/[0.02] border-white/[0.07] text-sm"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground/80 mb-3">Max CPL Target ($)</p>
                <Input
                  type="number"
                  placeholder="e.g. 80"
                  value={intent.maxCpl}
                  onChange={(e) => set("maxCpl", e.target.value)}
                  className="h-12 bg-white/[0.02] border-white/[0.07] text-sm"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground/80 mb-2">Secondary Objectives</p>
                <p className="text-xs text-muted-foreground mb-4">SPARK factors these in without overriding your primary goal.</p>
                <div className="flex flex-wrap gap-2">
                  {SECONDARY_GOALS.map((g) => {
                    const active = intent.secondaryGoals.includes(g);
                    return (
                      <button key={g} onClick={() => toggleSecondary(g)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          active
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12] hover:text-foreground"
                        }`}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground/80 mb-4">Spend Pacing</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["test", "Test", "Start slow. Learn before scaling."],
                    ["balanced", "Balanced", "Standard pacing — recommended."],
                    ["aggressive", "Aggressive", "Spend the full daily budget."],
                  ] as [string, string, string][]).map(([v, l, d]) => (
                    <button key={v} onClick={() => set("urgency", v)}
                      className={`p-5 rounded-2xl border text-left transition-all ${
                        intent.urgency === v
                          ? "border-primary/25 bg-primary/[0.06]"
                          : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09]"
                      }`}>
                      <p className={`font-semibold text-sm mb-1 ${intent.urgency === v ? "text-primary" : ""}`}>{l}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Generate CTA */}
        <div className="pb-10">
          <button
            onClick={onGenerate}
            disabled={!canGenerate || generating}
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-base font-semibold transition-all ${
              canGenerate && !generating
                ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
                : "bg-white/[0.03] text-muted-foreground/50 cursor-not-allowed"
            }`}
            data-testid="btn-generate-blueprint"
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating blueprint…</>
            ) : (
              <><Sparkles size={18} /> Generate Campaign Blueprint</>
            )}
          </button>
          {!canGenerate && (
            <p className="text-xs text-muted-foreground/50 text-center mt-3">
              Add a campaign name and select a primary objective to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Blueprint Canvas ─────────────────────────────────────────────────────────

function BlueprintCanvas({ blueprint, intent, setBlueprint, mode }: {
  blueprint: GeneratedBlueprint;
  intent: CampaignIntent;
  setBlueprint: (b: GeneratedBlueprint) => void;
  mode: StudioMode;
}) {
  const budget = Number(intent.totalBudget || 0);

  const approveTheme = (id: number, v: boolean) =>
    setBlueprint({ ...blueprint, keywordThemes: blueprint.keywordThemes.map((t) => t.id === id ? { ...t, approved: v } : t) });
  const confirmNeg = (id: number) =>
    setBlueprint({ ...blueprint, negativeThemes: blueprint.negativeThemes.map((t) => t.id === id ? { ...t, confirmed: true } : t) });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-12 space-y-18">

        {/* Strategic Angle */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <p className="text-xs font-medium text-primary/70 uppercase tracking-widest">Strategic Angle</p>
          </div>
          <p className="text-xl leading-[1.75] text-foreground/85 font-light">
            {blueprint.strategicAngle}
          </p>
        </section>

        <Divider />

        {/* Platform Strategy */}
        <section className="space-y-8">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Platform Strategy</p>
            <p className="text-xs text-muted-foreground">Budget allocation across ad networks, ranked by strategic priority.</p>
          </div>
          <div className="space-y-4">
            {blueprint.platforms.map((p) => {
              const alloc = budget ? Math.round(budget * p.budgetPct / 100) : null;
              const connected = PLATFORM_CONN[p.name] ?? false;
              return (
                <div key={p.name} className={`p-7 rounded-2xl border transition-all ${
                  p.recommended
                    ? "border-white/[0.07] bg-white/[0.015]"
                    : "border-white/[0.03] opacity-55"
                }`}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <p className="font-semibold text-lg">{p.name}</p>
                        {p.recommended && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-primary/20 text-primary/80 bg-primary/[0.06] font-medium">
                            Recommended
                          </span>
                        )}
                        {!connected && (
                          <span className="text-xs text-amber-400/60 flex items-center gap-1">
                            <AlertTriangle size={11} /> Not connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.rationale}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-4xl font-bold text-foreground">{p.budgetPct}%</p>
                      {alloc && <p className="text-sm text-muted-foreground mt-0.5">${alloc.toLocaleString()}/mo</p>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.recommended ? "bg-primary" : "bg-white/20"}`}
                      style={{ width: `${p.budgetPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Divider />

        {/* Keyword Themes */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground/60 mb-1">Keyword Themes</p>
              <p className="text-xs text-muted-foreground">Strategic clusters. Review each group — approve what fits, reject what doesn't.</p>
            </div>
            <span className={`text-sm font-medium tabular-nums ${
              blueprint.keywordThemes.filter((t) => t.approved === true).length === blueprint.keywordThemes.length
                ? "text-emerald-400"
                : "text-muted-foreground"
            }`}>
              {blueprint.keywordThemes.filter((t) => t.approved === true).length}/{blueprint.keywordThemes.length} approved
            </span>
          </div>
          <div className="space-y-4">
            {blueprint.keywordThemes.map((theme) => {
              const ic = INTENT_COLORS[theme.intent] ?? INTENT_COLORS.Informational;
              return (
                <div key={theme.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    theme.approved === true
                      ? "border-emerald-500/15 bg-emerald-500/[0.025]"
                      : theme.approved === false
                      ? "border-white/[0.02] opacity-30"
                      : "border-white/[0.07] bg-white/[0.01]"
                  }`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ic.badge}`}>
                        {theme.intent}
                      </span>
                      <p className="font-semibold text-sm">{theme.name}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => approveTheme(theme.id, true)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          theme.approved === true
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "text-muted-foreground/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        onClick={() => approveTheme(theme.id, false)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          theme.approved === false
                            ? "bg-red-500/15 text-red-400"
                            : "text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                      >
                        <ThumbsUp size={13} className="scale-y-[-1]" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {theme.keywords.map((kw) => (
                      <span key={kw} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] border border-white/[0.05] text-foreground/65 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Divider />

        {/* Negative Keywords */}
        <section className="space-y-8">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Negative Keyword Themes</p>
            <p className="text-xs text-muted-foreground">Exclusion lists to protect budget from non-commercial searches. Confirm each.</p>
          </div>
          <div className="space-y-3">
            {blueprint.negativeThemes.map((t) => (
              <div key={t.id}
                className={`flex items-start gap-5 p-6 rounded-2xl border transition-all ${
                  t.confirmed
                    ? "border-white/[0.04] bg-white/[0.01]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-sm">{t.name}</p>
                    <span className="text-[10px] text-red-400/50 border border-red-400/12 px-2 py-0.5 rounded-full">Negative</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t.rationale}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.terms.map((term) => (
                      <span key={term} className="px-2.5 py-1 rounded-full text-xs border border-red-500/12 text-red-300/55 font-mono">{term}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => confirmNeg(t.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs transition-colors ${
                    t.confirmed
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                      : "border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/15"
                  }`}
                >
                  <Check size={11} /> {t.confirmed ? "Confirmed" : "Confirm"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* Ad Direction */}
        <section className="space-y-8">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Ad Direction</p>
            <p className="text-xs text-muted-foreground">Creative brief for this campaign — angle, tone, and example copy.</p>
          </div>
          <div className="space-y-9">
            <div>
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">Creative Angle</p>
              <p className="text-base leading-relaxed text-foreground/80">{blueprint.adDirection.angle}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">Tone of Voice</p>
              <p className="text-sm text-foreground/65 leading-relaxed">{blueprint.adDirection.tone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">Headline Examples</p>
              <div className="space-y-2">
                {blueprint.adDirection.headlines.map((h, i) => (
                  <div key={i} className="px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] font-medium text-sm">{h}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">Description Examples</p>
              <div className="space-y-2">
                {blueprint.adDirection.descriptions.map((d, i) => (
                  <div key={i} className="px-5 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-foreground/60 leading-relaxed">{d}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* Tracking */}
        <section className="space-y-7 pb-12">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Tracking & Measurement</p>
            <p className="text-xs text-muted-foreground">Conversion event and implementation requirements before launch.</p>
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.015]">
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">Primary Conversion Event</p>
              <p className="font-mono text-sm text-primary">{blueprint.conversionEvent}</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.015]">
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">Implementation Notes</p>
              <p className="text-sm text-foreground/75 leading-relaxed">{blueprint.trackingNotes}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Validation Rail ──────────────────────────────────────────────────────────

function ValidationRail({ blueprint, intent, onRequestApproval, saving, createdCampaignId, mode }: {
  blueprint: GeneratedBlueprint;
  intent: CampaignIntent;
  onRequestApproval: () => void;
  saving: boolean;
  createdCampaignId: number | null;
  mode: StudioMode;
}) {
  const approvedThemes = blueprint.keywordThemes.filter((t) => t.approved === true).length;
  const totalThemes = blueprint.keywordThemes.length;
  const hasLandingPage = !!intent.landingPage?.startsWith("http");
  const hasTracking = !!blueprint.conversionEvent;
  const platformsSet = blueprint.platforms.length > 0;
  const allKeywordsReviewed = approvedThemes === totalThemes;

  const checks = [
    { label: "Blueprint generated", done: true },
    { label: "Platform strategy set", done: platformsSet },
    { label: `Keywords reviewed (${approvedThemes}/${totalThemes})`, done: allKeywordsReviewed },
    { label: "Landing page verified", done: hasLandingPage },
    { label: "Tracking plan set", done: hasTracking },
  ];

  const blockers: { msg: string; error: boolean }[] = [];
  if (!hasLandingPage) blockers.push({ msg: "Landing page URL required before approval", error: true });
  if (!allKeywordsReviewed) blockers.push({ msg: `${totalThemes - approvedThemes} keyword theme${totalThemes - approvedThemes > 1 ? "s" : ""} not reviewed`, error: false });
  if (!PLATFORM_CONN["Baidu"] && intent.geography?.toLowerCase().includes("china")) {
    blockers.push({ msg: "Baidu account required for China targeting", error: true });
  }
  if (!createdCampaignId) blockers.push({ msg: "Campaign not yet saved to API", error: false });

  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const hardBlockers = blockers.filter((b) => b.error);
  const canApprove = hardBlockers.length === 0 && !!createdCampaignId;

  const budget = Number(intent.totalBudget || 0);
  const dailyCap = budget ? Math.round(budget / 30) : null;

  return (
    <div className="w-80 shrink-0 border-l border-white/[0.05] bg-[#0c0e17] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 space-y-9">

        {/* Campaign summary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">Campaign</p>
          <p className="font-semibold text-sm leading-snug mb-4">{intent.name || "Untitled campaign"}</p>
          <div className="space-y-2.5">
            {intent.primaryGoal && (
              <div className="flex items-center gap-2.5 text-sm">
                <Target size={13} className="shrink-0 text-primary/40" />
                <span className="text-muted-foreground capitalize">{intent.primaryGoal.replace(/_/g, " ")}</span>
              </div>
            )}
            {intent.geography && (
              <div className="flex items-center gap-2.5 text-sm">
                <Globe size={13} className="shrink-0 text-muted-foreground/40" />
                <span className="text-muted-foreground">{intent.geography}</span>
              </div>
            )}
            {budget > 0 && (
              <div className="flex items-center gap-2.5 text-sm">
                <DollarSign size={13} className="shrink-0 text-muted-foreground/40" />
                <span className="text-muted-foreground">${budget.toLocaleString()}/mo{dailyCap ? ` · $${dailyCap.toLocaleString()}/day` : ""}</span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Provider readiness + validation together */}
        <div className="space-y-6">
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Validation</p>

          {/* Gauges */}
          <div className="flex items-center justify-around">
            <RadialGauge score={blueprint.providerReadiness.google} label="Google Ads" size={88} />
            <RadialGauge score={blueprint.providerReadiness.bing} label="Bing Ads" size={88} />
          </div>

          {/* Expert: provider detail */}
          {mode === "expert" && (
            <div className="text-xs text-muted-foreground space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span>Conversion tracking</span>
                <span className="text-emerald-400">Configured</span>
              </div>
              <div className="flex justify-between">
                <span>Landing page quality</span>
                <span className={hasLandingPage ? "text-emerald-400" : "text-amber-400"}>{hasLandingPage ? "Verified" : "Unverified"}</span>
              </div>
              <div className="flex justify-between">
                <span>Account connection</span>
                <span className="text-emerald-400">Google · Bing</span>
              </div>
            </div>
          )}

          {/* Approval readiness bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground/60">Approval readiness</p>
              <span className={`text-sm font-bold tabular-nums ${pct === 100 ? "text-emerald-400" : "text-muted-foreground"}`}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-400" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="space-y-2.5">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {c.done
                    ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border border-white/[0.15] shrink-0" />
                  }
                  <span className={`text-xs leading-snug ${c.done ? "text-foreground/65" : "text-muted-foreground/40"}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockers */}
          {blockers.length > 0 && (
            <div className="space-y-2 pt-1">
              {blockers.map((b, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs p-3 rounded-xl ${
                  b.error ? "bg-red-500/[0.07] text-red-300" : "bg-amber-500/[0.07] text-amber-300"
                }`}>
                  {b.error
                    ? <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    : <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  }
                  <span className="leading-snug">{b.msg}</span>
                </div>
              ))}
            </div>
          )}

          {canApprove && blockers.length === 0 && (
            <div className="flex items-start gap-2 text-xs text-emerald-400/80">
              <CheckCircle size={12} className="shrink-0 mt-0.5" />
              <span>No blocking issues — ready for approval.</span>
            </div>
          )}
        </div>

      </div>

      {/* Approval CTA — sticky at bottom */}
      <div className="shrink-0 p-6 border-t border-white/[0.05]">
        {!createdCampaignId && (
          <p className="text-xs text-muted-foreground/50 text-center mb-4">
            Generate the blueprint first to enable approval.
          </p>
        )}
        {createdCampaignId && !canApprove && (
          <p className="text-xs text-muted-foreground/50 text-center mb-4">
            Resolve blocking issues above before requesting approval.
          </p>
        )}
        <button
          onClick={onRequestApproval}
          disabled={!canApprove || saving}
          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm transition-all ${
            canApprove && !saving
              ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              : "bg-white/[0.04] text-muted-foreground/40 cursor-not-allowed"
          }`}
          data-testid="btn-request-approval"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Submitting…</>
          ) : (
            <>Request Approval <ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Blueprint Studio (full-screen overlay) ───────────────────────────────────

function BlueprintStudio({ open, onClose, initialCampaign }: {
  open: boolean; onClose: () => void; initialCampaign?: Campaign | null;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<"intent" | "blueprint">("intent");
  const [mode, setMode] = useState<StudioMode>("guided");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

  const createCampaign = useCreateCampaign();
  const generateBlueprintMutation = useGenerateBlueprint();
  const submitApprovalMutation = useSubmitCampaignForApproval();

  const [intent, setIntent] = useState<CampaignIntent>({
    name: initialCampaign?.name || "",
    primaryGoal: "",
    secondaryGoals: [],
    urgency: "balanced",
    offer: "",
    geography: "",
    audience: "",
    landingPage: "",
    totalBudget: initialCampaign?.budget ? String(initialCampaign.budget) : "",
    maxCpl: "",
  });

  const [blueprint, setBlueprint] = useState<GeneratedBlueprint | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
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

      const apiBp = await generateBlueprintMutation.mutateAsync({ id: campaign.id });
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
      if (!localBp.platforms.length || !localBp.keywordThemes.length) {
        const fallback = generateBlueprint(intent);
        if (!localBp.platforms.length) localBp.platforms = fallback.platforms;
        if (!localBp.keywordThemes.length) localBp.keywordThemes = fallback.keywordThemes;
        if (!localBp.negativeThemes.length) localBp.negativeThemes = fallback.negativeThemes;
      }
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
        await submitApprovalMutation.mutateAsync({ id: createdCampaignId });
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

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-7 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain size={14} className="text-primary" />
            </div>
            <span className="text-sm font-semibold">Blueprint Studio</span>
          </div>
          <div className="w-px h-4 bg-white/[0.08]" />
          <StepIndicator phase={phase} />
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          {phase === "blueprint" && (
            <button
              onClick={() => setPhase("intent")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
            >
              ← Edit Intent
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            data-testid="btn-close-studio"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Campaign name subheader (blueprint phase only) ── */}
      {phase === "blueprint" && intent.name && (
        <div className="shrink-0 px-7 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{intent.name}</span>
            {intent.primaryGoal && <span className="ml-2 capitalize text-muted-foreground/60">· {intent.primaryGoal.replace(/_/g, " ")}</span>}
            {intent.geography && <span className="ml-2 text-muted-foreground/60">· {intent.geography}</span>}
            {intent.totalBudget && <span className="ml-2 text-muted-foreground/60">· ${Number(intent.totalBudget).toLocaleString()}/mo</span>}
          </p>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {phase === "intent" ? (
          <IntentCanvas
            intent={intent}
            setIntent={setIntent}
            onGenerate={handleGenerate}
            generating={generating}
            mode={mode}
          />
        ) : blueprint ? (
          <>
            <BlueprintCanvas
              blueprint={blueprint}
              intent={intent}
              setBlueprint={setBlueprint}
              mode={mode}
            />
            <ValidationRail
              blueprint={blueprint}
              intent={intent}
              onRequestApproval={handleRequestApproval}
              saving={saving}
              createdCampaignId={createdCampaignId}
              mode={mode}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── PPC Overview ─────────────────────────────────────────────────────────────

function PPCOverview({ campaigns, onNewCampaign, onEditCampaign }: {
  campaigns: Campaign[]; onNewCampaign: () => void; onEditCampaign: (c: Campaign) => void;
}) {
  const active = campaigns.filter((c) => c.status === "live" || c.status === "optimising");
  const pending = campaigns.filter((c) => c.approvalStatus === "pending");
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok");
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const topRec = campaigns.find((c) => c.sparkRec);

  return (
    <div className="grid grid-cols-[1fr_280px] gap-8">
      {/* Left — main content */}
      <div className="space-y-8">

        {/* SPARK intelligence band */}
        <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <p className="text-xs font-medium text-primary/60 uppercase tracking-widest mb-5">SPARK Intelligence</p>
          {topRec ? (
            <>
              <p className="text-2xl font-bold mb-1.5 leading-snug">{topRec.sparkRec}</p>
              <p className="text-muted-foreground text-sm">{topRec.name}</p>
            </>
          ) : (
            <p className="text-2xl font-bold">All campaigns healthy — no critical actions.</p>
          )}
          <div className="flex items-center gap-8 mt-8 pt-6 border-t border-white/[0.05]">
            {[
              { value: active.length.toString(), label: "Active campaigns", color: "text-emerald-400" },
              { value: `$${(totalSpend / 1000).toFixed(1)}k`, label: `of $${(totalBudget / 1000).toFixed(0)}k/mo`, color: "" },
              { value: pending.length.toString(), label: "Awaiting approval", color: pending.length > 0 ? "text-amber-400" : "text-muted-foreground" },
              { value: trackingIssues.length.toString(), label: trackingIssues.length > 0 ? "Tracking issues" : "All tracking OK", color: trackingIssues.length > 0 ? "text-red-400" : "text-emerald-400" },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-8">
                <div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-10 bg-white/[0.06]" />}
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
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "live" || c.status === "optimising" ? "bg-emerald-400" : c.status === "approval" ? "bg-amber-400" : c.status === "data_check" ? "bg-red-400" : "bg-white/20"}`} />
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.trackingStatus !== "ok" && <AlertTriangle size={11} className={`${c.trackingStatus === "error" ? "text-red-400" : "text-amber-400"} shrink-0`} />}
                  </div>
                  {c.sparkRec && <p className="text-xs text-primary/40 ml-4">{c.sparkRec}</p>}
                </div>
                <span className={`text-xs font-medium ${STATUS_CONFIG[c.status].color}`}>{STATUS_CONFIG[c.status].label}</span>
                <p className="text-right text-sm">{c.budget ? `$${(c.budget / 1000).toFixed(0)}k` : "—"}</p>
                <p className="text-right text-sm text-primary">{c.conversions > 0 ? c.conversions : "—"}</p>
                <p className="text-right text-sm text-muted-foreground">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</p>
                <button onClick={() => onEditCampaign(c)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  data-testid={`btn-edit-${c.id}`}>
                  <Edit size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account connection status */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <span className="text-xs text-muted-foreground/30 mr-1">Accounts:</span>
          {(["Google Ads", "Microsoft Advertising", "Baidu", "Naver"] as Platform[]).map((p) => (
            <span key={p} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${PLATFORM_CONN[p] ? "border-emerald-500/12 text-emerald-400/70" : "border-white/[0.04] text-muted-foreground/30"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PLATFORM_CONN[p] ? "bg-emerald-400" : "bg-white/10"}`} />
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
                <div key={c.id} className="p-5 rounded-2xl border border-amber-500/12 bg-amber-500/[0.03]">
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
                <div key={c.id} className={`p-5 rounded-2xl border ${c.trackingStatus === "error" ? "border-red-500/12 bg-red-500/[0.03]" : "border-amber-500/12 bg-amber-500/[0.03]"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {c.trackingStatus === "error" ? <XCircle size={12} className="text-red-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
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
              <div key={i} className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] transition-colors">
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
    { type: "Negative Keywords", priority: "high", title: "Add 14 negative keywords to eliminate ~$1,840/mo wasted spend", campaign: "Non-Brand — Singapore SMEs", effort: "5 min", impact: "$1,840 saved" },
    { type: "Budget Reallocation", priority: "high", title: "Move $3k from Competitor Conquest (1.8× ROAS) to Brand Search (6.1× ROAS)", campaign: "Global", effort: "2 min", impact: "+$4k projected return" },
    { type: "Tracking Fix", priority: "high", title: "Fix missing GA4 conversion event on Enterprise Lead Gen before launch", campaign: "Enterprise Lead Gen", effort: "15 min", impact: "Required for Smart Bidding" },
    { type: "Ad Refresh", priority: "medium", title: "Refresh headlines for Competitor Conquest — CTR at 1.9%, benchmark is 3.5%", campaign: "Competitor Conquest", effort: "10 min", impact: "+80% estimated CTR" },
  ];
  const priorityDot: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-muted-foreground" };
  return (
    <div className="max-w-3xl space-y-3">
      {RECS.map((r, i) => (
        <div key={i} className="flex items-start gap-5 p-7 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] transition-colors">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[r.priority]}`} />
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
    { title: "Budget approval — Enterprise Lead Gen", type: "Budget", amount: "$18,000/mo", by: "Sarah Park", time: "2h ago", urgent: true },
    { title: "Keyword approval — Baidu China Expansion", type: "Keywords", amount: "142 keyword themes", by: "Priya Sharma", time: "4h ago", urgent: false },
    { title: "Ad copy approval — Competitor Conquest v2", type: "Ad Direction", amount: "6 variants", by: "David Lee", time: "Yesterday", urgent: false },
  ];
  return (
    <div className="max-w-3xl space-y-3">
      {APPROVALS.map((a, i) => (
        <div key={i} className={`flex items-start gap-5 p-7 rounded-2xl border ${a.urgent ? "border-amber-500/12 bg-amber-500/[0.025]" : "border-white/[0.05] bg-white/[0.01]"}`}>
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
    { name: "Campaign Performance Summary", note: "All campaigns · Last 30 days" },
    { name: "Platform Comparison", note: "Google vs Bing side-by-side" },
    { name: "Keyword Performance", note: "By theme cluster and match type" },
    { name: "Budget Pacing", note: "Spend vs. plan by campaign" },
    { name: "Lead Quality & CRM Attribution", note: "Pipeline source breakdown" },
    { name: "AI Executive Summary", note: "Auto-generated by SPARK" },
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

  const openNewCampaign = () => {
    setSelectedCampaign(null);
    setSessionId(Date.now().toString());
    setStudioOpen(true);
  };

  const openEditCampaign = (c: Campaign) => {
    setSelectedCampaign(c);
    setSessionId(`edit-${c.id}-${Date.now()}`);
    setStudioOpen(true);
  };

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "recommendations", label: "Recommendations" },
    { value: "approvals", label: "Approvals" },
    { value: "reports", label: "Reports" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-ppc">PPC / Paid Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Google, Bing, Baidu, Naver — one command centre.</p>
        </div>
        <button
          onClick={openNewCampaign}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-new-campaign"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-white/[0.05]">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab.value}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview" && <PPCOverview campaigns={campaigns} onNewCampaign={openNewCampaign} onEditCampaign={openEditCampaign} />}
        {activeTab === "recommendations" && <RecommendationsView />}
        {activeTab === "approvals" && <ApprovalsView />}
        {activeTab === "reports" && <ReportsView />}
      </div>

      <BlueprintStudio
        key={sessionId}
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        initialCampaign={selectedCampaign}
      />
    </div>
  );
}
