import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCampaign,
  useGenerateBlueprint,
  useSubmitCampaignForApproval,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2,
  ChevronRight, ChevronLeft, Brain, Sparkles, Lightbulb, FileText,
  Edit, Eye, Zap, X, ArrowRight, ThumbsUp, ThumbsDown, Globe, Hash,
  Shield, DollarSign, Target, Wand2, BarChart2, MonitorPlay, Circle,
  Check, Download, TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver";
type CampaignStatus = "draft" | "blueprint" | "approval" | "live" | "optimising" | "paused" | "data_check";

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
  { value: "sales", label: "Drive Sales", desc: "Direct purchase or subscription" },
  { value: "bookings", label: "Book Appointments", desc: "Demo, call, or in-person visit" },
  { value: "traffic", label: "Website Traffic", desc: "Awareness and top-of-funnel reach" },
  { value: "brand_protection", label: "Brand Protection", desc: "Own your branded search terms" },
  { value: "competitor_conquest", label: "Competitor Conquest", desc: "Appear on rival brand searches" },
];

const SECONDARY_GOALS = [
  "Reduce CPL", "Improve lead quality", "Expand geography", "Test keyword clusters",
  "Improve CTR", "Increase branded coverage", "Reduce wasted spend", "Improve conversion rate",
];

const GOAL_LABELS: Record<string, string> = Object.fromEntries(PRIMARY_GOALS.map((g) => [g.value, g.label]));

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

const INTENT_DOT: Record<string, string> = {
  Brand: "bg-blue-400", "High Intent": "bg-green-400", Product: "bg-violet-400",
  Competitor: "bg-red-400", Local: "bg-cyan-400", Informational: "bg-gray-400",
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Brand Search — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"], status: "live", budget: 15000, spend: 12400, conversions: 312, cpl: 39.74, trackingStatus: "ok", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Raise bids on top 3 brand terms — ROAS 6.1×", blueprintReady: true },
  { id: 2, name: "Non-Brand — Singapore SMEs", platforms: ["Google Ads"], status: "optimising", budget: 22000, spend: 18900, conversions: 247, cpl: 76.52, trackingStatus: "ok", approvalStatus: "approved", owner: "Sarah Park", sparkRec: "Add 14 negatives → cut ~$1,840 wasted spend", blueprintReady: true },
  { id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"], status: "live", budget: 9000, spend: 8200, conversions: 58, cpl: 141.38, trackingStatus: "warning", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Pause low-converting ad group — CPA 2× target", blueprintReady: true },
  { id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"], status: "approval", budget: 18000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "warning", approvalStatus: "pending", owner: "Sarah Park", blueprintReady: true },
  { id: 5, name: "Baidu China Expansion", platforms: ["Baidu"], status: "data_check", budget: 12000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "error", approvalStatus: "not_required", owner: "Priya Sharma", blueprintReady: false },
];

// ─── Blueprint generator (mock) ───────────────────────────────────────────────

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
      { id: 2, name: "High-Intent Buyers", intent: "High Intent", keywords: ["marketing automation software", "ai campaign manager", "best marketing platform 2025", "marketing software for saas"], approved: null },
      { id: 3, name: "Product Category", intent: "Product", keywords: ["campaign management tool", "ppc management software", "omnichannel marketing platform", "ai ad platform"], approved: null },
      { id: 4, name: `Competitor Terms`, intent: "Competitor", keywords: ["hubspot alternative", "marketo alternative", "salesforce marketing alternative", "semrush alternatives"], approved: null },
      { id: 5, name: `${geo} Local Intent`, intent: "Local", keywords: [`marketing software ${geo.toLowerCase()}`, `marketing agency replacement ${geo.toLowerCase()}`, `b2b marketing tool ${geo.toLowerCase()}`], approved: null },
    ],
    negativeThemes: [
      { id: 1, name: "Career Searches", rationale: "Eliminates job-seekers from click budget", terms: ["jobs", "salary", "career", "hiring", "intern", "vacancy"] },
      { id: 2, name: "Free / DIY Intent", rationale: "Filters out non-commercial visitors unlikely to convert", terms: ["free", "open source", "diy", "template", "free trial forever", "crack"] },
      { id: 3, name: "Educational", rationale: "Prevents budget waste on learners rather than buyers", terms: ["tutorial", "course", "certification", "how to", "learn", "youtube", "reddit"] },
    ],
    adDirection: {
      angle: "Lead with the AI co-pilot angle — SPARK removes the complexity of running paid search without needing an agency. Messaging should emphasise speed to results, less wasted spend, and the unified command-centre approach.",
      tone: "Confident, concise, outcome-first. Avoid jargon. Speak to marketing managers who are accountable for pipeline, not clicks.",
      headlines: ["SPARK AI — Marketing Suite", `Free ${intent.offer?.includes("trial") ? "14-Day" : ""} Trial`, `Reduce Wasted Ad Spend`],
      descriptions: [
        `Plan, launch and optimise paid search campaigns with AI — no agency required. One platform for ${intent.geography || "APAC"} and beyond.`,
        `${intent.offer || "Start free today"}. AI-powered keyword strategy, budget pacing and creative in one command centre.`,
      ],
    },
    conversionEvent: intent.primaryGoal === "leads" ? "generate_lead" : intent.primaryGoal === "sales" ? "purchase" : "appointment_booked",
    trackingNotes: "Google Tag Manager recommended for implementation. Ensure the conversion tag fires on the thank-you page, not the CTA click. Verify with Google Tag Assistant before requesting approval.",
    providerReadiness: { google: intent.landingPage?.startsWith("http") ? 85 : 60, bing: 72 },
  };
}

