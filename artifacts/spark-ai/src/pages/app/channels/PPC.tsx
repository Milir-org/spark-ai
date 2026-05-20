import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  MonitorPlay, Plus, CheckCircle, XCircle, AlertCircle, AlertTriangle,
  Loader2, ChevronRight, ChevronLeft, Search, Target, DollarSign,
  BarChart2, Zap, Shield, Globe, FileText, Settings, MoreHorizontal,
  Edit, Eye, Brain, Lightbulb, Sparkles, TrendingUp, ChevronDown,
  Download, Filter, Users, Rocket, Tag, Link2, ThumbsUp, ThumbsDown,
  RefreshCw, Wand2, Hash, ArrowRight, Circle, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "data_check" | "approval" | "live" | "optimising" | "paused";
type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver" | "Yahoo Japan";
type PrimaryGoal = "leads" | "sales" | "bookings" | "traffic" | "brand_protection" | "competitor_conquest";
type WizardMode = "create" | "edit";

interface Campaign {
  id: number;
  name: string;
  platforms: Platform[];
  goal: PrimaryGoal;
  status: CampaignStatus;
  budget: number;
  spend: number;
  avgCpc: number;
  conversions: number;
  cpl: number;
  trackingStatus: "ok" | "warning" | "error";
  approvalStatus: "approved" | "pending" | "not_required" | "rejected";
  owner: string;
  sparkRec?: string;
}

interface SuggestedKeyword {
  id: number;
  term: string;
  group: "Brand" | "High Intent" | "Product" | "Local" | "Competitor" | "Informational";
  matchType: "Exact" | "Phrase" | "Broad";
  cpcRange: string;
  competition: "Low" | "Medium" | "High";
  accepted: boolean | null;
}

interface CampaignForm {
  name: string;
  // Step 1: Goal
  primaryGoal: string;
  urgency: string;
  maxCpl: string;
  maxDaily: string;
  // Step 2: Audience
  product: string;
  offer: string;
  geography: string;
  audience: string;
  landingPage: string;
  // Step 3: Keywords & Budget
  platforms: Platform[];
  totalBudget: string;
  budgetStyle: string;
  searchIntent: string;
  brandKeywords: string;
  serviceKeywords: string;
  negativeKeywords: string;
  acceptedKeywords: SuggestedKeyword[];
  // Step 4: Ads & Tracking
  headline1: string; headline2: string; headline3: string;
  desc1: string; desc2: string;
  ga4Event: string;
  // Meta
  owner: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; desc: string }[] = [
  { value: "leads", label: "Generate Leads", desc: "Capture contact details from interested prospects" },
  { value: "sales", label: "Drive Sales", desc: "Direct product or subscription purchase" },
  { value: "bookings", label: "Book Appointments", desc: "Demo, call, or in-person booking" },
  { value: "traffic", label: "Website Traffic", desc: "Awareness and engagement over conversion volume" },
  { value: "brand_protection", label: "Brand Protection", desc: "Own your branded search terms" },
  { value: "competitor_conquest", label: "Competitor Conquest", desc: "Appear when users search for competitors" },
];

const GOAL_LABELS: Record<string, string> = Object.fromEntries(GOAL_OPTIONS.map((g) => [g.value, g.label]));

const PLATFORM_COLORS: Record<Platform, string> = {
  "Google Ads": "border-blue-500/40 text-blue-300",
  "Microsoft Advertising": "border-cyan-500/40 text-cyan-300",
  "Baidu": "border-red-500/40 text-red-300",
  "Naver": "border-green-500/40 text-green-300",
  "Yahoo Japan": "border-purple-500/40 text-purple-300",
};

