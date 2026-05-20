import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  MonitorPlay, Plus, CheckCircle, XCircle, AlertCircle, AlertTriangle,
  Loader2, ChevronRight, ChevronLeft, Search, Target, DollarSign,
  Zap, Shield, FileText, MoreHorizontal, Edit, Eye, Brain, Lightbulb,
  Sparkles, TrendingUp, ChevronDown, Download, Rocket, ThumbsUp,
  ThumbsDown, Wand2, ArrowRight, Circle, X, ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "data_check" | "approval" | "live" | "optimising" | "paused";
type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver" | "Yahoo Japan";
type PrimaryGoal = "leads" | "sales" | "bookings" | "traffic" | "brand_protection" | "competitor_conquest";
type WizardMode = "create" | "edit";

interface Campaign {
  id: number; name: string; platforms: Platform[]; goal: PrimaryGoal;
  status: CampaignStatus; budget: number; spend: number; conversions: number;
  cpl: number; trackingStatus: "ok" | "warning" | "error";
  approvalStatus: "approved" | "pending" | "not_required" | "rejected";
  owner: string; sparkRec?: string;
}

interface SuggestedKeyword {
  id: number; term: string;
  group: "Brand" | "High Intent" | "Product" | "Local" | "Competitor" | "Informational";
  matchType: "Exact" | "Phrase" | "Broad"; cpcRange: string;
  competition: "Low" | "Medium" | "High"; accepted: boolean | null;
}

interface CampaignForm {
  name: string; primaryGoal: string; urgency: string; maxCpl: string; maxDaily: string;
  product: string; offer: string; geography: string; audience: string; landingPage: string;
  platforms: Platform[]; totalBudget: string; budgetStyle: string;
  searchIntent: string; brandKeywords: string; serviceKeywords: string;
  negativeKeywords: string; acceptedKeywords: SuggestedKeyword[];
  headline1: string; headline2: string; headline3: string;
  desc1: string; desc2: string; ga4Event: string; owner: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { value: "leads", label: "Generate Leads", desc: "Capture contacts from interested prospects" },
  { value: "sales", label: "Drive Sales", desc: "Direct product or subscription purchase" },
  { value: "bookings", label: "Book Appointments", desc: "Demo, call, or in-person booking" },
  { value: "traffic", label: "Website Traffic", desc: "Awareness over conversion volume" },
  { value: "brand_protection", label: "Brand Protection", desc: "Own your branded search terms" },
  { value: "competitor_conquest", label: "Competitor Conquest", desc: "Appear when users search for rivals" },
];

const GOAL_LABELS: Record<string, string> = Object.fromEntries(GOAL_OPTIONS.map((g) => [g.value, g.label]));

const PLATFORM_STATUS: Record<Platform, "connected" | "disconnected" | "coming_soon"> = {
  "Google Ads": "connected", "Microsoft Advertising": "connected",
  "Baidu": "disconnected", "Naver": "disconnected", "Yahoo Japan": "coming_soon",
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground" },
  data_check: { label: "Data Check", color: "text-amber-400" },
  approval: { label: "Awaiting Approval", color: "text-orange-400" },
  live: { label: "Live", color: "text-green-400" },
  optimising: { label: "Optimising", color: "text-emerald-400" },
  paused: { label: "Paused", color: "text-muted-foreground" },
};