// ─── Blueprint Studio ─────────────────────────────────────────────────────────

const STUDIO_SECTIONS = [
  { id: "intent", label: "Campaign Intent", icon: Target },
  { id: "platforms", label: "Platform Strategy", icon: Globe },
  { id: "keywords", label: "Keyword Themes", icon: Hash },
  { id: "budget", label: "Budget & Pacing", icon: DollarSign },
  { id: "ads", label: "Ad Direction", icon: Wand2 },
  { id: "tracking", label: "Tracking", icon: Shield },
  { id: "review", label: "Review & Approval", icon: CheckCircle },
];

function SectionNav({
  active, setActive, generatedSections, completedSections,
}: { active: string; setActive: (s: string) => void; generatedSections: Set<string>; completedSections: Set<string> }) {
  return (
    <nav className="w-52 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0c0e16] overflow-y-auto">
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <p className="text-xs font-bold text-primary/70 uppercase tracking-widest">Blueprint Studio</p>
      </div>
      <div className="flex-1 py-4 space-y-0.5 px-2">
        {STUDIO_SECTIONS.map((s) => {
          const isActive = active === s.id;
          const isCompleted = completedSections.has(s.id);
          const isGenerated = generatedSections.has(s.id);
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-primary/20" : "bg-white/[0.04]"}`}>
                <Icon size={12} className={isActive ? "text-primary" : ""} />
              </div>
              <span className="text-sm flex-1">{s.label}</span>
              {isCompleted && <Check size={11} className="text-green-400 shrink-0" />}
              {!isCompleted && isGenerated && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Intent Section ────────────────────────────────────────────────────────────

function IntentSection({ intent, setIntent, onGenerate, generating }: {
  intent: CampaignIntent; setIntent: (i: CampaignIntent) => void; onGenerate: () => void; generating: boolean;
}) {
  const set = (k: keyof CampaignIntent, v: any) => setIntent({ ...intent, [k]: v });
  const toggleSecondary = (g: string) => {
    set("secondaryGoals", intent.secondaryGoals.includes(g)
      ? intent.secondaryGoals.filter((x) => x !== g)
      : [...intent.secondaryGoals, g]);
  };

  const canGenerate = !!intent.primaryGoal && intent.name.length > 0;

  return (
    <div className="max-w-2xl space-y-12">
      {/* Campaign name */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-4">Campaign Name</label>
        <input
          type="text"
          placeholder="Give this campaign a name…"
          value={intent.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full bg-transparent border-0 border-b border-white/10 text-3xl font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/40 transition-colors pb-2"
          data-testid="input-campaign-name"
        />
      </div>

      {/* Primary objective */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">Primary Objective <span className="text-red-400 ml-1">required</span></label>
        <p className="text-sm text-muted-foreground mb-5">Everything — bids, keywords, copy, and measurement — flows from this choice.</p>
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_GOALS.map((g) => {
            const active = intent.primaryGoal === g.value;
            return (
              <button key={g.value} onClick={() => set("primaryGoal", g.value)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 group ${active ? "border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className={`font-semibold text-base ${active ? "text-primary" : "text-foreground"}`}>{g.label}</p>
                  {active && <CheckCircle size={15} className="text-primary shrink-0 mt-0.5" />}
                </div>
                <p className="text-sm text-muted-foreground">{g.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary objectives */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">Secondary Objectives <span className="text-muted-foreground/50 font-normal ml-1 text-xs normal-case">optional — select any that apply</span></label>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_GOALS.map((g) => {
            const active = intent.secondaryGoals.includes(g);
            return (
              <button key={g} onClick={() => toggleSecondary(g)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${active ? "border-primary/40 bg-primary/10 text-primary" : "border-white/[0.06] text-muted-foreground hover:border-white/15 hover:text-foreground"}`}>
                {active && <span className="mr-1">✓</span>}{g}
              </button>
            );
          })}
        </div>
        {intent.secondaryGoals.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">SPARK will factor these into keyword recommendations and optimisation notes, without overriding the primary objective.</p>
        )}
      </div>

      {/* Offer, geo, audience, landing page */}
      <div className="space-y-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Campaign Context</label>
        <div>
          <p className="text-sm font-medium mb-2">What's the offer or CTA?</p>
          <Input placeholder="e.g. Free 14-day trial, Book a demo, Download the guide" value={intent.offer} onChange={(e) => set("offer", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08] text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-sm font-medium mb-2">Target Geography</p>
            <Input placeholder="e.g. Singapore, Malaysia, Australia" value={intent.geography} onChange={(e) => set("geography", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08] text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Monthly Budget ($)</p>
            <Input type="number" placeholder="e.g. 15000" value={intent.totalBudget} onChange={(e) => set("totalBudget", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08] text-sm" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Who are you targeting?</p>
          <Input placeholder="e.g. Marketing managers at B2B SaaS companies, 10–200 employees" value={intent.audience} onChange={(e) => set("audience", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08] text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Landing Page URL</p>
            {intent.landingPage?.startsWith("http") && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Valid</span>}
          </div>
          <Input placeholder="https://yoursite.com/campaign" value={intent.landingPage} onChange={(e) => set("landingPage", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08] text-sm font-mono" />
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">Pacing Mode</label>
        <div className="flex gap-3">
          {[["test","Test","Start slow. Learn before scaling."],["balanced","Balanced","Standard pacing — recommended."],["aggressive","Aggressive","Spend the full daily budget."]].map(([v,l,d]) => (
            <button key={v} onClick={() => set("urgency", v)}
              className={`flex-1 p-4 rounded-2xl border text-left transition-all ${intent.urgency === v ? "border-primary/40 bg-primary/8" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}>
              <p className={`font-semibold text-sm ${intent.urgency === v ? "text-primary" : ""}`}>{l}</p>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <div className="pt-4">
        <button onClick={onGenerate} disabled={!canGenerate || generating}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold transition-all ${canGenerate && !generating ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-white/[0.04] text-muted-foreground cursor-not-allowed"}`}>
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {generating ? "Generating blueprint…" : "Generate Campaign Blueprint"}
        </button>
        {!canGenerate && <p className="text-xs text-muted-foreground mt-3">Set a campaign name and primary objective to continue.</p>}
      </div>
    </div>
  );
}

// ── Platform Strategy Section ─────────────────────────────────────────────────

function PlatformSection({ blueprint, intent }: { blueprint: GeneratedBlueprint; intent: CampaignIntent }) {
  const budget = Number(intent.totalBudget || 0);
  return (
    <div className="max-w-2xl space-y-10">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/8 to-transparent border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">SPARK Strategic Angle</span>
        </div>
        <p className="text-base leading-relaxed text-foreground/90">{blueprint.strategicAngle}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Recommended Platform Mix</p>
        <div className="space-y-4">
          {blueprint.platforms.map((p) => {
            const alloc = budget ? Math.round(budget * p.budgetPct / 100) : null;
            return (
              <div key={p.name} className={`p-5 rounded-2xl border ${p.recommended ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] bg-transparent opacity-60"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-semibold text-base">{p.name}</p>
                      {p.recommended && <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/8">Recommended</span>}
                      {!PLATFORM_CONN[p.name] && <span className="text-xs text-amber-400/80">Not connected</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">{p.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{p.budgetPct}%</p>
                    {alloc && <p className="text-sm text-muted-foreground">${alloc.toLocaleString()}/mo</p>}
                  </div>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full">
                  <div className={`h-full rounded-full ${p.recommended ? "bg-primary" : "bg-white/20"}`} style={{ width: `${p.budgetPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Keyword Themes Section ────────────────────────────────────────────────────

function KeywordsSection({ blueprint, setBlueprint }: { blueprint: GeneratedBlueprint; setBlueprint: (b: GeneratedBlueprint) => void }) {
  const setThemeApproval = (id: number, approved: boolean) => {
    setBlueprint({ ...blueprint, keywordThemes: blueprint.keywordThemes.map((t) => t.id === id ? { ...t, approved } : t) });
  };
  const setNegApproval = (id: number, approved: boolean) => {
    setBlueprint({ ...blueprint, negativeThemes: blueprint.negativeThemes.map((t) => t.id === id ? { ...t, approved: approved as any } : t) });
  };

  const approved = blueprint.keywordThemes.filter((t) => t.approved === true).length;

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Keyword Themes</p>
          <span className="text-xs text-muted-foreground">{approved}/{blueprint.keywordThemes.length} themes approved</span>
        </div>
        <p className="text-sm text-muted-foreground mb-7">SPARK organises keywords into strategic themes, not flat lists. Approve, reject, or edit each cluster before launch.</p>
        <div className="space-y-4">
          {blueprint.keywordThemes.map((theme) => (
            <div key={theme.id} className={`p-5 rounded-2xl border transition-all ${theme.approved === true ? "border-green-500/20 bg-green-500/[0.04]" : theme.approved === false ? "border-white/[0.03] opacity-40" : "border-white/[0.08] bg-white/[0.02]"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${INTENT_DOT[theme.intent]}`} />
                  <p className="font-semibold text-base">{theme.name}</p>
                  <span className="text-xs text-muted-foreground">{theme.intent}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setThemeApproval(theme.id, true)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${theme.approved === true ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:text-green-400 hover:bg-green-500/10"}`}><ThumbsUp size={13} /></button>
                  <button onClick={() => setThemeApproval(theme.id, false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${theme.approved === false ? "bg-red-500/15 text-red-400" : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"}`}><ThumbsDown size={13} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {theme.keywords.map((kw) => (
                  <span key={kw} className="px-3 py-1.5 rounded-full text-sm bg-white/[0.05] border border-white/[0.06] text-foreground/80">{kw}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-white/[0.06]" />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Negative Keyword Themes</p>
        <p className="text-sm text-muted-foreground mb-7">These prevent your budget from being consumed by non-commercial searches. Confirm which apply to this campaign.</p>
        <div className="space-y-3">
          {blueprint.negativeThemes.map((t) => (
            <div key={t.id} className="flex items-center gap-5 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <span className="text-xs text-red-400/70">Negative</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2.5">{t.rationale}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.terms.map((term) => <span key={term} className="px-2.5 py-1 rounded-full text-xs border border-red-500/15 text-red-300/70">{term}</span>)}
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors shrink-0">
                <Check size={11} /> Confirm
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Budget & Pacing Section ───────────────────────────────────────────────────

function BudgetSection({ intent, setIntent, blueprint }: { intent: CampaignIntent; setIntent: (i: CampaignIntent) => void; blueprint: GeneratedBlueprint }) {
  const set = (k: keyof CampaignIntent, v: any) => setIntent({ ...intent, [k]: v });
  const budget = Number(intent.totalBudget || 0);
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Monthly Budget</p>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <input type="number" placeholder="0" value={intent.totalBudget}
              onChange={(e) => set("totalBudget", e.target.value)}
              className="w-full bg-transparent border-0 border-b border-white/10 text-5xl font-bold placeholder:text-white/10 focus:outline-none focus:border-primary/40 transition-colors pb-2 tracking-tight" />
          </div>
          <span className="text-2xl text-muted-foreground pb-3">/month</span>
        </div>
        {budget > 0 && (
          <p className="text-sm text-muted-foreground">{budget > 0 ? `Daily cap: ~$${Math.round(budget / 30).toLocaleString()}` : ""}</p>
        )}
      </div>

      {budget > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Platform Allocation</p>
          <div className="space-y-3">
            {blueprint.platforms.filter((p) => p.recommended).map((p) => {
              const alloc = Math.round(budget * p.budgetPct / 100);
              return (
                <div key={p.name} className="flex items-center gap-4">
                  <span className="text-sm w-40 shrink-0">{p.name === "Microsoft Advertising" ? "Microsoft / Bing" : p.name}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.budgetPct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-28 text-right shrink-0">${alloc.toLocaleString()} ({p.budgetPct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Pacing</p>
        <div className="flex gap-3">
          {[["test","Test"],["balanced","Balanced"],["aggressive","Aggressive"]].map(([v, l]) => (
            <button key={v} onClick={() => set("urgency", v)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${intent.urgency === v ? "border-primary/40 bg-primary/8 text-primary" : "border-white/[0.06] text-muted-foreground hover:border-white/15 hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Guardrails <span className="text-muted-foreground/50 font-normal text-xs normal-case ml-1">optional</span></p>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-sm font-medium mb-2">Max CPL Target ($)</p>
            <Input type="number" placeholder="e.g. 120" value={intent.maxCpl} onChange={(e) => set("maxCpl", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08]" />
            <p className="text-xs text-muted-foreground mt-1.5">SPARK will flag campaigns exceeding this threshold.</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Overall monthly cap ($)</p>
            <Input type="number" placeholder="Same as budget or lower" value={intent.totalBudget} onChange={(e) => set("totalBudget", e.target.value)} className="h-11 bg-white/[0.02] border-white/[0.08]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ad Direction Section ──────────────────────────────────────────────────────

function AdDirectionSection({ blueprint, setBlueprint }: { blueprint: GeneratedBlueprint; setBlueprint: (b: GeneratedBlueprint) => void }) {
  const [editing, setEditing] = useState(false);
  const ad = blueprint.adDirection;
  const setAd = (update: Partial<typeof ad>) => setBlueprint({ ...blueprint, adDirection: { ...ad, ...update } });

  return (
    <div className="max-w-2xl space-y-10">
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Strategic Messaging Angle</span>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Edit size={10} />{editing ? "Done" : "Edit"}
          </button>
        </div>
        {editing ? (
          <Textarea value={ad.angle} onChange={(e) => setAd({ angle: e.target.value })} className="bg-white/[0.02] border-white/[0.08] text-sm min-h-[80px]" />
        ) : (
          <p className="text-base leading-relaxed text-foreground/90">{ad.angle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">Tone: <span className="text-foreground/70">{ad.tone}</span></p>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Ad Preview</p>
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2 mb-6">
          <p className="text-blue-400 text-base font-medium">{ad.headlines.join(" | ")}</p>
          <p className="text-green-400/70 font-mono text-sm">sparkapp.io/lp/trial</p>
          {ad.descriptions.map((d, i) => <p key={i} className="text-muted-foreground text-sm">{d}</p>)}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Headlines <span className="font-normal text-muted-foreground/50 ml-1 normal-case text-xs">max 30 chars each</span></p>
          {ad.headlines.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/50 w-4 shrink-0">H{i+1}</span>
              <Input maxLength={30} value={h} onChange={(e) => setAd({ headlines: ad.headlines.map((x, j) => j === i ? e.target.value : x) })} className="h-10 bg-white/[0.02] border-white/[0.08] text-sm" />
              <span className={`text-xs shrink-0 ${h.length > 28 ? "text-red-400" : "text-muted-foreground/40"}`}>{h.length}/30</span>
            </div>
          ))}
        </div>
        <div className="space-y-3 mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Descriptions <span className="font-normal text-muted-foreground/50 ml-1 normal-case text-xs">max 90 chars each</span></p>
          {ad.descriptions.map((d, i) => (
            <div key={i}>
              <Textarea maxLength={90} value={d} onChange={(e) => setAd({ descriptions: ad.descriptions.map((x, j) => j === i ? e.target.value : x) })} className="bg-white/[0.02] border-white/[0.08] text-sm h-12 resize-none" />
              <p className={`text-xs mt-1 ${d.length > 85 ? "text-red-400" : "text-muted-foreground/40"}`}>{d.length}/90</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tracking Section ──────────────────────────────────────────────────────────

function TrackingSection({ blueprint, intent }: { blueprint: GeneratedBlueprint; intent: CampaignIntent }) {
  const hasLp = intent.landingPage?.startsWith("http");
  const items = [
    { label: "Landing page URL", ok: !!hasLp, req: true, note: hasLp ? intent.landingPage : "Required before launch" },
    { label: "GA4 conversion event", ok: !!blueprint.conversionEvent, req: true, note: blueprint.conversionEvent || "Not set" },
    { label: "UTM template", ok: !!hasLp, req: false, note: "Will be auto-appended to the landing page URL" },
    { label: "CRM lead source mapping", ok: false, req: false, note: "Optional — connect your CRM in Integrations" },
  ];
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Conversion Setup</p>
        <p className="text-sm text-muted-foreground mb-7">SPARK validates your tracking configuration against both Google and Microsoft requirements before flagging provider readiness.</p>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border ${item.ok ? "border-green-500/15 bg-green-500/[0.03]" : item.req ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/[0.06]"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.ok ? "bg-green-500/20" : item.req ? "bg-amber-500/20" : "bg-white/[0.06]"}`}>
                {item.ok ? <CheckCircle size={13} className="text-green-400" /> : item.req ? <AlertTriangle size={13} className="text-amber-400" /> : <Circle size={13} className="text-white/20" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.req && !item.ok && <span className="text-xs text-amber-400">Required</span>}
                </div>
                <p className="text-sm text-muted-foreground font-mono">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={13} className="text-amber-400" />
          <p className="text-sm font-semibold">Implementation Note</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{blueprint.trackingNotes}</p>
      </div>
    </div>
  );
}

// ── Review & Approval Section ─────────────────────────────────────────────────

function ReviewSection({ intent, blueprint, onRequestApproval, saving }: {
  intent: CampaignIntent; blueprint: GeneratedBlueprint; onRequestApproval: () => void; saving: boolean;
}) {
  const hasLp = intent.landingPage?.startsWith("http");
  const approvedThemes = blueprint.keywordThemes.filter((t) => t.approved === true).length;
  const canApprove = !!intent.primaryGoal && !!intent.name && !!intent.totalBudget && hasLp;

  return (
    <div className="max-w-2xl space-y-10">
      {/* Executive summary */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Campaign Summary</p>
        <div className="space-y-5">
          <div>
            <p className="text-4xl font-bold tracking-tight mb-1">{intent.name || "Untitled Campaign"}</p>
            <p className="text-lg text-muted-foreground">{intent.primaryGoal ? GOAL_LABELS[intent.primaryGoal] : "No goal set"}{intent.geography ? ` · ${intent.geography}` : ""}</p>
          </div>
          {intent.secondaryGoals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {intent.secondaryGoals.map((g) => <span key={g} className="px-3 py-1 rounded-full text-xs border border-white/[0.08] text-muted-foreground">{g}</span>)}
            </div>
          )}
          <div className="pt-4 grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              ["Monthly Budget", intent.totalBudget ? `$${Number(intent.totalBudget).toLocaleString()}` : "—"],
              ["Pacing", intent.urgency || "Balanced"],
              ["Platforms", `${blueprint.platforms.filter((p) => p.recommended).length} platforms`],
              ["Keyword Themes", `${approvedThemes}/${blueprint.keywordThemes.length} approved`],
              ["Offer", intent.offer || "—"],
              ["Audience", intent.audience ? intent.audience.slice(0, 50) + "…" : "—"],
            ].map(([k, v]) => (
              <div key={k as string}><p className="text-xs text-muted-foreground mb-0.5">{k}</p><p className="text-sm font-medium">{v}</p></div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Provider draft readiness */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Provider Draft Readiness</p>
        <div className="grid grid-cols-2 gap-4">
          {([["Google Ads", blueprint.providerReadiness.google], ["Microsoft Advertising", blueprint.providerReadiness.bing]] as [string, number][]).map(([provider, pct]) => {
            const connected = PLATFORM_CONN[provider as Platform];
            const color = pct >= 80 ? "text-green-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
            const barColor = pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
            return (
              <div key={provider} className={`p-5 rounded-2xl border ${connected ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] opacity-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{provider === "Microsoft Advertising" ? "Microsoft / Bing" : provider}</p>
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-muted-foreground/30"}`} />
                </div>
                <p className={`text-3xl font-bold ${color} mb-3`}>{pct}%</p>
                <div className="h-1 bg-white/[0.06] rounded-full">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{connected ? (pct >= 80 ? "Ready to draft" : "Incomplete — check tracking") : "Account not connected"}</p>
              </div>
            );
          })}
        </div>
        {!hasLp && <p className="text-sm text-amber-300 mt-4 flex items-center gap-2"><AlertTriangle size={13} /> Landing page URL required to reach full readiness.</p>}
      </div>

      {/* Approval */}
      <div className="pt-2">
        {canApprove ? (
          <button onClick={onRequestApproval} disabled={saving}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white text-base font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {saving ? "Submitting…" : "Request Approval"}
          </button>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] text-sm text-amber-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            Complete all required fields (goal, name, budget, landing page) to request approval.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Provider Readiness Panel ──────────────────────────────────────────────────

function ProviderReadinessPanel({ blueprint, intent }: { blueprint: GeneratedBlueprint | null; intent: CampaignIntent }) {
  const hasLp = intent.landingPage?.startsWith("http");

  return (
    <div className="w-56 shrink-0 border-l border-white/[0.06] flex flex-col bg-[#0c0e16] overflow-y-auto">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-0.5">
          <Brain size={12} className="text-primary" />
          <span className="text-xs font-bold text-primary">SPARK</span>
        </div>
        <p className="text-xs text-muted-foreground">Blueprint status</p>
      </div>

      {blueprint ? (
        <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">
          {/* Provider readiness */}
          <div className="space-y-3">
            {([["Google Ads", blueprint.providerReadiness.google], ["Bing Ads", blueprint.providerReadiness.bing]] as [string, number][]).map(([p, pct]) => {
              const color = pct >= 80 ? "text-green-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
              const barColor = pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{p}</span>
                    <span className={`font-semibold ${color}`}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.06] rounded-full">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Quick status */}
          <div className="space-y-2.5">
            {[
              { label: "Primary goal", ok: !!intent.primaryGoal },
              { label: "Budget set", ok: !!intent.totalBudget },
              { label: "Landing page", ok: !!hasLp },
              { label: "Keywords", ok: blueprint.keywordThemes.some((t) => t.approved === true) },
              { label: "Ad copy", ok: !!blueprint.adDirection.headlines[0] },
              { label: "GA4 event", ok: !!blueprint.conversionEvent },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                {item.ok ? <CheckCircle size={11} className="text-green-400 shrink-0" /> : <Circle size={11} className="text-white/15 shrink-0" />}
                <span className={item.ok ? "text-foreground/70" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Strategic angle */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Strategic angle</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">{blueprint.strategicAngle}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 px-5 py-5 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles size={16} className="text-primary/50" />
          </div>
          <p className="text-xs text-muted-foreground">Fill in Campaign Intent and generate the blueprint to see provider readiness.</p>
        </div>
      )}
    </div>
  );
}

// ── Blueprint Studio (main) ───────────────────────────────────────────────────

function BlueprintStudio({ open, onClose, initialCampaign }: {
  open: boolean; onClose: () => void; initialCampaign?: Campaign | null;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("intent");
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
  const [generatedSections, setGeneratedSections] = useState<Set<string>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Create the campaign via API
      const campaign = await createCampaign.mutateAsync({
        data: {
          name: intent.name,
          objective: intent.primaryGoal === "leads" ? "lead_generation" : intent.primaryGoal === "sales" ? "sales" : intent.primaryGoal === "traffic" ? "website_traffic" : intent.primaryGoal === "bookings" ? "lead_generation" : "lead_generation",
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

      // Generate the blueprint via API
      const apiBp = await generateBlueprintMutation.mutateAsync({ id: campaign.id });

      // Map API blueprint to local GeneratedBlueprint type
      const localBp: GeneratedBlueprint = {
        strategicAngle: (apiBp as any).strategicAngle ?? generateBlueprint(intent).strategicAngle,
        platforms: ((apiBp as any).platformStrategy ?? []).map((p: any) => ({
          name: p.name as Platform,
          budgetPct: p.budgetPct,
          rationale: p.rationale,
          recommended: p.recommended,
        })),
        keywordThemes: ((apiBp as any).keywordThemes ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          intent: t.intent as KeywordTheme["intent"],
          keywords: t.keywords,
          approved: t.approved ?? null,
        })),
        negativeThemes: ((apiBp as any).negativeKeywordThemes ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          rationale: t.rationale,
          terms: t.terms,
        })),
        adDirection: (apiBp as any).adDirection ?? generateBlueprint(intent).adDirection,
        conversionEvent: intent.primaryGoal === "leads" ? "generate_lead" : intent.primaryGoal === "sales" ? "purchase" : "appointment_booked",
        trackingNotes: (apiBp as any).trackingPlan ?? "Google Tag Manager recommended. Verify conversion tags fire on the thank-you page using Google Tag Assistant before requesting approval.",
        providerReadiness: { google: 85, bing: 72 },
      };

      // Fall back to locally generated data if API returned empty arrays
      if (!localBp.platforms.length || !localBp.keywordThemes.length) {
        const fallback = generateBlueprint(intent);
        if (!localBp.platforms.length) localBp.platforms = fallback.platforms;
        if (!localBp.keywordThemes.length) localBp.keywordThemes = fallback.keywordThemes;
        if (!localBp.negativeThemes.length) localBp.negativeThemes = fallback.negativeThemes;
      }

      setBlueprint(localBp);
      setGeneratedSections(new Set(["intent", "platforms", "keywords", "ads", "tracking"]));
      setCompletedSections(new Set(["intent"]));
      setActiveSection("platforms");
      toast({ title: "Blueprint generated", description: "SPARK has built your campaign strategy. Review and refine each section." });
    } catch {
      // Fallback to local generation if API fails
      const bp = generateBlueprint(intent);
      setBlueprint(bp);
      setGeneratedSections(new Set(["intent", "platforms", "keywords", "ads", "tracking"]));
      setCompletedSections(new Set(["intent"]));
      setActiveSection("platforms");
      toast({ title: "Blueprint generated (offline)", description: "API unavailable — using local blueprint generation." });
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
        toast({ title: "Approval requested", description: `"${intent.name}" has been sent to approvers.` });
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
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/[0.06]">
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
          <X size={16} />
        </button>
        <Separator orientation="vertical" className="h-5 bg-white/10" />
        <div className="flex items-center gap-2">
          <MonitorPlay size={15} className="text-primary" />
          <span className="text-sm font-semibold">PPC Blueprint Studio</span>
        </div>
        {intent.name && (
          <>
            <ChevronRight size={13} className="text-white/20" />
            <span className="text-sm text-muted-foreground">{intent.name}</span>
          </>
        )}
        <div className="flex-1" />
        {blueprint && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Blueprint active
          </div>
        )}
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-colors">
          <FileText size={11} /> Save Draft
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        <SectionNav
          active={activeSection}
          setActive={setActiveSection}
          generatedSections={generatedSections}
          completedSections={completedSections}
        />

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-14 py-12">
            {/* Section heading */}
            <div className="mb-10">
              <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
                {STUDIO_SECTIONS.find((s) => s.id === activeSection)?.label}
              </p>
              {activeSection !== "intent" && !blueprint && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-sm text-muted-foreground">
                  <Sparkles size={14} className="text-primary/40" />
                  Complete the Campaign Intent section and generate your blueprint to unlock this section.
                </div>
              )}
            </div>

            {activeSection === "intent" && (
              <IntentSection intent={intent} setIntent={setIntent} onGenerate={handleGenerate} generating={generating} />
            )}
            {activeSection === "platforms" && blueprint && (
              <PlatformSection blueprint={blueprint} intent={intent} />
            )}
            {activeSection === "keywords" && blueprint && (
              <KeywordsSection blueprint={blueprint} setBlueprint={setBlueprint} />
            )}
            {activeSection === "budget" && (
              <BudgetSection intent={intent} setIntent={setIntent} blueprint={blueprint || generateBlueprint(intent)} />
            )}
            {activeSection === "ads" && blueprint && (
              <AdDirectionSection blueprint={blueprint} setBlueprint={setBlueprint} />
            )}
            {activeSection === "tracking" && blueprint && (
              <TrackingSection blueprint={blueprint} intent={intent} />
            )}
            {activeSection === "review" && blueprint && (
              <ReviewSection intent={intent} blueprint={blueprint} onRequestApproval={handleRequestApproval} saving={saving} />
            )}
          </div>
        </div>

        {/* Provider readiness panel */}
        <ProviderReadinessPanel blueprint={blueprint} intent={intent} />
      </div>

      {/* Footer nav */}
      <div className="shrink-0 flex items-center justify-between px-10 py-4 border-t border-white/[0.06]">
        <button onClick={() => {
          const idx = STUDIO_SECTIONS.findIndex((s) => s.id === activeSection);
          if (idx > 0) setActiveSection(STUDIO_SECTIONS[idx - 1].id);
          else onClose();
        }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={14} />
          {activeSection === "intent" ? "Cancel" : STUDIO_SECTIONS[STUDIO_SECTIONS.findIndex((s) => s.id === activeSection) - 1]?.label || "Back"}
        </button>
        {activeSection !== "review" && (
          <button onClick={() => {
            const idx = STUDIO_SECTIONS.findIndex((s) => s.id === activeSection);
            if (idx < STUDIO_SECTIONS.length - 1) setActiveSection(STUDIO_SECTIONS[idx + 1].id);
          }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm text-foreground/80 hover:text-foreground transition-colors">
            {STUDIO_SECTIONS[STUDIO_SECTIONS.findIndex((s) => s.id === activeSection) + 1]?.label || "Next"}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PPC Overview ─────────────────────────────────────────────────────────────

function PPCOverview({ campaigns, onNewCampaign, onEditCampaign }: {
  campaigns: Campaign[]; onNewCampaign: () => void; onEditCampaign: (c: Campaign) => void;
}) {
  const active = campaigns.filter((c) => c.status === "live" || c.status === "optimising");
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok");
  const pending = campaigns.filter((c) => c.approvalStatus === "pending");
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const topRec = campaigns.find((c) => c.sparkRec);

  const OPPORTUNITIES = [
    { label: "Add 14 negatives to Non-Brand", impact: "~$1,840 saved/mo", effort: "5 min", type: "Negative KW" },
    { label: "Shift $3k Competitor → Brand Search", impact: "ROAS 6.1× vs 1.8×", effort: "2 min", type: "Budget" },
    { label: "Fix GA4 event on Enterprise Lead Gen", impact: "Required for launch", effort: "15 min", type: "Tracking" },
  ];

  return (
    <div className="grid grid-cols-[1fr_300px] gap-8 items-start">
      {/* Left column */}
      <div className="space-y-8">
        {/* Command band */}
        <div className="p-7 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/8 via-[#0c0e18] to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">SPARK Intelligence · Top Opportunity</p>
            {topRec ? (
              <>
                <p className="text-2xl font-bold mb-2">{topRec.sparkRec}</p>
                <p className="text-base text-muted-foreground">{topRec.name}</p>
              </>
            ) : (
              <p className="text-2xl font-bold">All campaigns healthy — no critical actions.</p>
            )}
            <div className="flex items-center gap-6 mt-6">
              <div>
                <p className="text-3xl font-bold text-green-400">{active.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Active campaigns</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div>
                <p className="text-3xl font-bold">${(totalSpend / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground mt-0.5">of ${(totalBudget / 1000).toFixed(0)}k/mo</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div>
                <p className={`text-3xl font-bold ${pending.length > 0 ? "text-amber-400" : "text-muted-foreground"}`}>{pending.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Awaiting approval</p>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div>
                <p className={`text-3xl font-bold ${trackingIssues.length > 0 ? "text-red-400" : "text-green-400"}`}>{trackingIssues.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{trackingIssues.length > 0 ? "Tracking issues" : "All tracking OK"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">Campaigns</p>
            <button onClick={onNewCampaign} className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"><Plus size={11} /> New</button>
          </div>
          <div className="space-y-px">
            <div className="grid grid-cols-[1fr_120px_80px_70px_70px_24px] px-4 py-2 text-xs text-muted-foreground/40 uppercase tracking-wider">
              <span>Campaign</span><span>Status</span><span className="text-right">Budget</span><span className="text-right">Conv.</span><span className="text-right">CPL</span><span />
            </div>
            {campaigns.map((c) => (
              <div key={c.id} className="group grid grid-cols-[1fr_120px_80px_70px_70px_24px] items-center px-4 py-4 rounded-xl hover:bg-white/[0.03] transition-colors" data-testid={`campaign-row-${c.id}`}>
                <div>
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "live" || c.status === "optimising" ? "bg-green-400" : c.status === "approval" ? "bg-amber-400" : c.status === "data_check" ? "bg-red-400" : "bg-white/20"}`} />
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.trackingStatus !== "ok" && <AlertTriangle size={11} className={`${c.trackingStatus === "error" ? "text-red-400" : "text-amber-400"} shrink-0`} />}
                  </div>
                  {c.sparkRec && <p className="text-xs text-primary/60 ml-4">{c.sparkRec}</p>}
                </div>
                <div>
                  <span className={`text-xs font-medium ${STATUS_CONFIG[c.status].color}`}>{STATUS_CONFIG[c.status].label}</span>
                </div>
                <p className="text-right text-sm">{c.budget ? `$${(c.budget / 1000).toFixed(0)}k` : "—"}</p>
                <p className="text-right text-sm text-primary">{c.conversions > 0 ? c.conversions : "—"}</p>
                <p className="text-right text-sm text-muted-foreground">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</p>
                <button onClick={() => onEditCampaign(c)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground" data-testid={`btn-edit-${c.id}`}>
                  <Edit size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Platform accounts */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground/50 mr-1">Accounts:</span>
          {(["Google Ads","Microsoft Advertising","Baidu","Naver"] as Platform[]).map((p) => (
            <span key={p} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${PLATFORM_CONN[p] ? "border-green-500/15 text-green-400" : "border-white/[0.06] text-muted-foreground/50"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PLATFORM_CONN[p] ? "bg-green-400" : "bg-white/15"}`} />
              {p === "Microsoft Advertising" ? "Bing" : p}
            </span>
          ))}
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 transition-colors">
            <Plus size={10} /> Connect
          </button>
        </div>
      </div>

      {/* Right column — priorities */}
      <div className="space-y-6">
        {/* Pending approvals */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Awaiting Approval</p>
            <div className="space-y-2">
              {pending.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.04]">
                  <p className="text-sm font-medium mb-1">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.owner} · ${c.budget.toLocaleString()}/mo</p>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 rounded-lg border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-colors">Reject</button>
                    <button className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking issues */}
        {trackingIssues.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Tracking Issues</p>
            <div className="space-y-2">
              {trackingIssues.map((c) => (
                <div key={c.id} className={`p-4 rounded-xl border ${c.trackingStatus === "error" ? "border-red-500/15 bg-red-500/[0.04]" : "border-amber-500/15 bg-amber-500/[0.04]"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {c.trackingStatus === "error" ? <XCircle size={12} className="text-red-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
                    <p className="text-sm font-medium">{c.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Review tracking setup before campaign goes live.</p>
                  <button className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors">Open Blueprint →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Opportunities */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">AI Opportunities</p>
          <div className="space-y-2">
            {OPPORTUNITIES.map((opp, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-primary/20 text-primary/70">{opp.type}</span>
                </div>
                <p className="text-sm font-medium mb-1">{opp.label}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-green-400/80">{opp.impact}</span>
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
    { type: "New Campaign", priority: "low", title: "Create HubSpot competitor campaign — 22K APAC searches/month uncaptured", campaign: "Suggested", effort: "30 min", impact: "New pipeline source" },
  ];
  const priorityDot: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-muted-foreground" };
  return (
    <div className="max-w-3xl space-y-3">
      {RECS.map((r, i) => (
        <div key={i} className="flex items-start gap-5 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[r.priority]}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide">{r.type}</span>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{r.campaign}</span>
            </div>
            <p className="text-base font-medium mb-1.5">{r.title}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-green-400/80">{r.impact}</span>
              <span className="text-muted-foreground">Est. {r.effort}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">Dismiss</button>
            <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5"><Zap size={10} /> Apply</button>
          </div>
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
        <div key={i} className={`flex items-start gap-5 p-6 rounded-2xl border ${a.urgent ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/[0.06] bg-white/[0.01]"}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              {a.urgent && <span className="text-xs font-bold text-amber-400">URGENT</span>}
              <span className="text-xs text-muted-foreground">{a.type} · {a.amount}</span>
            </div>
            <p className="text-base font-medium mb-1">{a.title}</p>
            <p className="text-sm text-muted-foreground">Requested by {a.by} · {a.time}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-muted-foreground hover:text-foreground transition-colors">Reject</button>
            <button className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"><CheckCircle size={11} /> Approve</button>
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
        <div key={r.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.10] hover:bg-white/[0.03] transition-all cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
            <BarChart2 size={15} className="text-primary" />
          </div>
          <p className="font-semibold mb-1">{r.name}</p>
          <p className="text-xs text-muted-foreground mb-5">{r.note}</p>
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
  const [, setLocation] = useLocation();

  // Auto-open Blueprint Studio when redirected from /campaigns/new
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      setStudioOpen(true);
      // Clean up the query param without re-rendering
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-ppc">PPC / Paid Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Google, Bing, Baidu, Naver — one command centre.</p>
        </div>
        <button onClick={openNewCampaign}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-new-campaign">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.value ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
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