const PLATFORM_STATUS: Record<Platform, "connected" | "disconnected" | "coming_soon"> = {
  "Google Ads": "connected", "Microsoft Advertising": "connected",
  "Baidu": "disconnected", "Naver": "disconnected", "Yahoo Japan": "coming_soon",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-muted/40 text-muted-foreground",
  data_check: "bg-amber-500/10 text-amber-300",
  approval: "bg-orange-500/10 text-orange-300",
  live: "bg-green-500/10 text-green-300",
  optimising: "bg-emerald-500/10 text-emerald-300",
  paused: "bg-muted/40 text-muted-foreground",
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft", data_check: "Data Check", approval: "Awaiting Approval",
  live: "Live", optimising: "Optimising", paused: "Paused",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Brand Search — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "live", budget: 15000, spend: 12400, avgCpc: 1.82, conversions: 312, cpl: 39.74, trackingStatus: "ok", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Raise bids on top 3 brand terms — ROAS 6.1×" },
  { id: 2, name: "Non-Brand — Singapore SMEs", platforms: ["Google Ads"], goal: "leads", status: "optimising", budget: 22000, spend: 18900, avgCpc: 3.91, conversions: 247, cpl: 76.52, trackingStatus: "ok", approvalStatus: "approved", owner: "Sarah Park", sparkRec: "Add 14 negatives → cut ~$1,840 wasted spend" },
  { id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"], goal: "competitor_conquest", status: "live", budget: 9000, spend: 8200, avgCpc: 5.12, conversions: 58, cpl: 141.38, trackingStatus: "warning", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Pause low-converting ad group — CPA 2× target" },
  { id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "approval", budget: 18000, spend: 0, avgCpc: 0, conversions: 0, cpl: 0, trackingStatus: "warning", approvalStatus: "pending", owner: "Sarah Park" },
  { id: 5, name: "Baidu China Expansion", platforms: ["Baidu"], goal: "brand_protection", status: "data_check", budget: 12000, spend: 0, avgCpc: 0, conversions: 0, cpl: 0, trackingStatus: "error", approvalStatus: "not_required", owner: "Priya Sharma" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialForm(mode: WizardMode, campaign?: Campaign | null): CampaignForm {
  if (mode === "create" || !campaign) {
    return {
      name: "", primaryGoal: "", urgency: "normal", maxCpl: "", maxDaily: "",
      product: "", offer: "", geography: "", audience: "", landingPage: "",
      platforms: ["Google Ads", "Microsoft Advertising"], totalBudget: "", budgetStyle: "balanced",
      searchIntent: "", brandKeywords: "", serviceKeywords: "", negativeKeywords: "", acceptedKeywords: [],
      headline1: "", headline2: "", headline3: "", desc1: "", desc2: "", ga4Event: "generate_lead",
      owner: "Alex Chen",
    };
  }
  return {
    name: campaign.name, primaryGoal: campaign.goal, urgency: "normal", maxCpl: "", maxDaily: "",
    product: "SPARK AI — AI-powered marketing platform for B2B SaaS teams",
    offer: "Free 14-day trial", geography: "Singapore, Malaysia, Australia",
    audience: "Marketing managers at B2B SaaS companies", landingPage: "https://sparkapp.io/lp/trial",
    platforms: campaign.platforms, totalBudget: campaign.budget.toString(), budgetStyle: "balanced",
    searchIntent: "Marketing software teams use to run campaigns without an agency",
    brandKeywords: "spark ai, spark ai platform", serviceKeywords: "marketing automation software",
    negativeKeywords: "free, tutorial, jobs, reddit", acceptedKeywords: [],
    headline1: "SPARK AI — Marketing Suite", headline2: "AI-Powered Campaign Manager", headline3: "Free 14-Day Trial",
    desc1: "Plan, launch, optimise with AI. No expertise required.", desc2: "Connect all channels from one command centre.",
    ga4Event: "generate_lead", owner: campaign.owner,
  };
}

function generateMockKeywords(form: CampaignForm): SuggestedKeyword[] {
  const prod = form.product?.split(" ")[0]?.toLowerCase() || "marketing";
  let id = 1;
  return [
    { id: id++, term: `${prod} software`, group: "Product", matchType: "Exact", cpcRange: "$3.50–$6.00", competition: "High", accepted: null },
    { id: id++, term: "ai marketing platform", group: "Product", matchType: "Exact", cpcRange: "$4.00–$7.50", competition: "High", accepted: null },
    { id: id++, term: "marketing automation software", group: "High Intent", matchType: "Exact", cpcRange: "$3.80–$6.20", competition: "High", accepted: null },
    { id: id++, term: `best ${prod} tool`, group: "High Intent", matchType: "Phrase", cpcRange: "$2.80–$5.00", competition: "Medium", accepted: null },
    { id: id++, term: "spark ai", group: "Brand", matchType: "Exact", cpcRange: "$0.80–$1.50", competition: "Low", accepted: null },
    { id: id++, term: "spark ai marketing", group: "Brand", matchType: "Phrase", cpcRange: "$0.90–$1.80", competition: "Low", accepted: null },
    { id: id++, term: "hubspot alternative", group: "Competitor", matchType: "Exact", cpcRange: "$5.50–$9.00", competition: "High", accepted: null },
    { id: id++, term: form.geography ? `marketing software ${form.geography.split(",")[0].trim().toLowerCase()}` : "marketing software singapore", group: "Local", matchType: "Phrase", cpcRange: "$2.00–$3.80", competition: "Medium", accepted: null },
    { id: id++, term: "what is marketing automation", group: "Informational", matchType: "Broad", cpcRange: "$0.80–$1.50", competition: "Low", accepted: null },
  ];
}

const NEGATIVE_SUGGESTIONS = ["free", "open source", "jobs", "salary", "template", "tutorial", "course", "reddit", "youtube", "how to", "certification", "cheap"];

const GROUP_COLORS: Record<string, string> = {
  Brand: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  "High Intent": "text-green-300 border-green-500/30 bg-green-500/10",
  Product: "text-primary border-primary/30 bg-primary/10",
  Local: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  Competitor: "text-red-300 border-red-500/30 bg-red-500/10",
  Informational: "text-muted-foreground border-border bg-muted/20",
};

const COMPETITION_COLOR: Record<string, string> = { Low: "text-green-400", Medium: "text-amber-400", High: "text-red-400" };

// ─── Readiness logic ──────────────────────────────────────────────────────────

interface ReadinessItem { label: string; done: boolean; critical: boolean }

function getReadiness(form: CampaignForm): ReadinessItem[] {
  return [
    { label: "Primary goal selected", done: !!form.primaryGoal, critical: true },
    { label: "Product or service described", done: form.product.length > 15, critical: true },
    { label: "Landing page URL entered", done: !!form.landingPage && form.landingPage.startsWith("http"), critical: true },
    { label: "At least one platform selected", done: form.platforms.length > 0, critical: true },
    { label: "Budget entered", done: Number(form.totalBudget) > 0, critical: true },
    { label: "Keywords added", done: !!(form.brandKeywords || form.serviceKeywords || form.searchIntent), critical: false },
    { label: "GA4 conversion event set", done: !!form.ga4Event, critical: false },
    { label: "Negative keywords added", done: !!form.negativeKeywords, critical: false },
    { label: "Ad headlines written", done: !!(form.headline1 && form.headline2), critical: false },
  ];
}

function readinessScore(form: CampaignForm): number {
  const items = getReadiness(form);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

function canRequestApproval(form: CampaignForm): boolean {
  return getReadiness(form).filter((i) => i.critical).every((i) => i.done);
}

// ─── SPARK Brain ──────────────────────────────────────────────────────────────

interface BrainAction { label: string; onClick: () => void }

function BrainPanel({ step, form, actions }: { step: number; form: CampaignForm; actions: BrainAction[] }) {
  const content: { summary?: string; bullets: string[]; warning?: string; tip?: string } = (() => {
    switch (step) {
      case 0: return {
        summary: form.primaryGoal ? `Goal: ${GOAL_LABELS[form.primaryGoal]}` : undefined,
        bullets: [
          form.primaryGoal ? `SPARK will optimise bids and measurement for ${GOAL_LABELS[form.primaryGoal]}.` : "Choose a goal to unlock the rest of the campaign.",
          "Guardrails prevent overspending and protect your CPL target.",
        ],
        tip: "Not sure? 'Generate Leads' is the most common goal for B2B paid search.",
      };
      case 1: return {
        summary: form.product ? `Promoting: ${form.product.slice(0, 50)}` : undefined,
        bullets: [
          form.product ? "Product description unlocks AI keyword and ad copy suggestions." : "Add a product description to unlock AI suggestions.",
          form.landingPage ? `Landing page set.` : "A landing page URL is required before launch.",
          form.geography ? `Geography: ${form.geography}` : "Add a geography to improve keyword targeting.",
        ],
        warning: !form.product ? "A vague or missing product description produces weaker suggestions." : undefined,
        tip: "The more specific your offer, the better SPARK's keyword and copy suggestions.",
      };
      case 2: return {
        summary: form.totalBudget ? `$${Number(form.totalBudget).toLocaleString()}/mo across ${form.platforms.length} platform(s)` : undefined,
        bullets: [
          "Google Ads: Largest volume. Start here.",
          "Microsoft Advertising: ~15–20% lower CPCs. Good for incremental reach.",
          !form.negativeKeywords ? "⚠ No negative keywords — the #1 cause of wasted search spend." : `${form.negativeKeywords.split(",").filter(Boolean).length} negatives added.`,
        ],
        warning: !form.negativeKeywords ? "Negative keywords are critical before launch." : undefined,
        tip: "Think about what your customers would NOT search for.",
      };
      case 3: return {
        summary: form.headline1 ? `"${form.headline1}"` : undefined,
        bullets: [
          "Headlines must be under 30 characters. Lead with your strongest benefit.",
          form.ga4Event ? `GA4 event: ${form.ga4Event}` : "⚠ Set a GA4 conversion event — required for Smart Bidding.",
        ],
        tip: "Write for your customer, not for the algorithm.",
      };
      case 4: return {
        summary: `Launch readiness: ${readinessScore(form)}%`,
        bullets: [
          "Review all sections before requesting approval.",
          canRequestApproval(form) ? "All critical fields are complete — you can request approval." : "Complete the missing critical fields before requesting approval.",
        ],
        warning: !canRequestApproval(form) ? "Campaign is not yet ready for approval." : undefined,
        tip: "Save Draft to keep working. Request Approval when every critical item is done.",
      };
      default: return { bullets: [] };
    }
  })();

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center gap-2 pb-3 border-b border-border/40">
        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
          <Brain size={12} className="text-primary" />
        </div>
        <span className="text-xs font-bold text-primary">SPARK Brain</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {content.summary && (
          <p className="text-xs px-2.5 py-2 rounded-lg bg-primary/10 text-primary font-medium">{content.summary}</p>
        )}
        <ul className="space-y-2.5">
          {content.bullets.map((b, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <Sparkles size={9} className="text-primary mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {content.warning && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-300">
            <AlertTriangle size={10} className="shrink-0 mt-0.5" />{content.warning}
          </div>
        )}
        {actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">AI Actions</p>
            {actions.map((a, i) => (
              <button key={i} onClick={a.onClick}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs text-primary transition-colors">
                <span className="flex items-center gap-1.5"><Zap size={9} />{a.label}</span>
                <ArrowRight size={9} className="shrink-0" />
              </button>
            ))}
          </div>
        )}
        {content.tip && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30 text-xs text-muted-foreground">
            <Lightbulb size={10} className="shrink-0 mt-0.5 text-amber-400" />{content.tip}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Workspace Step 1: Goal ───────────────────────────────────────────────────

function GoalStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">What is the primary business outcome this campaign should drive?</p>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((g) => (
            <button key={g.value} onClick={() => setField("primaryGoal", g.value)}
              className={`text-left p-4 rounded-xl border transition-all ${form.primaryGoal === g.value ? "border-primary bg-primary/8 shadow-[0_0_0_1px] shadow-primary/20" : "border-border/50 hover:border-border/80"}`}>
              <p className={`font-semibold text-sm ${form.primaryGoal === g.value ? "text-primary" : ""}`}>{g.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Budget Urgency</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[["test","Test","Learn before spending"],["normal","Normal","Standard pacing"],["aggressive","Aggressive","Maximise daily spend"]].map(([v,l,d]) => (
            <button key={v} onClick={() => setField("urgency", v)}
              className={`p-3 rounded-xl border text-left transition-all ${form.urgency === v ? "border-primary bg-primary/8" : "border-border/50 hover:border-border/80"}`}>
              <p className={`font-semibold text-sm ${form.urgency === v ? "text-primary" : ""}`}>{l}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d}</p>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown size={12} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} /> Advanced guardrails
      </button>
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/40 bg-muted/5">
          <div><Label className="text-xs text-muted-foreground">Max CPL Target ($)</Label><Input placeholder="e.g. 120" type="number" className="mt-1.5 h-9" value={form.maxCpl} onChange={(e) => setField("maxCpl", e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Max Daily Spend ($)</Label><Input placeholder="e.g. 500" type="number" className="mt-1.5 h-9" value={form.maxDaily} onChange={(e) => setField("maxDaily", e.target.value)} /></div>
        </div>
      )}
    </div>
  );
}

// ─── Workspace Step 2: Audience & Landing Page ────────────────────────────────

function AudienceStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">What are you promoting?</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">SPARK uses this to generate keyword and ad copy suggestions. Be specific.</p>
        <Textarea placeholder="e.g. SPARK AI — an AI-powered marketing platform for B2B SaaS teams. Replaces agency work for marketing managers." value={form.product} onChange={(e) => setField("product", e.target.value)} className="h-20 text-sm resize-none mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Offer or CTA</Label>
          <Input placeholder="e.g. Free 14-day trial" className="mt-2 h-9" value={form.offer} onChange={(e) => setField("offer", e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-semibold">Target Geography</Label>
          <Input placeholder="e.g. Singapore, Malaysia, Australia" className="mt-2 h-9" value={form.geography} onChange={(e) => setField("geography", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Target Audience</Label>
        <Input placeholder="e.g. Marketing managers at B2B SaaS companies with 10–200 employees" className="mt-2 h-9" value={form.audience} onChange={(e) => setField("audience", e.target.value)} />
      </div>
      <div>
        <Label className="text-sm font-semibold">Landing Page URL <span className="text-red-400">*</span></Label>
        <Input placeholder="https://yoursite.com/campaign-page" className="mt-2 h-9 font-mono text-xs" value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} />
        {form.landingPage && !form.landingPage.startsWith("http") && (
          <p className="text-xs text-red-400 mt-1">URL must start with https://</p>
        )}
      </div>
    </div>
  );
}

// ─── Workspace Step 3: Keywords & Budget ─────────────────────────────────────

function KeywordsBudgetStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [loadingNeg, setLoadingNeg] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(form.acceptedKeywords.length > 0);
  const [suggestions, setSuggestions] = useState<SuggestedKeyword[]>(form.acceptedKeywords);

  const suggestKeywords = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    const kws = generateMockKeywords(form);
    setSuggestions(kws);
    setField("acceptedKeywords", kws);
    setShowSuggestions(true);
    setLoading(false);
  };

  const suggestNegatives = async () => {
    setLoadingNeg(true);
    await new Promise((r) => setTimeout(r, 700));
    const current = form.negativeKeywords ? form.negativeKeywords.split(",").map((s) => s.trim()) : [];
    const merged = [...new Set([...current, ...NEGATIVE_SUGGESTIONS.slice(0, 8)])].join(", ");
    setField("negativeKeywords", merged);
    setLoadingNeg(false);
  };

  const setKwAccepted = (id: number, accepted: boolean) => {
    const updated = suggestions.map((k) => k.id === id ? { ...k, accepted } : k);
    setSuggestions(updated);
    setField("acceptedKeywords", updated);
  };

  const acceptedCount = suggestions.filter((k) => k.accepted === true).length;

  const ALL_PLATFORMS: Platform[] = ["Google Ads", "Microsoft Advertising", "Baidu", "Naver", "Yahoo Japan"];
  const togglePlatform = (p: Platform) => {
    if (PLATFORM_STATUS[p] === "coming_soon") return;
    setField("platforms", form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p]);
  };
  const budget = Number(form.totalBudget || 0);

  return (
    <div className="space-y-6">
      {/* Platforms */}
      <div>
        <Label className="text-sm font-semibold">Platforms</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">SPARK creates a separate plan for each platform under one unified budget.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_PLATFORMS.map((p) => {
            const sel = form.platforms.includes(p);
            const cs = PLATFORM_STATUS[p] === "coming_soon";
            return (
              <button key={p} onClick={() => togglePlatform(p)} disabled={cs}
                className={`p-3 rounded-xl border text-left transition-all ${sel ? `${PLATFORM_COLORS[p]} bg-current/5` : "border-border/50 hover:border-border/80"} ${cs ? "opacity-40 cursor-not-allowed" : ""}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-semibold ${sel ? "" : "text-foreground/80"}`}>{p === "Microsoft Advertising" ? "Microsoft / Bing" : p}</span>
                  {sel && <CheckCircle size={13} className="text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{PLATFORM_STATUS[p] === "connected" ? "Connected" : cs ? "Coming soon" : "Not connected"}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Monthly Budget ($) <span className="text-red-400">*</span></Label>
          <Input type="number" placeholder="e.g. 15000" className="mt-2 h-9" value={form.totalBudget} onChange={(e) => setField("totalBudget", e.target.value)} />
          {budget > 0 && form.platforms.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">{budget > 0 ? `~$${Math.round(budget * 0.7).toLocaleString()} Google · ~$${Math.round(budget * 0.2).toLocaleString()} Bing` : ""}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-semibold">Pacing</Label>
          <Select value={form.budgetStyle} onValueChange={(v) => setField("budgetStyle", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* Keyword intent */}
      <div>
        <Label className="text-sm font-semibold">What would your customers search for?</Label>
        <Textarea placeholder="Describe it naturally — e.g. 'Marketing software that helps small teams run campaigns without needing a big agency. They might also search for HubSpot or Marketo alternatives.'" value={form.searchIntent} onChange={(e) => setField("searchIntent", e.target.value)} className="mt-2 h-16 text-sm resize-none" />
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={suggestKeywords} disabled={loading} data-testid="btn-suggest-keywords">
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
            Suggest Keywords with AI
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={suggestNegatives} disabled={loadingNeg}>
            {loadingNeg ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
            Suggest Negatives
          </Button>
        </div>
      </div>

      {/* AI keyword results */}
      {showSuggestions && suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">AI Keyword Suggestions</p>
            <span className="text-xs text-muted-foreground">{acceptedCount} accepted · {suggestions.length - acceptedCount} remaining</span>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {suggestions.map((kw) => (
              <div key={kw.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${kw.accepted === true ? "border-green-500/30 bg-green-500/5" : kw.accepted === false ? "border-border/20 bg-muted/5 opacity-40" : "border-border/40 bg-card/40"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs">{kw.term}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${GROUP_COLORS[kw.group]}`}>{kw.group}</span>
                    <span className="text-xs text-muted-foreground">{kw.matchType}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>CPC: <span className="text-foreground">{kw.cpcRange}</span></span>
                    <span className={COMPETITION_COLOR[kw.competition]}>{kw.competition} competition</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setKwAccepted(kw.id, true)} className={`w-7 h-7 rounded flex items-center justify-center ${kw.accepted === true ? "bg-green-500/20 text-green-300" : "hover:bg-green-500/10 text-muted-foreground hover:text-green-400"}`}><ThumbsUp size={12} /></button>
                  <button onClick={() => setKwAccepted(kw.id, false)} className={`w-7 h-7 rounded flex items-center justify-center ${kw.accepted === false ? "bg-red-500/15 text-red-400" : "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"}`}><ThumbsDown size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual keyword fields */}
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-sm font-semibold">Brand Keywords</Label><Textarea placeholder="spark ai, spark ai platform" value={form.brandKeywords} onChange={(e) => setField("brandKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none" /></div>
        <div><Label className="text-sm font-semibold">Service / Product Keywords</Label><Textarea placeholder="marketing automation software" value={form.serviceKeywords} onChange={(e) => setField("serviceKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none" /></div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold text-red-400">Negative Keywords <span className="text-muted-foreground font-normal text-xs ml-1">— prevents wasted spend</span></Label>
          <Textarea placeholder="free, tutorial, jobs, reddit, salary" value={form.negativeKeywords} onChange={(e) => setField("negativeKeywords", e.target.value)} className="mt-2 h-14 font-mono text-xs resize-none border-red-500/20" />
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Step 4: Ads & Tracking ────────────────────────────────────────

function AdsTrackingStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [generating, setGenerating] = useState(false);

  const generateCopy = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    setField("headline1", "SPARK AI — Marketing Suite");
    setField("headline2", form.offer ? form.offer.slice(0, 30) : "AI-Powered Campaign Manager");
    setField("headline3", "Free 14-Day Trial");
    setField("desc1", `${(form.product || "AI marketing platform").slice(0, 60)}. No expertise required.`);
    setField("desc2", `${form.offer || "Start free today"}. One platform for all your channels.`);
    setGenerating(false);
  };

  const trackingItems = [
    { label: "Landing page URL", done: !!form.landingPage && form.landingPage.startsWith("http") },
    { label: "GA4 conversion event", done: !!form.ga4Event },
    { label: "UTM template applied", done: !!form.landingPage },
    { label: "CRM lead source mapping", done: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label className="text-sm font-semibold">Ad Copy</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Generated from your goal, offer, and product description</p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={generateCopy} disabled={generating}>
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} {form.headline1 ? "Regenerate" : "Generate with AI"}
          </Button>
        </div>

        {/* Live preview */}
        {(form.headline1 || form.product) && (
          <div className="p-4 mb-4 rounded-xl border border-border/50 bg-card/40 space-y-1">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <p className="text-blue-400 text-sm font-medium">{form.headline1 || "Your Headline 1"} | {form.headline2 || "Headline 2"} | {form.headline3 || "Headline 3"}</p>
            <p className="text-green-400 font-mono text-xs">{form.landingPage || "yoursite.com"}</p>
            <p className="text-muted-foreground text-xs">{form.desc1 || "Description 1 will appear here."}</p>
            <p className="text-muted-foreground text-xs">{form.desc2 || "Description 2 will appear here."}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {(["headline1","headline2","headline3"] as const).map((k,i) => (
            <div key={k}><Label className="text-xs text-muted-foreground">H{i+1} <span className="font-normal">(max 30)</span></Label><Input maxLength={30} value={form[k]} onChange={(e) => setField(k, e.target.value)} className="mt-1 h-8 text-xs" placeholder={`Headline ${i+1}`} /></div>
          ))}
        </div>
        <div className="space-y-2">
          <Textarea maxLength={90} placeholder="Description 1 (max 90 chars)…" value={form.desc1} onChange={(e) => setField("desc1", e.target.value)} className="h-12 text-xs resize-none" />
          <Textarea maxLength={90} placeholder="Description 2 (max 90 chars)…" value={form.desc2} onChange={(e) => setField("desc2", e.target.value)} className="h-12 text-xs resize-none" />
        </div>
      </div>

      <Separator className="bg-border/30" />

      <div>
        <Label className="text-sm font-semibold">Conversion Tracking</Label>
        <div className="mt-3 space-y-2 mb-4">
          {trackingItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {item.done ? <CheckCircle size={14} className="text-green-400 shrink-0" /> : <Circle size={14} className="text-muted-foreground/40 shrink-0" />}
              <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
              {!item.done && i < 2 && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 ml-auto">Required</Badge>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">GA4 Conversion Event</Label><Input value={form.ga4Event} onChange={(e) => setField("ga4Event", e.target.value)} className="mt-1.5 h-9 font-mono text-xs" placeholder="generate_lead" /></div>
          <div><Label className="text-xs text-muted-foreground">Final URL</Label><Input value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} className="mt-1.5 h-9 font-mono text-xs" placeholder="https://…" /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Step 5: Review & Approval ─────────────────────────────────────

function ReviewStep({ form, mode }: { form: CampaignForm; mode: WizardMode }) {
  const items = getReadiness(form);
  const score = readinessScore(form);
  const canApprove = canRequestApproval(form);
  const accepted = form.acceptedKeywords.filter((k) => k.accepted === true);
  const budget = Number(form.totalBudget || 0);

  return (
    <div className="space-y-5">
      {/* Readiness score */}
      <div className="p-4 rounded-xl border border-border/50 bg-card/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Launch Readiness</p>
          <span className={`text-xl font-bold ${score >= 80 ? "text-green-400" : score >= 55 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
        </div>
        <Progress value={score} className="h-1.5 mb-3" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {item.done ? <CheckCircle size={12} className="text-green-400 shrink-0" /> : <XCircle size={12} className={`${item.critical ? "text-red-400" : "text-muted-foreground/50"} shrink-0`} />}
              <span className={item.done ? "" : item.critical ? "text-red-300" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {[
          ["Campaign", form.name || "—"],
          ["Primary Goal", form.primaryGoal ? GOAL_LABELS[form.primaryGoal] : "—"],
          ["Geography", form.geography || "—"],
          ["Monthly Budget", budget ? `$${budget.toLocaleString()}` : "—"],
          ["Platforms", form.platforms.join(", ") || "—"],
          ["Owner", form.owner],
        ].map(([k, v]) => (
          <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
        ))}
      </div>

      {/* Accepted keywords */}
      {accepted.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{accepted.length} accepted keyword{accepted.length !== 1 ? "s" : ""}</p>
          <div className="flex flex-wrap gap-1.5">
            {accepted.slice(0, 10).map((k) => (
              <span key={k.id} className={`text-xs px-2 py-0.5 rounded border ${GROUP_COLORS[k.group]}`}>{k.term}</span>
            ))}
            {accepted.length > 10 && <span className="text-xs text-muted-foreground">+{accepted.length - 10} more</span>}
          </div>
        </div>
      )}

      {/* Ad preview */}
      {form.headline1 && (
        <div className="p-3 rounded-xl border border-border/40 bg-card/40 text-xs space-y-0.5">
          <p className="text-blue-400 font-medium">{form.headline1} | {form.headline2} | {form.headline3}</p>
          <p className="text-green-400 font-mono">{form.landingPage || "yoursite.com"}</p>
          <p className="text-muted-foreground">{form.desc1}</p>
        </div>
      )}

      {!canApprove && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-300">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>Complete all critical fields before requesting approval. Check the readiness list above.</span>
        </div>
      )}
    </div>
  );
}

// ─── Campaign Workspace (modal) ───────────────────────────────────────────────

const STEPS = [
  { label: "Goal", short: "Goal" },
  { label: "Audience & Landing Page", short: "Audience" },
  { label: "Keywords & Budget", short: "Keywords" },
  { label: "Ads & Tracking", short: "Ads" },
  { label: "Review & Approval", short: "Review" },
];

interface WorkspaceProps { open: boolean; onClose: () => void; mode: WizardMode; campaign?: Campaign | null }

function CampaignWorkspace({ open, onClose, mode, campaign }: WorkspaceProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setFormState] = useState<CampaignForm>(() => getInitialForm(mode, campaign));

  useEffect(() => {
    if (open) {
      setFormState(getInitialForm(mode, campaign));
      setStep(0);
    }
  }, [open, mode, campaign]);

  const setField = useCallback((key: string, value: any) => setFormState((f) => ({ ...f, [key]: value })), []);

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast({ title: "Draft saved", description: `"${form.name || "Untitled Campaign"}" saved at step ${step + 1}.` });
  };

  const handleRequestApproval = async () => {
    if (!canRequestApproval(form)) {
      toast({ title: "Cannot request approval yet", description: "Complete all critical fields first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast({ title: "Approval requested", description: `"${form.name || "Untitled Campaign"}" sent to approvers.` });
    onClose();
  };

  const brainActions: Record<number, { label: string; onClick: () => void }[]> = {
    0: [
      { label: "Recommend goal for my business", onClick: () => { setField("primaryGoal", "leads"); toast({ title: "Goal recommended: Generate Leads" }); } },
      { label: "Apply sensible guardrails", onClick: () => { setField("maxCpl", "120"); setField("maxDaily", "500"); toast({ title: "Guardrails applied" }); } },
    ],
    1: [
      { label: "Improve product description", onClick: () => { if (!form.product) setField("product", "SPARK AI — AI-powered marketing platform for B2B SaaS teams. Replaces agency work."); toast({ title: "Description improved" }); } },
    ],
    2: [
      { label: "Recommend platform mix", onClick: () => { setField("platforms", ["Google Ads", "Microsoft Advertising"]); toast({ title: "Platform recommendation applied" }); } },
      { label: "Suggest budget split", onClick: () => { if (!form.totalBudget) setField("totalBudget", "15000"); toast({ title: "Budget suggestion applied: $15,000/mo" }); } },
    ],
    3: [
      { label: "Generate ad copy from brief", onClick: async () => { setField("headline1", "SPARK AI — Marketing Suite"); setField("headline2", form.offer?.slice(0,30) || "AI Campaign Manager"); setField("headline3", "Free 14-Day Trial"); setField("desc1", `${(form.product || "AI platform").slice(0, 60)}. No expertise required.`); setField("desc2", `${form.offer || "Start free today"}. One platform for all your channels.`); toast({ title: "Ad copy generated" }); } },
    ],
    4: [
      { label: "Check launch readiness", onClick: () => { const items = getReadiness(form).filter((i) => !i.done); toast({ title: items.length ? `${items.length} items still needed` : "Campaign is ready to launch!", description: items.map((i) => i.label).join(", ") || undefined }); } },
    ],
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <GoalStep form={form} setField={setField} />;
      case 1: return <AudienceStep form={form} setField={setField} />;
      case 2: return <KeywordsBudgetStep form={form} setField={setField} />;
      case 3: return <AdsTrackingStep form={form} setField={setField} />;
      case 4: return <ReviewStep form={form} mode={mode} />;
    }
  };

  const score = readinessScore(form);
  const canApprove = canRequestApproval(form);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-card/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <MonitorPlay size={13} className="text-primary" />
              </div>
              <Input
                placeholder="Campaign name…"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="h-8 text-sm font-semibold bg-transparent border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 max-w-xs"
                data-testid="input-campaign-name"
              />
              {mode === "edit" && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 shrink-0">Editing</Badge>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">Readiness: <span className={score >= 80 ? "text-green-400" : score >= 55 ? "text-amber-400" : "text-red-400"}>{score}%</span></span>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />} Save Draft
              </Button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-0.5">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <button onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${i === step ? "bg-primary text-primary-foreground font-semibold" : i < step ? "bg-muted/60 text-foreground hover:bg-muted" : "text-muted-foreground hover:text-foreground"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === step ? "bg-white/20" : i < step ? "bg-green-500/20 text-green-400" : "bg-muted/60"}`}>
                    {i < step ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`w-4 h-px mx-0.5 shrink-0 ${i < step ? "bg-green-500/40" : "bg-border/50"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-xl">
              <h2 className="text-base font-bold mb-1">{STEPS[step].label}</h2>
              <p className="text-xs text-muted-foreground mb-6">Step {step + 1} of {STEPS.length}</p>
              {renderStep()}
            </div>
          </div>
          {/* SPARK Brain sidebar */}
          <div className="w-60 shrink-0 border-l border-border/50 bg-card/30 p-5 overflow-y-auto hidden lg:flex flex-col">
            <BrainPanel step={step} form={form} actions={brainActions[step] ?? []} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 px-6 py-4 bg-card/60 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            <ChevronLeft size={14} />{step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" className="gap-1.5" onClick={() => setStep(step + 1)}>
              Continue <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5" onClick={handleRequestApproval} disabled={saving || !canApprove} title={!canApprove ? "Complete all critical fields first" : undefined}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Request Approval
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── PPC Overview ─────────────────────────────────────────────────────────────

function PPCOverview({ campaigns, onNewCampaign, onEditCampaign }: { campaigns: Campaign[]; onNewCampaign: () => void; onEditCampaign: (c: Campaign) => void }) {
  const [filter, setFilter] = useState("");
  const filtered = campaigns.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  const activeCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "optimising").length;
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok").length;
  const pendingApprovals = campaigns.filter((c) => c.approvalStatus === "pending").length;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(trackingIssues > 0 || pendingApprovals > 0) && (
        <div className="space-y-2">
          {pendingApprovals > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm">
              <AlertCircle size={15} className="text-amber-400 shrink-0" />
              <span className="text-amber-300"><span className="font-semibold">{pendingApprovals} campaign{pendingApprovals !== 1 ? "s" : ""}</span> awaiting approval</span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs text-amber-300 hover:text-amber-200">Review</Button>
            </div>
          )}
          {trackingIssues > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-sm">
              <XCircle size={15} className="text-red-400 shrink-0" />
              <span className="text-red-300"><span className="font-semibold">{trackingIssues} campaign{trackingIssues !== 1 ? "s" : ""}</span> with tracking issues</span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs text-red-300 hover:text-red-200">Fix Now</Button>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Campaigns", value: activeCampaigns, color: "text-primary", note: `of ${campaigns.length} total` },
          { label: "Monthly Spend", value: `$${(totalSpend / 1000).toFixed(1)}k`, color: "text-amber-400", note: `of $${(totalBudget / 1000).toFixed(0)}k budget` },
          { label: "Pending Approvals", value: pendingApprovals, color: pendingApprovals > 0 ? "text-amber-400" : "text-muted-foreground", note: "awaiting sign-off" },
          { label: "Tracking Issues", value: trackingIssues, color: trackingIssues > 0 ? "text-red-400" : "text-green-400", note: trackingIssues > 0 ? "need attention" : "all clear" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Search Campaigns</h2>
          <div className="flex items-center gap-2">
            <div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-7 h-8 w-44 text-xs" /></div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"><Download size={11} /> Export</Button>
          </div>
        </div>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-card/80">
                    {["Campaign", "Platforms", "Status", "Budget", "Spend", "Conv.", "CPL", "Tracking", "Approval", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const pct = c.budget ? Math.min(Math.round((c.spend / c.budget) * 100), 100) : 0;
                    return (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-muted/5 group" data-testid={`campaign-row-${c.id}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.owner}</p>
                          {c.sparkRec && <p className="text-xs text-primary mt-0.5 flex items-center gap-1"><Zap size={9} />{c.sparkRec}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.platforms.map((p) => <span key={p} className={`text-xs px-1.5 py-0.5 rounded border ${PLATFORM_COLORS[p]}`}>{p === "Microsoft Advertising" ? "Bing" : p.split(" ")[0]}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs border-0 ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</Badge></td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium">${c.budget.toLocaleString()}</p>
                          {c.spend > 0 && <div className="mt-1.5 h-1 w-14 bg-muted/40 rounded-full"><div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-right">{c.spend > 0 ? `$${c.spend.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-primary">{c.conversions > 0 ? c.conversions : "—"}</td>
                        <td className="px-4 py-3 text-xs text-right">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</td>
                        <td className="px-4 py-3">
                          {c.trackingStatus === "ok" ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} />OK</span> : c.trackingStatus === "warning" ? <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle size={11} />Warning</span> : <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={11} />Error</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${c.approvalStatus === "approved" ? "border-green-500/30 text-green-300" : c.approvalStatus === "pending" ? "border-amber-500/30 text-amber-300" : c.approvalStatus === "rejected" ? "border-red-500/30 text-red-300" : "border-border text-muted-foreground"}`}>
                            {c.approvalStatus === "not_required" ? "—" : c.approvalStatus.charAt(0).toUpperCase() + c.approvalStatus.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => onEditCampaign(c)} data-testid={`btn-edit-${c.id}`}><Edit size={12} /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View"><Eye size={12} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected accounts */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Connected Accounts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["Google Ads","Microsoft Advertising","Baidu","Naver"] as Platform[]).map((p) => {
            const connected = PLATFORM_STATUS[p] === "connected";
            return (
              <div key={p} className={`flex items-center gap-3 p-3 rounded-xl border ${connected ? "border-green-500/20 bg-green-500/5" : "border-border/50"}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-400" : "bg-muted-foreground/40"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p === "Microsoft Advertising" ? "Bing Ads" : p}</p>
                  <p className="text-xs text-muted-foreground">{connected ? "Connected" : "Not connected"}</p>
                </div>
                {!connected && <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground">Connect</Button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────

function RecommendationsTab() {
  const RECS = [
    { type: "Negative Keywords", priority: "high", title: "Add 14 negative keywords to cut ~$1,840 wasted spend", campaign: "Non-Brand — Singapore SMEs", effort: "5 min" },
    { type: "Budget", priority: "high", title: "Shift $3k from Competitor Conquest (1.8× ROAS) → Brand Search (6.1× ROAS)", campaign: "Global", effort: "2 min" },
    { type: "Tracking", priority: "high", title: "Fix missing GA4 conversion event on Enterprise Lead Gen before launch", campaign: "Enterprise Lead Gen", effort: "15 min" },
    { type: "Ad Copy", priority: "medium", title: "Generate new headlines for Competitor Conquest — CTR only 1.9%", campaign: "Competitor Conquest", effort: "10 min" },
    { type: "New Campaign", priority: "low", title: "Create HubSpot competitor campaign — 22K APAC searches/month", campaign: "Suggested", effort: "30 min" },
  ];
  return (
    <div className="space-y-3">
      {RECS.map((r, i) => (
        <Card key={i} className={`border-border/60 bg-card ${r.priority === "high" ? "border-red-500/20" : r.priority === "medium" ? "border-amber-500/20" : ""}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-0">{r.type}</Badge>
                <Badge variant="outline" className={`text-xs ${r.priority === "high" ? "border-red-500/30 text-red-300" : r.priority === "medium" ? "border-amber-500/30 text-amber-300" : "border-border text-muted-foreground"}`}>{r.priority}</Badge>
                <span className="text-xs text-muted-foreground">· {r.campaign}</span>
              </div>
              <p className="text-sm">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Est. effort: {r.effort}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs">Dismiss</Button>
              <Button size="sm" className="h-7 text-xs gap-1"><Zap size={11} /> Apply</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const APPROVALS = [
    { title: "Budget approval — Enterprise Lead Gen", type: "Budget", amount: "$18,000/mo", by: "Sarah Park", time: "2h ago", urgent: true },
    { title: "Keyword approval — Baidu China Expansion", type: "Keywords", amount: "142 keywords", by: "Priya Sharma", time: "4h ago", urgent: false },
    { title: "Ad copy approval — Competitor Conquest v2", type: "Ad Copy", amount: "6 ad variants", by: "David Lee", time: "Yesterday", urgent: false },
  ];
  return (
    <div className="space-y-3">
      {APPROVALS.map((a, i) => (
        <Card key={i} className={`border-border/60 bg-card ${a.urgent ? "border-amber-500/20" : ""}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{a.type}</Badge>{a.urgent && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Urgent</Badge>}</div>
              <p className="text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.amount} · requested by {a.by} · {a.time}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10">Reject</Button>
              <Button size="sm" className="h-7 text-xs gap-1"><CheckCircle size={11} /> Approve</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const REPORTS = ["Campaign Performance Summary", "Platform Comparison (Google vs Bing)", "Keyword Performance", "Budget Pacing Report", "Lead Quality & CRM Attribution", "AI Executive Summary"];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {REPORTS.map((r) => (
        <Card key={r} className="border-border/60 bg-card hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText size={14} className="text-primary" /></div>
            <p className="text-sm font-semibold">{r}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1 gap-1"><Eye size={11} /> View</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2"><Download size={11} /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main PPC Page ────────────────────────────────────────────────────────────

export default function PPC() {
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WizardMode>("create");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sessionId, setSessionId] = useState("init");

  const openNewCampaign = () => {
    setWorkspaceMode("create");
    setSelectedCampaign(null);
    setSessionId(Date.now().toString());
    setWorkspaceOpen(true);
  };

  const openEditCampaign = (c: Campaign) => {
    setWorkspaceMode("edit");
    setSelectedCampaign(c);
    setSessionId(`edit-${c.id}-${Date.now()}`);
    setWorkspaceOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="heading-ppc">
            <MonitorPlay size={18} className="text-primary" /> PPC / Paid Search
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Google Ads, Microsoft Advertising, Baidu, Naver — managed from one place.</p>
        </div>
        <Button className="gap-1.5 shrink-0" onClick={openNewCampaign} data-testid="btn-new-campaign">
          <Plus size={14} /> New Campaign
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border h-9">
          {[["overview","Overview"],["recommendations","Recommendations"],["approvals","Approvals"],["reports","Reports"]].map(([v,l]) => (
            <TabsTrigger key={v} value={v} className="text-xs" data-testid={`tab-${v}`}>{l}</TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-5">
          <TabsContent value="overview">
            <PPCOverview campaigns={campaigns} onNewCampaign={openNewCampaign} onEditCampaign={openEditCampaign} />
          </TabsContent>
          <TabsContent value="recommendations"><RecommendationsTab /></TabsContent>
          <TabsContent value="approvals"><ApprovalsTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </div>
      </Tabs>

      {/* Campaign Workspace */}
      <CampaignWorkspace
        key={sessionId}
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        mode={workspaceMode}
        campaign={selectedCampaign}
      />
    </div>
  );
}