const GROUP_STYLES: Record<string, string> = {
  Brand: "text-blue-300", "High Intent": "text-green-300", Product: "text-primary",
  Local: "text-cyan-300", Competitor: "text-red-300", Informational: "text-muted-foreground",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Brand Search — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "live", budget: 15000, spend: 12400, conversions: 312, cpl: 39.74, trackingStatus: "ok", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Raise bids on top 3 brand terms — ROAS 6.1×" },
  { id: 2, name: "Non-Brand — Singapore SMEs", platforms: ["Google Ads"], goal: "leads", status: "optimising", budget: 22000, spend: 18900, conversions: 247, cpl: 76.52, trackingStatus: "ok", approvalStatus: "approved", owner: "Sarah Park", sparkRec: "Add 14 negatives → cut ~$1,840 wasted spend" },
  { id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"], goal: "competitor_conquest", status: "live", budget: 9000, spend: 8200, conversions: 58, cpl: 141.38, trackingStatus: "warning", approvalStatus: "approved", owner: "Alex Chen", sparkRec: "Pause low-conv. ad group — CPA 2× target" },
  { id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "approval", budget: 18000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "warning", approvalStatus: "pending", owner: "Sarah Park" },
  { id: 5, name: "Baidu China Expansion", platforms: ["Baidu"], goal: "brand_protection", status: "data_check", budget: 12000, spend: 0, conversions: 0, cpl: 0, trackingStatus: "error", approvalStatus: "not_required", owner: "Priya Sharma" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialForm(mode: WizardMode, campaign?: Campaign | null): CampaignForm {
  if (mode === "create" || !campaign) {
    return {
      name: "", primaryGoal: "", urgency: "normal", maxCpl: "", maxDaily: "",
      product: "", offer: "", geography: "", audience: "", landingPage: "",
      platforms: ["Google Ads", "Microsoft Advertising"], totalBudget: "", budgetStyle: "balanced",
      searchIntent: "", brandKeywords: "", serviceKeywords: "", negativeKeywords: "", acceptedKeywords: [],
      headline1: "", headline2: "", headline3: "", desc1: "", desc2: "",
      ga4Event: "generate_lead", owner: "Alex Chen",
    };
  }
  return {
    name: campaign.name, primaryGoal: campaign.goal, urgency: "normal", maxCpl: "", maxDaily: "",
    product: "SPARK AI — AI-powered marketing platform for B2B SaaS teams",
    offer: "Free 14-day trial", geography: "Singapore, Malaysia, Australia",
    audience: "Marketing managers at B2B SaaS companies", landingPage: "https://sparkapp.io/lp/trial",
    platforms: campaign.platforms, totalBudget: campaign.budget.toString(), budgetStyle: "balanced",
    searchIntent: "Marketing software for teams replacing their agency",
    brandKeywords: "spark ai, spark ai platform", serviceKeywords: "marketing automation software",
    negativeKeywords: "free, tutorial, jobs, reddit", acceptedKeywords: [],
    headline1: "SPARK AI — Marketing Suite", headline2: "AI-Powered Campaign Manager",
    headline3: "Free 14-Day Trial", desc1: "Plan, launch, optimise with AI.",
    desc2: "Connect all channels from one command centre.", ga4Event: "generate_lead",
    owner: campaign.owner,
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

const NEG_SUGGESTIONS = ["free", "open source", "jobs", "salary", "template", "tutorial", "course", "reddit", "youtube", "how to", "certification", "cheap"];

interface ReadinessItem { label: string; done: boolean; critical: boolean }

function getReadiness(form: CampaignForm): ReadinessItem[] {
  return [
    { label: "Primary goal selected", done: !!form.primaryGoal, critical: true },
    { label: "Product described", done: form.product.length > 15, critical: true },
    { label: "Landing page URL", done: !!form.landingPage && form.landingPage.startsWith("http"), critical: true },
    { label: "Platform selected", done: form.platforms.length > 0, critical: true },
    { label: "Budget set", done: Number(form.totalBudget) > 0, critical: true },
    { label: "Keywords added", done: !!(form.brandKeywords || form.serviceKeywords || form.searchIntent), critical: false },
    { label: "GA4 event configured", done: !!form.ga4Event, critical: false },
    { label: "Negative keywords added", done: !!form.negativeKeywords, critical: false },
    { label: "Ad headlines written", done: !!(form.headline1 && form.headline2), critical: false },
  ];
}

function readinessScore(form: CampaignForm) {
  const items = getReadiness(form);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

function canRequestApproval(form: CampaignForm) {
  return getReadiness(form).filter((i) => i.critical).every((i) => i.done);
}

// ─── Workspace Steps ──────────────────────────────────────────────────────────

const STEPS = ["Goal", "Audience", "Keywords & Budget", "Ads & Tracking", "Review"];

function GoalStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [showGuardrails, setShowGuardrails] = useState(false);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          What is the primary business outcome this campaign should drive?<br />
          SPARK will optimise bids, measurement, and recommendations around this goal.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((g) => (
            <button key={g.value} onClick={() => setField("primaryGoal", g.value)}
              className={`group text-left p-5 rounded-2xl border transition-all duration-200 ${form.primaryGoal === g.value
                ? "border-primary/60 bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0_0_0_1px_rgba(124,58,237,0.15)]"
                : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`font-semibold text-sm ${form.primaryGoal === g.value ? "text-primary" : "text-foreground"}`}>{g.label}</p>
                {form.primaryGoal === g.value && <CheckCircle size={14} className="text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">Budget Urgency</p>
        <div className="flex gap-2">
          {[["test","Test","Learn before spending full budget"],["normal","Normal","Standard pacing — recommended"],["aggressive","Aggressive","Maximise daily spend"]].map(([v,l,d]) => (
            <button key={v} onClick={() => setField("urgency", v)}
              className={`flex-1 p-4 rounded-2xl border text-left transition-all ${form.urgency === v ? "border-primary/40 bg-primary/8" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
              <p className={`font-semibold text-sm ${form.urgency === v ? "text-primary" : ""}`}>{l}</p>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowGuardrails(!showGuardrails)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown size={12} className={`transition-transform ${showGuardrails ? "rotate-180" : ""}`} /> Advanced guardrails
      </button>
      {showGuardrails && (
        <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div><Label className="text-xs text-muted-foreground">Max CPL Target ($)</Label><Input placeholder="e.g. 120" type="number" className="mt-2 h-9 bg-white/[0.03] border-white/10" value={form.maxCpl} onChange={(e) => setField("maxCpl", e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Max Daily Spend ($)</Label><Input placeholder="e.g. 500" type="number" className="mt-2 h-9 bg-white/[0.03] border-white/10" value={form.maxDaily} onChange={(e) => setField("maxDaily", e.target.value)} /></div>
        </div>
      )}
    </div>
  );
}

function AudienceStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">What are you promoting?</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">SPARK uses this to generate keyword and copy suggestions. Be specific about the product and who it's for.</p>
        <Textarea placeholder="e.g. SPARK AI — an AI-powered marketing platform for B2B SaaS teams. Replaces agency work for marketing managers who need to run campaigns without technical support." value={form.product} onChange={(e) => setField("product", e.target.value)} className="h-24 text-sm resize-none bg-white/[0.02] border-white/8" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div><Label className="text-sm font-semibold">Offer or CTA</Label><Input placeholder="e.g. Free 14-day trial" className="mt-2 h-10 bg-white/[0.02] border-white/8" value={form.offer} onChange={(e) => setField("offer", e.target.value)} /></div>
        <div><Label className="text-sm font-semibold">Target Geography</Label><Input placeholder="e.g. Singapore, Malaysia, Australia" className="mt-2 h-10 bg-white/[0.02] border-white/8" value={form.geography} onChange={(e) => setField("geography", e.target.value)} /></div>
      </div>
      <div><Label className="text-sm font-semibold">Target Audience</Label><Input placeholder="e.g. Marketing managers at B2B SaaS companies, 10–200 employees" className="mt-2 h-10 bg-white/[0.02] border-white/8" value={form.audience} onChange={(e) => setField("audience", e.target.value)} /></div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Landing Page URL <span className="text-red-400">*</span></Label>
          {form.landingPage && form.landingPage.startsWith("http") && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} />Valid URL</span>}
        </div>
        <Input placeholder="https://yoursite.com/campaign-page" className="mt-2 h-10 font-mono text-xs bg-white/[0.02] border-white/8" value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} />
        {form.landingPage && !form.landingPage.startsWith("http") && <p className="text-xs text-red-400 mt-1.5">URL must start with https://</p>}
      </div>
    </div>
  );
}

function KeywordsBudgetStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [loadingKw, setLoadingKw] = useState(false);
  const [loadingNeg, setLoadingNeg] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedKeyword[]>(form.acceptedKeywords);
  const [showSuggestions, setShowSuggestions] = useState(form.acceptedKeywords.length > 0);

  const suggestKeywords = async () => {
    setLoadingKw(true);
    await new Promise((r) => setTimeout(r, 1100));
    const kws = generateMockKeywords(form);
    setSuggestions(kws); setField("acceptedKeywords", kws); setShowSuggestions(true); setLoadingKw(false);
  };

  const suggestNegatives = async () => {
    setLoadingNeg(true);
    await new Promise((r) => setTimeout(r, 700));
    const current = form.negativeKeywords ? form.negativeKeywords.split(",").map((s) => s.trim()) : [];
    setField("negativeKeywords", [...new Set([...current, ...NEG_SUGGESTIONS.slice(0, 8)])].join(", "));
    setLoadingNeg(false);
  };

  const setKwAccepted = (id: number, accepted: boolean) => {
    const updated = suggestions.map((k) => k.id === id ? { ...k, accepted } : k);
    setSuggestions(updated); setField("acceptedKeywords", updated);
  };

  const ALL_PLATFORMS: Platform[] = ["Google Ads", "Microsoft Advertising", "Baidu", "Naver", "Yahoo Japan"];
  const budget = Number(form.totalBudget || 0);
  const accepted = suggestions.filter((k) => k.accepted === true).length;

  return (
    <div className="space-y-8">
      {/* Platforms */}
      <div>
        <p className="text-sm font-semibold mb-1">Platforms</p>
        <p className="text-xs text-muted-foreground mb-4">SPARK creates a separate plan per platform under one unified budget.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ALL_PLATFORMS.map((p) => {
            const sel = form.platforms.includes(p);
            const cs = PLATFORM_STATUS[p] === "coming_soon";
            const conn = PLATFORM_STATUS[p] === "connected";
            return (
              <button key={p} disabled={cs}
                onClick={() => { if (cs) return; setField("platforms", sel ? form.platforms.filter((x) => x !== p) : [...form.platforms, p]); }}
                className={`p-4 rounded-2xl border text-left transition-all ${sel ? "border-primary/40 bg-primary/8" : "border-white/5 bg-white/[0.02] hover:border-white/10"} ${cs ? "opacity-40 cursor-not-allowed" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${sel ? "text-primary" : ""}`}>{p === "Microsoft Advertising" ? "Microsoft / Bing" : p}</p>
                  {sel && <CheckCircle size={12} className="text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{conn ? "● Connected" : cs ? "Coming soon" : "○ Not connected"}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Monthly Budget ($) <span className="text-red-400">*</span></Label>
          <Input type="number" placeholder="e.g. 15000" className="mt-2 h-10 bg-white/[0.02] border-white/8 text-base font-semibold" value={form.totalBudget} onChange={(e) => setField("totalBudget", e.target.value)} />
          {budget > 0 && form.platforms.length > 1 && <p className="text-xs text-muted-foreground mt-1.5">Suggested split: <span className="text-foreground">${Math.round(budget * 0.7).toLocaleString()}</span> Google · <span className="text-foreground">${Math.round(budget * 0.2).toLocaleString()}</span> Bing</p>}
        </div>
        <div>
          <Label className="text-sm font-semibold">Pacing</Label>
          <Select value={form.budgetStyle} onValueChange={(v) => setField("budgetStyle", v)}>
            <SelectTrigger className="mt-2 h-10 bg-white/[0.02] border-white/8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="conservative">Conservative</SelectItem><SelectItem value="balanced">Balanced</SelectItem><SelectItem value="aggressive">Aggressive</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Keyword intent */}
      <div>
        <Label className="text-sm font-semibold">What would your customers search for?</Label>
        <Textarea placeholder="Describe it naturally — e.g. 'Marketing software that helps small teams run campaigns without an agency. They might search for HubSpot or Marketo alternatives.'" value={form.searchIntent} onChange={(e) => setField("searchIntent", e.target.value)} className="mt-2 h-16 text-sm resize-none bg-white/[0.02] border-white/8" />
        <div className="flex gap-2.5 mt-3">
          <button onClick={suggestKeywords} disabled={loadingKw}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/8 text-xs text-primary hover:bg-primary/12 transition-colors disabled:opacity-60" data-testid="btn-suggest-keywords">
            {loadingKw ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Suggest Keywords with AI
          </button>
          <button onClick={suggestNegatives} disabled={loadingNeg}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-white/[0.02] text-xs text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors disabled:opacity-60">
            {loadingNeg ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />} Suggest Negatives
          </button>
        </div>
      </div>

      {/* AI keyword results */}
      {showSuggestions && suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">AI Keyword Suggestions</p>
            <span className="text-xs text-muted-foreground">{accepted}/{suggestions.length} accepted</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {suggestions.map((kw) => (
              <div key={kw.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${kw.accepted === true ? "bg-green-500/5 border border-green-500/20" : kw.accepted === false ? "opacity-30" : "border border-white/5 bg-white/[0.02]"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs">{kw.term}</span>
                    <span className={`text-xs ${GROUP_STYLES[kw.group]}`}>{kw.group}</span>
                    <span className="text-xs text-muted-foreground/60">{kw.matchType}</span>
                    <span className="text-xs text-muted-foreground/60">{kw.cpcRange}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setKwAccepted(kw.id, true)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${kw.accepted === true ? "bg-green-500/20 text-green-300" : "text-muted-foreground hover:text-green-400 hover:bg-green-500/10"}`}><ThumbsUp size={11} /></button>
                  <button onClick={() => setKwAccepted(kw.id, false)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${kw.accepted === false ? "bg-red-500/15 text-red-400" : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"}`}><ThumbsDown size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual fields */}
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-sm font-semibold">Brand Keywords</Label><Textarea placeholder="spark ai, spark ai platform" value={form.brandKeywords} onChange={(e) => setField("brandKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none bg-white/[0.02] border-white/8" /></div>
        <div><Label className="text-sm font-semibold">Service Keywords</Label><Textarea placeholder="marketing automation software" value={form.serviceKeywords} onChange={(e) => setField("serviceKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none bg-white/[0.02] border-white/8" /></div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Negative Keywords <span className="text-xs font-normal text-red-400/80 ml-1">— prevents wasted spend</span></Label>
          <Textarea placeholder="free, tutorial, jobs, reddit, salary" value={form.negativeKeywords} onChange={(e) => setField("negativeKeywords", e.target.value)} className="mt-2 h-12 font-mono text-xs resize-none bg-red-500/[0.03] border-red-500/15" />
        </div>
      </div>
    </div>
  );
}

function AdsTrackingStep({ form, setField }: { form: CampaignForm; setField: (k: string, v: any) => void }) {
  const [generating, setGenerating] = useState(false);

  const generateCopy = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    setField("headline1", "SPARK AI — Marketing Suite");
    setField("headline2", form.offer ? form.offer.slice(0, 30) : "AI Campaign Manager");
    setField("headline3", "Free 14-Day Trial");
    setField("desc1", `${(form.product || "AI marketing platform").slice(0, 60)}. No expertise required.`);
    setField("desc2", `${form.offer || "Start free today"}. One platform for all your channels.`);
    setGenerating(false);
  };

  const trackingItems = [
    { label: "Landing page URL", done: !!form.landingPage && form.landingPage.startsWith("http"), req: true },
    { label: "GA4 conversion event", done: !!form.ga4Event, req: true },
    { label: "UTM template applied", done: !!form.landingPage, req: false },
    { label: "CRM lead source mapping", done: false, req: false },
  ];

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">Ad Copy</p>
            <p className="text-xs text-muted-foreground mt-0.5">Generated from your goal, offer, and product description</p>
          </div>
          <button onClick={generateCopy} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/8 text-xs text-primary hover:bg-primary/12 transition-colors disabled:opacity-60">
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
            {form.headline1 ? "Regenerate" : "Generate with AI"}
          </button>
        </div>

        {(form.headline1 || form.product) && (
          <div className="p-5 mb-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-1.5">
            <p className="text-xs text-muted-foreground mb-2">Live Preview</p>
            <p className="text-blue-400 text-sm font-medium">{[form.headline1, form.headline2, form.headline3].filter(Boolean).join(" | ")}</p>
            <p className="text-green-400/80 font-mono text-xs">{form.landingPage || "yoursite.com"}</p>
            <p className="text-muted-foreground text-xs">{form.desc1 || "Your description will appear here."}</p>
            {form.desc2 && <p className="text-muted-foreground text-xs">{form.desc2}</p>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["headline1","headline2","headline3"] as const).map((k,i) => (
            <div key={k}><Label className="text-xs text-muted-foreground">H{i+1} <span className="font-normal">(max 30)</span></Label><Input maxLength={30} value={form[k]} onChange={(e) => setField(k, e.target.value)} className="mt-1.5 h-9 text-xs bg-white/[0.02] border-white/8" placeholder={`Headline ${i+1}`} /></div>
          ))}
        </div>
        <Textarea maxLength={90} placeholder="Description 1 (max 90 chars)…" value={form.desc1} onChange={(e) => setField("desc1", e.target.value)} className="h-11 text-xs resize-none mb-2 bg-white/[0.02] border-white/8" />
        <Textarea maxLength={90} placeholder="Description 2 (max 90 chars)…" value={form.desc2} onChange={(e) => setField("desc2", e.target.value)} className="h-11 text-xs resize-none bg-white/[0.02] border-white/8" />
      </div>

      <Separator className="bg-white/5" />

      <div>
        <p className="text-sm font-semibold mb-4">Conversion Tracking</p>
        <div className="space-y-2.5 mb-5">
          {trackingItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {item.done ? <CheckCircle size={14} className="text-green-400 shrink-0" /> : <Circle size={14} className="text-white/15 shrink-0" />}
              <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              {!item.done && item.req && <span className="ml-auto text-xs text-amber-400">Required</span>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">GA4 Conversion Event</Label><Input value={form.ga4Event} onChange={(e) => setField("ga4Event", e.target.value)} className="mt-1.5 h-9 font-mono text-xs bg-white/[0.02] border-white/8" placeholder="generate_lead" /></div>
          <div><Label className="text-xs text-muted-foreground">Final URL</Label><Input value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} className="mt-1.5 h-9 font-mono text-xs bg-white/[0.02] border-white/8" placeholder="https://…" /></div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, mode }: { form: CampaignForm; mode: WizardMode }) {
  const items = getReadiness(form);
  const score = readinessScore(form);
  const canApprove = canRequestApproval(form);
  const accepted = form.acceptedKeywords.filter((k) => k.accepted === true);
  const budget = Number(form.totalBudget || 0);
  const criticalMissing = items.filter((i) => i.critical && !i.done);

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Launch Readiness</p>
          <span className={`text-2xl font-bold ${score >= 80 ? "text-green-400" : score >= 55 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
        </div>
        <Progress value={score} className="h-1.5 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {item.done ? <CheckCircle size={11} className="text-green-400 shrink-0" /> : <XCircle size={11} className={`${item.critical ? "text-red-400" : "text-white/20"} shrink-0`} />}
              <span className={item.done ? "" : item.critical ? "text-red-300" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {criticalMissing.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>Complete before requesting approval: <span className="font-semibold">{criticalMissing.map((i) => i.label).join(", ")}</span></span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        {[["Goal", form.primaryGoal ? GOAL_LABELS[form.primaryGoal] : "—"],["Geography", form.geography || "—"],["Budget", budget ? `$${budget.toLocaleString()}/mo` : "—"],["Platforms", form.platforms.join(", ") || "—"],["Owner", form.owner],["Pacing", form.budgetStyle || "Balanced"]].map(([k, v]) => (
          <div key={k}><p className="text-xs text-muted-foreground mb-0.5">{k}</p><p className="font-medium">{v}</p></div>
        ))}
      </div>

      {/* Accepted keywords */}
      {accepted.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{accepted.length} keyword{accepted.length !== 1 ? "s" : ""} accepted</p>
          <div className="flex flex-wrap gap-2">
            {accepted.slice(0, 8).map((k) => <span key={k.id} className={`text-xs font-mono px-2.5 py-1 rounded-lg ${GROUP_STYLES[k.group]} bg-white/[0.04] border border-white/8`}>{k.term}</span>)}
            {accepted.length > 8 && <span className="text-xs text-muted-foreground">+{accepted.length - 8} more</span>}
          </div>
        </div>
      )}

      {/* Ad preview */}
      {form.headline1 && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-xs space-y-1">
          <p className="text-blue-400 font-medium">{[form.headline1, form.headline2, form.headline3].filter(Boolean).join(" | ")}</p>
          <p className="text-green-400/70 font-mono">{form.landingPage || "yoursite.com"}</p>
          {form.desc1 && <p className="text-muted-foreground">{form.desc1}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Campaign Workspace (full-page overlay) ───────────────────────────────────

interface WorkspaceProps { open: boolean; onClose: () => void; mode: WizardMode; campaign?: Campaign | null }

function CampaignWorkspace({ open, onClose, mode, campaign }: WorkspaceProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setFormState] = useState<CampaignForm>(() => getInitialForm(mode, campaign));

  useEffect(() => {
    if (open) { setFormState(getInitialForm(mode, campaign)); setStep(0); }
  }, [open, mode, campaign]);

  const setField = useCallback((key: string, value: any) => setFormState((f) => ({ ...f, [key]: value })), []);

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast({ title: "Draft saved", description: `"${form.name || "Untitled"}" saved at step ${step + 1}.` });
  };

  const handleRequestApproval = async () => {
    if (!canRequestApproval(form)) { toast({ title: "Campaign not ready", description: "Complete critical fields first.", variant: "destructive" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast({ title: "Approval requested", description: `"${form.name || "Untitled"}" sent to approvers.` });
    onClose();
  };

  const score = readinessScore(form);
  const canApprove = canRequestApproval(form);
  const criticalCount = getReadiness(form).filter((i) => i.critical && !i.done).length;

  // Brain content per step
  const brainContent: { headline: string; bullets: string[]; warning?: string; tip?: string; actions?: { label: string; onClick: () => void }[] }[] = [
    {
      headline: form.primaryGoal ? `${GOAL_LABELS[form.primaryGoal]}` : "No goal set yet",
      bullets: [form.primaryGoal ? `SPARK will optimise all bids and measurement around ${GOAL_LABELS[form.primaryGoal]}.` : "Your goal shapes everything — bids, measurement, and SPARK's recommendations.", form.urgency ? `Urgency: ${form.urgency}. ${form.urgency === "aggressive" ? "Full daily spend." : form.urgency === "test" ? "Low spend — learn first." : "Standard pacing."}` : ""],
      tip: "Most B2B SaaS companies start with Generate Leads. You can add secondary goals later.",
      actions: [
        { label: "Recommend goal for my business", onClick: () => { setField("primaryGoal", "leads"); toast({ title: "Recommended: Generate Leads" }); } },
        { label: "Apply sensible guardrails", onClick: () => { setField("maxCpl", "120"); setField("maxDaily", "500"); toast({ title: "Guardrails applied: max CPL $120, max daily $500" }); } },
      ],
    },
    {
      headline: form.product ? "Product brief captured" : "Product brief missing",
      bullets: [form.product ? "SPARK will use your product description to generate keyword groups and ad copy." : "Add your product description to unlock AI keyword and copy suggestions.", form.geography ? `Targeting: ${form.geography}` : "Add a geography to localise keyword targeting.", form.landingPage ? "Landing page set." : "⚠ Landing page required before launch."],
      warning: !form.product ? "A vague description weakens all downstream AI suggestions." : undefined,
      tip: "Describe what your product does and who it's for. 2–3 sentences is ideal.",
      actions: !form.product ? [{ label: "Add example description", onClick: () => { setField("product", "SPARK AI — an AI-powered marketing platform for B2B SaaS teams. Replaces agency work for marketing managers."); toast({ title: "Example description added" }); } }] : [],
    },
    {
      headline: `${form.platforms.length} platform${form.platforms.length !== 1 ? "s" : ""} selected`,
      bullets: [
        form.totalBudget ? `$${Number(form.totalBudget).toLocaleString()}/mo` + (form.platforms.length > 1 ? ` across ${form.platforms.length} platforms` : "") : "Set a budget to see the recommended split.",
        !form.negativeKeywords ? "⚠ No negative keywords — this is the #1 cause of wasted search spend." : `Negatives: ${form.negativeKeywords.split(",").filter(Boolean).length} terms`,
        form.acceptedKeywords.filter((k) => k.accepted).length > 0 ? `${form.acceptedKeywords.filter((k) => k.accepted).length} AI keywords accepted` : "Use AI to generate keyword groups from your product brief.",
      ].filter(Boolean),
      warning: !form.negativeKeywords ? "Add negative keywords before launch." : undefined,
      tip: "Start with Google Ads + Bing. Add other platforms after 30 days of data.",
      actions: [
        { label: "Recommend platform mix", onClick: () => { setField("platforms", ["Google Ads", "Microsoft Advertising"]); toast({ title: "Recommended: Google Ads + Microsoft Advertising" }); } },
        { label: "Set recommended budget", onClick: () => { if (!form.totalBudget) { setField("totalBudget", "15000"); toast({ title: "Budget set: $15,000/mo" }); } } },
      ],
    },
    {
      headline: form.headline1 ? `"${form.headline1}"` : "No ad copy yet",
      bullets: [form.headline1 ? "Headlines look good. Check character limits." : "Click 'Generate with AI' to create ad copy from your product brief.", form.ga4Event ? `GA4 event: ${form.ga4Event}` : "⚠ GA4 conversion event required for Smart Bidding to work.", form.landingPage ? "Landing page URL confirmed." : ""],
      warning: !form.ga4Event ? "Smart Bidding cannot learn without a conversion event." : undefined,
      tip: "Lead with your strongest benefit in H1. Put your offer in H3.",
      actions: [
        { label: "Generate ad copy", onClick: () => { setField("headline1", "SPARK AI — Marketing Suite"); setField("headline2", form.offer?.slice(0,30) || "AI Campaign Manager"); setField("headline3", "Free 14-Day Trial"); setField("desc1", `${(form.product || "AI platform").slice(0,60)}. No expertise required.`); setField("desc2", `${form.offer || "Start free today"}. One platform for all channels.`); toast({ title: "Ad copy generated" }); } },
      ],
    },
    {
      headline: `${score}% ready`,
      bullets: [canApprove ? "All critical fields complete. You can request approval." : `${criticalCount} critical field${criticalCount !== 1 ? "s" : ""} still needed.`, form.acceptedKeywords.filter((k) => k.accepted).length > 0 ? `${form.acceptedKeywords.filter((k) => k.accepted).length} keywords will be included in the campaign structure.` : ""],
      warning: !canApprove ? "Complete critical fields before requesting approval." : undefined,
      tip: "Save Draft to continue later. Request Approval only when the campaign is production-ready.",
      actions: [
        { label: "Check readiness", onClick: () => { const missing = getReadiness(form).filter((i) => !i.done); toast({ title: missing.length ? `${missing.length} items remaining` : "Campaign is ready!", description: missing.map((i) => i.label).join(", ") || undefined }); } },
      ],
    },
  ];

  const brain = brainContent[step] ?? { headline: "", bullets: [] };

  const renderStep = () => {
    switch (step) {
      case 0: return <GoalStep form={form} setField={setField} />;
      case 1: return <AudienceStep form={form} setField={setField} />;
      case 2: return <KeywordsBudgetStep form={form} setField={setField} />;
      case 3: return <AdsTrackingStep form={form} setField={setField} />;
      case 4: return <ReviewStep form={form} mode={mode} />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0d14] flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-4 px-8 py-4 border-b border-white/5">
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <X size={16} />
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Input
            placeholder="Campaign name…"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="h-8 text-base font-semibold bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/50 max-w-sm placeholder:font-normal placeholder:text-sm"
            data-testid="input-campaign-name"
          />
          {mode === "edit" && <span className="text-xs text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-lg">Editing</span>}
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mx-4">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} className="flex items-center gap-1.5 group" title={s}>
              <div className={`transition-all rounded-full ${i === step ? "w-6 h-2 bg-primary" : i < step ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-white/15"}`} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          <span className={score >= 80 ? "text-green-400" : score >= 55 ? "text-amber-400" : "text-red-400"}>{score}%</span>
          <span>ready</span>
        </div>
        <button onClick={handleSaveDraft} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />} Save Draft
        </button>
      </div>

      {/* Body: main content + SPARK Brain */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">
            {/* Step header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {STEPS.map((s, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <button onClick={() => setStep(i)} className={`transition-colors ${i === step ? "text-primary font-semibold" : i < step ? "text-foreground/60 hover:text-foreground" : "text-muted-foreground/40"}`}>{s}</button>
                    {i < STEPS.length - 1 && <ChevronRight size={10} className="text-white/15 shrink-0" />}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{STEPS[step]}</h2>
            </div>

            {renderStep()}
          </div>
        </div>

        {/* SPARK Brain Panel */}
        <div className="w-72 shrink-0 border-l border-white/5 flex flex-col overflow-y-auto">
          {/* Brain header */}
          <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-b from-primary/8 to-transparent">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain size={13} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">SPARK Brain</span>
            </div>
            <p className="text-xs text-muted-foreground">Co-designing your campaign</p>
          </div>

          <div className="flex-1 px-6 py-5 space-y-5">
            {/* Current state */}
            <div>
              <p className={`text-sm font-semibold mb-3 ${brain.headline.includes("%") && score < 80 ? "text-amber-300" : brain.headline.includes("missing") || brain.headline.includes("No ") ? "text-muted-foreground" : ""}`}>{brain.headline}</p>
              <ul className="space-y-2.5">
                {brain.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles size={9} className="text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {brain.warning && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-500/15 bg-red-500/5 text-xs text-red-300">
                <AlertTriangle size={10} className="shrink-0 mt-0.5" />{brain.warning}
              </div>
            )}

            {brain.actions && brain.actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">AI can do this</p>
                {brain.actions.map((a, i) => (
                  <button key={i} onClick={a.onClick}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 text-xs text-primary transition-colors">
                    <span className="flex items-center gap-1.5"><Zap size={9} />{a.label}</span>
                    <ArrowRight size={9} />
                  </button>
                ))}
              </div>
            )}

            {brain.tip && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-muted-foreground">
                <Lightbulb size={10} className="shrink-0 mt-0.5 text-amber-400" />{brain.tip}
              </div>
            )}

            {/* Live campaign summary */}
            {(form.primaryGoal || form.totalBudget || form.platforms.length > 0) && (
              <div className="pt-2 border-t border-white/5 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Campaign so far</p>
                {[
                  form.name && ["Name", form.name],
                  form.primaryGoal && ["Goal", GOAL_LABELS[form.primaryGoal]],
                  form.geography && ["Where", form.geography.split(",")[0].trim()],
                  form.totalBudget && ["Budget", `$${Number(form.totalBudget).toLocaleString()}/mo`],
                  form.platforms.length > 0 && ["Platforms", form.platforms.map((p) => p === "Microsoft Advertising" ? "Bing" : p.split(" ")[0]).join(", ")],
                ].filter(Boolean).map(([k, v]: any, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground/80 text-right ml-2 truncate max-w-[130px]">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 flex items-center justify-between px-8 py-4 border-t border-white/5 bg-[#0b0d14]">
        <button onClick={() => step > 0 ? setStep(step - 1) : onClose()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <ChevronLeft size={14} />{step === 0 ? "Cancel" : "Back"}
        </button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleRequestApproval} disabled={saving || !canApprove}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${canApprove ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/5 text-muted-foreground cursor-not-allowed"}`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Request Approval
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PPC Overview ─────────────────────────────────────────────────────────────

function PPCOverview({ campaigns, onNewCampaign, onEditCampaign }: { campaigns: Campaign[]; onNewCampaign: () => void; onEditCampaign: (c: Campaign) => void }) {
  const [filter, setFilter] = useState("");
  const filtered = campaigns.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "optimising");
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok");
  const pendingApprovals = campaigns.filter((c) => c.approvalStatus === "pending");
  const topRec = campaigns.find((c) => c.sparkRec);

  const budgetPct = totalBudget ? Math.round((totalSpend / totalBudget) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Command band */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-primary/8 via-transparent to-transparent p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-3">SPARK Intelligence</p>
            {topRec ? (
              <>
                <p className="text-xl font-bold tracking-tight mb-1">{topRec.sparkRec}</p>
                <p className="text-sm text-muted-foreground">{topRec.name} · Apply this recommendation to reduce waste and improve ROAS.</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold tracking-tight mb-1">All campaigns are healthy</p>
                <p className="text-sm text-muted-foreground">No critical actions required right now.</p>
              </>
            )}
            <button className="flex items-center gap-1.5 mt-4 text-xs text-primary hover:text-primary/80 transition-colors">
              <Zap size={11} /> View all AI recommendations <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {[
              { label: "Active", value: activeCampaigns.length, note: "campaigns", color: "text-green-400" },
              { label: "Spend", value: `$${(totalSpend/1000).toFixed(1)}k`, note: `of $${(totalBudget/1000).toFixed(0)}k`, color: "text-foreground" },
              { label: "Approvals", value: pendingApprovals.length, note: "pending", color: pendingApprovals.length > 0 ? "text-amber-400" : "text-muted-foreground" },
              { label: "Issues", value: trackingIssues.length, note: "tracking", color: trackingIssues.length > 0 ? "text-red-400" : "text-muted-foreground" },
            ].map((kpi) => (
              <div key={kpi.label} className="text-right">
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label} · {kpi.note}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Budget progress */}
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Budget utilisation</span>
            <span className="text-foreground">${totalSpend.toLocaleString()} of ${totalBudget.toLocaleString()}</span>
          </div>
          <Progress value={budgetPct} className="h-1" />
        </div>
      </div>

      {/* Inline alerts — only when needed */}
      {(pendingApprovals.length > 0 || trackingIssues.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingApprovals.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm flex-1 min-w-[200px]">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span className="text-amber-300"><span className="font-semibold">{pendingApprovals.length} campaign{pendingApprovals.length > 1 ? "s" : ""}</span> awaiting approval</span>
              <button className="ml-auto text-xs text-amber-400/70 hover:text-amber-300 transition-colors flex items-center gap-1">Review <ChevronRight size={10} /></button>
            </div>
          )}
          {trackingIssues.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm flex-1 min-w-[200px]">
              <XCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-red-300"><span className="font-semibold">{trackingIssues.length} campaign{trackingIssues.length > 1 ? "s" : ""}</span> with tracking issues</span>
              <button className="ml-auto text-xs text-red-400/70 hover:text-red-300 transition-colors flex items-center gap-1">Fix <ChevronRight size={10} /></button>
            </div>
          )}
        </div>
      )}

      {/* Campaign list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Search Campaigns</h2>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 h-8 w-40 text-xs bg-white/[0.02] border-white/8" />
          </div>
        </div>

        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_100px_90px_90px_70px_70px_24px] items-center px-4 py-2 text-xs text-muted-foreground/60 uppercase tracking-wider">
            <span>Campaign</span><span>Platforms</span><span className="text-right">Budget</span><span className="text-right">Spend</span><span className="text-right">Conv.</span><span className="text-right">CPL</span><span />
          </div>

          {filtered.map((c) => {
            const pct = c.budget ? Math.min(Math.round((c.spend / c.budget) * 100), 100) : 0;
            return (
              <div key={c.id} className="group grid grid-cols-[1fr_100px_90px_90px_70px_70px_24px] items-center px-4 py-4 rounded-xl hover:bg-white/[0.03] transition-colors" data-testid={`campaign-row-${c.id}`}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "live" || c.status === "optimising" ? "bg-green-400" : c.status === "approval" ? "bg-amber-400" : c.status === "data_check" ? "bg-red-400" : "bg-white/20"}`} />
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.trackingStatus === "error" && <AlertCircle size={12} className="text-red-400 shrink-0" />}
                    {c.trackingStatus === "warning" && <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
                  </div>
                  {c.sparkRec && <p className="text-xs text-primary/70 ml-4 mt-0.5">{c.sparkRec}</p>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.platforms.map((p) => <span key={p} className="text-xs text-muted-foreground">{p === "Microsoft Advertising" ? "Bing" : p === "Google Ads" ? "Google" : p}</span>).reduce((acc: any, x, i) => i === 0 ? [x] : [...acc, <span key={`sep-${i}`} className="text-white/20">·</span>, x], [])}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">${c.budget.toLocaleString()}</p>
                  {c.spend > 0 && <div className="ml-auto mt-1 h-0.5 w-12 bg-white/10 rounded-full"><div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div>}
                </div>
                <p className="text-right text-xs text-muted-foreground">{c.spend > 0 ? `$${c.spend.toLocaleString()}` : "—"}</p>
                <p className="text-right text-xs font-medium text-primary">{c.conversions > 0 ? c.conversions : "—"}</p>
                <p className="text-right text-xs text-muted-foreground">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</p>
                <button onClick={() => onEditCampaign(c)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" data-testid={`btn-edit-${c.id}`} title="Edit">
                  <Edit size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected accounts — minimal */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-2">Accounts:</span>
        {(["Google Ads", "Microsoft Advertising", "Baidu", "Naver"] as Platform[]).map((p) => (
          <span key={p} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${PLATFORM_STATUS[p] === "connected" ? "border-green-500/20 text-green-400" : "border-white/8 text-muted-foreground"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PLATFORM_STATUS[p] === "connected" ? "bg-green-400" : "bg-white/20"}`} />
            {p === "Microsoft Advertising" ? "Bing" : p}
          </span>
        ))}
        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 transition-colors ml-1">
          <Plus size={10} /> Connect
        </button>
      </div>
    </div>
  );
}

// ─── Recommendations View ─────────────────────────────────────────────────────

function RecommendationsView() {
  const RECS = [
    { type: "Negative Keywords", priority: "high", title: "Add 14 negative keywords to cut ~$1,840 wasted spend", campaign: "Non-Brand — Singapore SMEs", effort: "5 min" },
    { type: "Budget Shift", priority: "high", title: "Move $3k from Competitor Conquest (1.8× ROAS) → Brand Search (6.1× ROAS)", campaign: "Global reallocation", effort: "2 min" },
    { type: "Tracking", priority: "high", title: "Fix missing GA4 conversion event on Enterprise Lead Gen before launch", campaign: "Enterprise Lead Gen", effort: "15 min" },
    { type: "Ad Copy", priority: "medium", title: "Refresh headlines for Competitor Conquest — CTR at 1.9%, below 3.5% benchmark", campaign: "Competitor Conquest", effort: "10 min" },
    { type: "New Campaign", priority: "low", title: "Create HubSpot competitor campaign — 22K APAC searches/month going uncaptured", campaign: "Suggested", effort: "30 min" },
  ];
  const priorityColor: Record<string, string> = { high: "text-red-400", medium: "text-amber-400", low: "text-muted-foreground" };

  return (
    <div className="space-y-3 max-w-3xl">
      {RECS.map((r, i) => (
        <div key={i} className="flex items-center gap-5 px-5 py-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`text-xs font-semibold ${priorityColor[r.priority]}`}>{r.priority.toUpperCase()}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-primary/70 font-medium">{r.type}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{r.campaign}</span>
            </div>
            <p className="text-sm font-medium">{r.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Est. effort: {r.effort}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Dismiss</button>
            <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5"><Zap size={10} /> Apply</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Approvals View ───────────────────────────────────────────────────────────

function ApprovalsView() {
  const APPROVALS = [
    { title: "Budget approval — Enterprise Lead Gen", type: "Budget", amount: "$18,000/mo", by: "Sarah Park", time: "2h ago", urgent: true },
    { title: "Keyword approval — Baidu China Expansion", type: "Keywords", amount: "142 keywords", by: "Priya Sharma", time: "4h ago", urgent: false },
    { title: "Ad copy approval — Competitor Conquest v2", type: "Ad Copy", amount: "6 variants", by: "David Lee", time: "Yesterday", urgent: false },
  ];
  return (
    <div className="space-y-3 max-w-3xl">
      {APPROVALS.map((a, i) => (
        <div key={i} className={`flex items-center gap-5 px-5 py-4 rounded-2xl border transition-colors ${a.urgent ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/5 bg-white/[0.01]"}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              {a.urgent && <span className="text-xs font-semibold text-amber-400">URGENT</span>}
              <span className="text-xs text-muted-foreground font-medium">{a.type}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{a.amount}</span>
            </div>
            <p className="text-sm font-medium">{a.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Requested by {a.by} · {a.time}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3 py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/5 transition-colors">Reject</button>
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"><CheckCircle size={10} /> Approve</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView() {
  const REPORTS = ["Campaign Performance Summary", "Platform Comparison (Google vs Bing)", "Keyword Performance", "Budget Pacing Report", "Lead Quality & CRM Attribution", "AI Executive Summary"];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
      {REPORTS.map((r) => (
        <div key={r} className="group p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03] transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><FileText size={14} className="text-primary" /></div>
          <p className="text-sm font-semibold mb-4">{r}</p>
          <div className="flex items-center gap-2">
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"><Eye size={11} /> View</button>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors ml-auto"><Download size={11} /></button>
          </div>
        </div>
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
  const [activeTab, setActiveTab] = useState("overview");

  const openNewCampaign = () => {
    setWorkspaceMode("create"); setSelectedCampaign(null);
    setSessionId(Date.now().toString()); setWorkspaceOpen(true);
  };

  const openEditCampaign = (c: Campaign) => {
    setWorkspaceMode("edit"); setSelectedCampaign(c);
    setSessionId(`edit-${c.id}-${Date.now()}`); setWorkspaceOpen(true);
  };

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "recommendations", label: "Recommendations" },
    { value: "approvals", label: "Approvals" },
    { value: "reports", label: "Reports" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" data-testid="heading-ppc">PPC / Paid Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Google, Bing, Baidu, Naver — one command centre.</p>
        </div>
        <button onClick={openNewCampaign}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-new-campaign">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Tabs — minimal, text-only */}
      <div className="flex items-center gap-1 border-b border-white/5">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.value ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.value}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && <PPCOverview campaigns={campaigns} onNewCampaign={openNewCampaign} onEditCampaign={openEditCampaign} />}
        {activeTab === "recommendations" && <RecommendationsView />}
        {activeTab === "approvals" && <ApprovalsView />}
        {activeTab === "reports" && <ReportsView />}
      </div>

      {/* Campaign Workspace — full-page overlay */}
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
