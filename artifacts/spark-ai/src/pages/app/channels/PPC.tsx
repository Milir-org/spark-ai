import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  MonitorPlay, Plus, Upload, RefreshCw, Wand2, CheckCircle, XCircle,
  AlertCircle, Clock, Loader2, ChevronRight, ChevronLeft, Search, Target,
  DollarSign, BarChart2, Zap, Shield, Globe, Flag, FileText, Settings,
  MoreHorizontal, Edit, Play, Eye, Copy, Brain, Lightbulb, Sparkles,
  TrendingUp, ArrowRight, ChevronDown, Download, Filter, Users, MapPin,
  Rocket, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "data_check" | "approval" | "live" | "optimising" | "paused" | "reporting";
type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver" | "Yahoo Japan";
type PrimaryGoal = "leads" | "sales" | "bookings" | "traffic" | "brand_protection" | "competitor_conquest" | "local_enquiries";
type BudgetStyle = "conservative" | "balanced" | "aggressive";

interface SparkCampaign {
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
  sparkRec: string;
  approvalStatus: "approved" | "pending" | "not_required" | "rejected";
  owner: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<Platform, string> = {
  "Google Ads": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "Microsoft Advertising": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "Baidu": "text-red-400 bg-red-500/10 border-red-500/30",
  "Naver": "text-green-400 bg-green-500/10 border-green-500/30",
  "Yahoo Japan": "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

const PLATFORM_STATUS: Record<Platform, "connected" | "disconnected" | "coming_soon"> = {
  "Google Ads": "connected",
  "Microsoft Advertising": "connected",
  "Baidu": "disconnected",
  "Naver": "disconnected",
  "Yahoo Japan": "coming_soon",
};

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  leads: "Generate Leads", sales: "Drive Sales", bookings: "Book Appointments",
  traffic: "Website Traffic", brand_protection: "Brand Protection",
  competitor_conquest: "Competitor Conquest", local_enquiries: "Local Enquiries",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-muted/50 text-muted-foreground",
  data_check: "bg-amber-500/15 text-amber-300",
  approval: "bg-orange-500/15 text-orange-300",
  live: "bg-green-500/15 text-green-300",
  optimising: "bg-emerald-500/15 text-emerald-300",
  paused: "bg-muted/50 text-muted-foreground",
  reporting: "bg-indigo-500/15 text-indigo-300",
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft", data_check: "Data Check", approval: "Awaiting Approval",
  live: "Live", optimising: "Optimising", paused: "Paused", reporting: "Reporting",
};

// ─── Mock Campaigns ───────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: SparkCampaign[] = [
  {
    id: 1, name: "Brand Awareness — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"],
    goal: "leads", status: "live", budget: 15000, spend: 12400, avgCpc: 1.82,
    conversions: 312, cpl: 39.74, trackingStatus: "ok",
    sparkRec: "Raise bids on top 3 brand terms — ROAS is 6.1x",
    approvalStatus: "approved", owner: "Alex Chen",
  },
  {
    id: 2, name: "Non-Brand Search — Singapore SMEs", platforms: ["Google Ads"],
    goal: "leads", status: "optimising", budget: 22000, spend: 18900, avgCpc: 3.91,
    conversions: 247, cpl: 76.52, trackingStatus: "ok",
    sparkRec: "Add 14 negative keywords to cut wasted spend by ~$1,840",
    approvalStatus: "approved", owner: "Sarah Park",
  },
  {
    id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"],
    goal: "competitor_conquest", status: "live", budget: 9000, spend: 8200, avgCpc: 5.12,
    conversions: 58, cpl: 141.38, trackingStatus: "warning",
    sparkRec: "Pause low-conv. ad group — CPA is 2× target",
    approvalStatus: "approved", owner: "Alex Chen",
  },
  {
    id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"],
    goal: "leads", status: "approval", budget: 18000, spend: 0, avgCpc: 0,
    conversions: 0, cpl: 0, trackingStatus: "warning",
    sparkRec: "Awaiting budget approval before launch",
    approvalStatus: "pending", owner: "Sarah Park",
  },
  {
    id: 5, name: "Baidu China Expansion", platforms: ["Baidu"],
    goal: "brand_protection", status: "data_check", budget: 12000, spend: 0, avgCpc: 0,
    conversions: 0, cpl: 0, trackingStatus: "error",
    sparkRec: "Localise keywords to Simplified Chinese before proceeding",
    approvalStatus: "not_required", owner: "Priya Sharma",
  },
];

// ─── Utility Components ───────────────────────────────────────────────────────

function PlatformChip({ platform }: { platform: Platform }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PLATFORM_COLORS[platform]}`}>
      {platform === "Microsoft Advertising" ? "Bing" : platform.split(" ")[0]}
    </span>
  );
}

function TrackingBadge({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") return <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} />OK</span>;
  if (status === "warning") return <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle size={11} />Warning</span>;
  return <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={11} />Error</span>;
}

function ApprovalBadge({ status }: { status: SparkCampaign["approvalStatus"] }) {
  const cfg: Record<string, string> = {
    approved: "text-green-300 border-green-500/30",
    pending: "text-amber-300 border-amber-500/30",
    not_required: "text-muted-foreground border-border",
    rejected: "text-red-300 border-red-500/30",
  };
  const label: Record<string, string> = { approved: "Approved", pending: "Pending", not_required: "—", rejected: "Rejected" };
  return <Badge variant="outline" className={`text-xs ${cfg[status]}`}>{label[status]}</Badge>;
}

// ─── SPARK Brain Panel ────────────────────────────────────────────────────────

interface BrainContent {
  headline: string;
  bullets: string[];
  warnings?: string[];
  tip?: string;
}

function getBrainContent(step: number, form: any): BrainContent {
  switch (step) {
    case 0: return {
      headline: "Setting Your Campaign Goal",
      bullets: [
        "Your primary goal drives how SPARK optimises bids and tracks success.",
        "Secondary goals are measured but don't control bidding.",
        form.primaryGoal ? `You've chosen: ${GOAL_LABELS[form.primaryGoal as PrimaryGoal]}. SPARK will optimise for this outcome.` : "Choose a primary goal to continue.",
        "Guardrails protect your budget — always set a max daily spend.",
      ],
      tip: "Not sure? 'Generate Leads' is the most common goal for B2B businesses running paid search.",
    };
    case 1: return {
      headline: "Understanding Your Offer & Audience",
      bullets: [
        form.product ? `Promoting: "${form.product}". ${form.product.length < 10 ? "Add more detail so SPARK can generate better keyword and ad suggestions." : "Good — SPARK can work with this."}` : "Tell SPARK what you're promoting.",
        form.landingPage ? `Landing page set. SPARK will check for tracking before launch.` : "⚠ No landing page yet — you'll need one before launch.",
        form.geography ? `Target geography: ${form.geography}.` : "Geography not set — SPARK will default to global.",
        "Exclusions help SPARK avoid wasted spend from day one.",
      ],
      warnings: !form.product ? ["A vague or missing product description leads to weaker keyword suggestions."] : [],
      tip: "The more specific your offer, the better SPARK's keyword and ad suggestions will be.",
    };
    case 2: return {
      headline: "Platform & Budget Recommendations",
      bullets: [
        "Google Ads: Largest search volume, best for most markets. Recommended allocation: 65–70% of budget.",
        "Microsoft Advertising: 15–20% lower CPCs than Google. Great for adding reach. Recommended: 20–25%.",
        "Baidu: Only for China-focused campaigns. Requires Simplified Chinese keywords.",
        "Naver: South Korea's dominant search engine. Separate keyword strategy needed.",
        form.totalBudget ? `$${Number(form.totalBudget).toLocaleString()}/month. SPARK suggests $${Math.round(Number(form.totalBudget) * 0.7).toLocaleString()} Google / $${Math.round(Number(form.totalBudget) * 0.2).toLocaleString()} Bing as a starting split.` : "Set your budget to see the recommended platform split.",
      ],
      tip: "Start with Google Ads + Microsoft Advertising. Add other platforms after 30 days of performance data.",
    };
    case 3: return {
      headline: "Keyword & Search Intent Analysis",
      bullets: [
        "High-intent keywords convert better but cost more. Mix exact match high-intent with phrase match for volume.",
        form.brandKeywords ? `Brand keywords detected. SPARK recommends Exact match for brand terms to control CPCs.` : "Add brand keywords to protect your brand from competitor bidding.",
        form.negativeKeywords ? `${form.negativeKeywords.split(",").filter(Boolean).length} negative keywords added. SPARK typically recommends 20–30 at launch.` : "⚠ No negative keywords yet — this is where budget gets wasted.",
        "SPARK will generate platform-specific keyword lists in the next step.",
      ],
      warnings: !form.negativeKeywords ? ["Missing negative keywords is one of the most common causes of wasted search ad spend."] : [],
      tip: "Think about what your customers would NOT type. Those are your negative keywords.",
    };
    case 4: return {
      headline: "Campaign Pack Generation",
      bullets: [
        "SPARK has generated ad copy based on your goal, offer, and keywords.",
        "Headlines should include your primary keyword, your offer, and a differentiator.",
        "Each platform will get its own ad copy tailored to its format and character limits.",
        "UTM tagging ensures every click is tracked back to the right campaign and keyword.",
        "Review the tracking checklist carefully — missing GA4 events are the #1 launch blocker.",
      ],
      tip: "Click 'Regenerate' on any section to get fresh AI suggestions.",
    };
    case 5: return {
      headline: "Launch Readiness Check",
      bullets: [
        "Review every section before requesting approval.",
        "Your Launch Readiness Score reflects how complete and risk-free the campaign is.",
        "Platform drafts can be created in SPARK first — syncing to live platforms requires approval.",
        "Once approved, SPARK will push drafts to your connected ad accounts.",
      ],
      warnings: ["Do not launch without verified conversion tracking. Smart Bidding requires conversion data to optimise."],
      tip: "Save Draft to keep working. Request Approval when ready to go live.",
    };
    default: return { headline: "SPARK Brain", bullets: [] };
  }
}

function SparkBrainPanel({ step, form }: { step: number; form: any }) {
  const content = getBrainContent(step, form);
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Brain size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary">SPARK Brain</p>
          <p className="text-xs text-muted-foreground">AI guidance</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <p className="text-sm font-semibold mb-2">{content.headline}</p>
          <ul className="space-y-2">
            {content.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles size={10} className="text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {content.warnings && content.warnings.length > 0 && (
          <div className="space-y-1.5">
            {content.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <AlertCircle size={11} className="shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {content.tip && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
            <Lightbulb size={11} className="shrink-0 mt-0.5" />
            <span>{content.tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wizard Step Forms ────────────────────────────────────────────────────────

const SECONDARY_GOALS: { key: PrimaryGoal; label: string }[] = [
  { key: "leads", label: "Generate Leads" },
  { key: "sales", label: "Drive Sales" },
  { key: "bookings", label: "Book Appointments" },
  { key: "traffic", label: "Website Traffic" },
  { key: "brand_protection", label: "Brand Protection" },
  { key: "competitor_conquest", label: "Competitor Conquest" },
  { key: "local_enquiries", label: "Local Enquiries" },
];

function GoalStep({ form, setField }: { form: any; setField: (k: string, v: any) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">What's the primary goal of this campaign? *</Label>
        <p className="text-xs text-muted-foreground mb-3 mt-1">Pick one. This drives how SPARK optimises your bids and measures success.</p>
        <div className="grid grid-cols-2 gap-2">
          {SECONDARY_GOALS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setField("primaryGoal", key)}
              className={`text-left p-3 rounded-xl border text-sm transition-all ${form.primaryGoal === key ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px] shadow-primary/30" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"}`}
            >
              <p className="font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {form.primaryGoal && (
        <div>
          <Label className="text-sm font-semibold">Any secondary goals to track?</Label>
          <p className="text-xs text-muted-foreground mb-2 mt-1">These won't control bidding, but SPARK will monitor and report on them.</p>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_GOALS.filter((g) => g.key !== form.primaryGoal).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  const current: string[] = form.secondaryGoals ?? [];
                  setField("secondaryGoals", current.includes(key) ? current.filter((k: string) => k !== key) : [...current, key]);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${(form.secondaryGoals ?? []).includes(key) ? "border-primary/60 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Campaign Urgency</Label>
        <div className="flex gap-2 mt-2">
          {[["test", "Test", "Low spend, learn first"], ["normal", "Normal", "Standard pacing"], ["aggressive", "Aggressive", "Spend fully, maximise reach"]].map(([v, l, desc]) => (
            <button
              key={v}
              onClick={() => setField("urgency", v)}
              className={`flex-1 p-3 rounded-xl border text-left transition-all text-xs ${form.urgency === v ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground hover:border-border"}`}
            >
              <p className={`font-semibold text-sm ${form.urgency === v ? "text-primary" : ""}`}>{l}</p>
              <p className="text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} /> Advanced Guardrails
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/40 bg-muted/10">
          <div><Label className="text-xs">Max CPL ($)</Label><Input placeholder="e.g. 120" type="number" className="mt-1 h-8" value={form.maxCpl ?? ""} onChange={(e) => setField("maxCpl", e.target.value)} /></div>
          <div><Label className="text-xs">Max Daily Spend ($)</Label><Input placeholder="e.g. 500" type="number" className="mt-1 h-8" value={form.maxDaily ?? ""} onChange={(e) => setField("maxDaily", e.target.value)} /></div>
          <div className="col-span-2">
            <Label className="text-xs">Location Restrictions</Label>
            <Input placeholder="e.g. Exclude: USA, UK" className="mt-1 h-8" value={form.locationRestrictions ?? ""} onChange={(e) => setField("locationRestrictions", e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}

function OfferAudienceStep({ form, setField }: { form: any; setField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">What are you promoting? *</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Be specific. This helps SPARK generate better keywords and ad copy.</p>
        <Textarea
          placeholder="e.g. SPARK AI — an AI-powered marketing platform for B2B SaaS companies. Helps marketing managers plan and launch campaigns without needing an agency."
          value={form.product ?? ""}
          onChange={(e) => setField("product", e.target.value)}
          className="h-24 text-sm resize-none"
        />
      </div>
      <div>
        <Label className="text-sm font-semibold">What's the offer or call-to-action?</Label>
        <Input placeholder="e.g. Free 14-day trial, no credit card required" className="mt-2 h-9" value={form.offer ?? ""} onChange={(e) => setField("offer", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Target Geography *</Label>
          <Input placeholder="e.g. Singapore, Malaysia, Australia" className="mt-2 h-9" value={form.geography ?? ""} onChange={(e) => setField("geography", e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-semibold">Target Customer Type</Label>
          <Input placeholder="e.g. Marketing managers at B2B SaaS" className="mt-2 h-9" value={form.audience ?? ""} onChange={(e) => setField("audience", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Landing Page URL *</Label>
        <Input placeholder="https://yoursite.com/lp/offer" className="mt-2 h-9 font-mono text-xs" value={form.landingPage ?? ""} onChange={(e) => setField("landingPage", e.target.value)} />
      </div>
      <div>
        <Label className="text-sm font-semibold">Exclusions or Restrictions</Label>
        <Input placeholder="e.g. No students, no job seekers, no free plans" className="mt-2 h-9" value={form.exclusions ?? ""} onChange={(e) => setField("exclusions", e.target.value)} />
      </div>
    </div>
  );
}

const ALL_PLATFORMS: Platform[] = ["Google Ads", "Microsoft Advertising", "Baidu", "Naver", "Yahoo Japan"];

function PlatformsBudgetStep({ form, setField }: { form: any; setField: (k: string, v: any) => void }) {
  const selectedPlatforms: Platform[] = form.platforms ?? ["Google Ads", "Microsoft Advertising"];
  const totalBudget = Number(form.totalBudget ?? 0);

  const PLATFORM_SPLITS: Record<Platform, number> = {
    "Google Ads": 0.70, "Microsoft Advertising": 0.20, "Baidu": 0, "Naver": 0.10, "Yahoo Japan": 0,
  };

  const platformCards = [
    { platform: "Google Ads" as Platform, cpcRange: "$1.50 – $6.00", template: "Lead Gen Search", note: "Largest search volume in most markets." },
    { platform: "Microsoft Advertising" as Platform, cpcRange: "$0.90 – $4.00", template: "Brand + Non-Brand", note: "~15–20% lower CPCs than Google. Good for incremental reach." },
    { platform: "Baidu" as Platform, cpcRange: "¥2 – ¥15", template: "Brand Search (CN)", note: "China only. Requires Simplified Chinese keywords and a local licence." },
    { platform: "Naver" as Platform, cpcRange: "₩200 – ₩1,500", template: "Brand Search (KR)", note: "South Korea's dominant search engine. Separate keyword strategy." },
    { platform: "Yahoo Japan" as Platform, cpcRange: "—", template: "Coming Soon", note: "Integration planned for Q3. Pre-configure API credentials now." },
  ];

  const togglePlatform = (p: Platform) => {
    if (PLATFORM_STATUS[p] === "coming_soon") return;
    const current = form.platforms ?? ["Google Ads", "Microsoft Advertising"];
    setField("platforms", current.includes(p) ? current.filter((x: Platform) => x !== p) : [...current, p]);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">Platform Selection Mode</Label>
        <div className="flex gap-3 mt-2">
          {[["recommended", "Let SPARK recommend"], ["manual", "I'll choose manually"]].map(([v, l]) => (
            <button key={v} onClick={() => setField("platformMode", v)} className={`flex-1 p-3 rounded-xl border text-sm transition-all ${form.platformMode === v || (!form.platformMode && v === "recommended") ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Select Platforms</Label>
        <p className="text-xs text-muted-foreground">SPARK will create a separate plan for each platform. You control one unified budget.</p>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {platformCards.map(({ platform, cpcRange, template, note }) => {
            const isSelected = selectedPlatforms.includes(platform);
            const status = PLATFORM_STATUS[platform];
            const isComingSoon = status === "coming_soon";
            const allocatedBudget = totalBudget ? Math.round(totalBudget * PLATFORM_SPLITS[platform]) : null;

            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                disabled={isComingSoon}
                className={`text-left p-3.5 rounded-xl border transition-all ${isSelected ? `${PLATFORM_COLORS[platform]} border-opacity-60` : "border-border/50 hover:border-border"} ${isComingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {isSelected && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <span className="font-semibold text-sm text-foreground">{platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComingSoon && <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">Coming Soon</Badge>}
                    {!isComingSoon && status === "connected" && <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">Connected</Badge>}
                    {!isComingSoon && status === "disconnected" && <Badge variant="outline" className="text-xs border-border text-muted-foreground">Not Connected</Badge>}
                    {isSelected && allocatedBudget ? <span className="text-xs font-bold text-foreground">${allocatedBudget.toLocaleString()}/mo</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                  <span>Est. CPC: <span className="text-foreground">{cpcRange}</span></span>
                  <span>Template: <span className="text-foreground">{template}</span></span>
                  <span className="hidden sm:inline">{note}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Total Monthly Budget ($) *</Label>
          <Input placeholder="e.g. 15000" type="number" className="mt-2 h-9" value={form.totalBudget ?? ""} onChange={(e) => setField("totalBudget", e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-semibold">Duration</Label>
          <Select value={form.duration ?? "ongoing"} onValueChange={(v) => setField("duration", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="1_month">1 Month</SelectItem>
              <SelectItem value="3_months">3 Months</SelectItem>
              <SelectItem value="6_months">6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Budget Pacing Style</Label>
        <div className="flex gap-2 mt-2">
          {[["conservative", "Conservative", "Spend 80% of daily budget. Less risk."], ["balanced", "Balanced", "Standard Google pacing."], ["aggressive", "Aggressive", "Spend fully each day. Max reach."]].map(([v, l, desc]) => (
            <button key={v} onClick={() => setField("budgetStyle", v)} className={`flex-1 p-3 rounded-xl border text-xs text-left transition-all ${form.budgetStyle === v ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground"}`}>
              <p className={`font-semibold ${form.budgetStyle === v ? "text-primary" : ""}`}>{l}</p>
              <p className="mt-0.5 text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordsStep({ form, setField }: { form: any; setField: (k: string, v: any) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">What would your customers search for? *</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Describe it naturally. SPARK will generate keyword groups from your answer.</p>
        <Textarea placeholder="e.g. Marketing software that helps small teams run campaigns without needing to hire a big agency. People might search for alternatives to expensive tools like HubSpot or Marketo." value={form.searchIntent ?? ""} onChange={(e) => setField("searchIntent", e.target.value)} className="h-20 text-sm resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Brand Keywords</Label>
          <Textarea placeholder="spark ai, spark ai platform, spark marketing" value={form.brandKeywords ?? ""} onChange={(e) => setField("brandKeywords", e.target.value)} className="mt-2 h-20 font-mono text-xs resize-none" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Service / Product Keywords</Label>
          <Textarea placeholder="marketing automation software, ai campaign manager" value={form.serviceKeywords ?? ""} onChange={(e) => setField("serviceKeywords", e.target.value)} className="mt-2 h-20 font-mono text-xs resize-none" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Competitor Keywords</Label>
          <Textarea placeholder="hubspot alternative, marketo pricing" value={form.competitorKeywords ?? ""} onChange={(e) => setField("competitorKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none" />
        </div>
        <div>
          <Label className="text-sm font-semibold text-red-400">Negative Keywords <span className="text-muted-foreground font-normal">(important!)</span></Label>
          <Textarea placeholder="free, tutorial, open source, jobs, reddit" value={form.negativeKeywords ?? ""} onChange={(e) => setField("negativeKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none border-red-500/20" />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Default Match Type</Label>
        <div className="flex gap-2 mt-2">
          {[["exact", "Exact Match", "Precise, lower volume, higher intent"],
            ["phrase", "Phrase Match", "Balanced — recommended for most campaigns"],
            ["broad", "Broad Match", "High reach, needs strong negatives"]].map(([v, l, desc]) => (
            <button key={v} onClick={() => setField("matchType", v)} className={`flex-1 p-3 rounded-xl border text-xs text-left transition-all ${form.matchType === v ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground"}`}>
              <p className={`font-semibold ${form.matchType === v ? "text-primary" : ""}`}>{l}</p>
              <p className="mt-0.5 text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} /> Advanced: Location Keywords & Platform-Specific Notes
      </button>
      {showAdvanced && (
        <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3">
          <div><Label className="text-xs">Location Intent Keywords</Label><Input placeholder="e.g. marketing agency singapore, crm software australia" className="mt-1 h-8 font-mono text-xs" /></div>
          <p className="text-xs text-muted-foreground"><span className="text-primary font-medium">Platform note:</span> Baidu and Naver require platform-specific keyword strategies. SPARK will generate Simplified Chinese and Korean keyword suggestions after you complete this step.</p>
        </div>
      )}
    </div>
  );
}

function AdsTrackingStep({ form, setField }: { form: any; setField: (k: string, v: any) => void }) {
  const [regenerating, setRegenerating] = useState(false);
  const mockHeadlines = [
    form.product?.split(" ").slice(0, 3).join(" ") || "SPARK AI",
    "AI-Powered Campaign Manager",
    form.offer || "Free 14-Day Trial",
    "Replace Your Marketing Agency",
    "Plan. Launch. Optimise. With AI.",
  ];
  const mockDescs = [
    `${form.product ? form.product.slice(0, 60) + "…" : "AI marketing platform"} No expertise required.`,
    `${form.offer || "Start free today"}. Connect ${(form.platforms ?? ["Google Ads"]).join(", ")} from one command centre.`,
  ];

  const regen = async () => { setRegenerating(true); await new Promise((r) => setTimeout(r, 900)); setRegenerating(false); };

  const trackingChecklist = [
    { label: "Landing page URL", done: !!form.landingPage },
    { label: "GA4 conversion event", done: !!(form.ga4Event ?? true) },
    { label: "UTM tagging template", done: !!(form.landingPage) },
    { label: "CRM lead source mapping", done: false },
    { label: "Call tracking", done: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label className="text-sm font-semibold">Generated Ad Copy</Label>
            <p className="text-xs text-muted-foreground">Based on your goal, offer, and keywords</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={regen} disabled={regenerating}>
            {regenerating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate
          </Button>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Headlines (up to 15, shown in rotation)</p>
            <div className="flex flex-wrap gap-1.5">
              {mockHeadlines.map((h, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">{h}</span>)}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Descriptions</p>
            {mockDescs.map((d, i) => <p key={i} className="text-xs bg-muted/20 border border-border/30 rounded px-3 py-2 mb-1.5">{d}</p>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[["Sitelinks", "3 sitelinks generated"], ["Callout Extensions", "5 callouts generated"], ["Structured Snippets", "Placeholder — configure after launch"], ["CTA Suggestion", form.offer || "Start Free Trial"]].map(([label, value]) => (
          <div key={label} className="p-3 rounded-xl border border-border/40 bg-card/40">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <Separator className="bg-border/40" />

      <div>
        <Label className="text-sm font-semibold">Tracking Checklist</Label>
        <div className="mt-3 space-y-2">
          {trackingChecklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done
                ? <CheckCircle size={15} className="text-green-400 shrink-0" />
                : <XCircle size={15} className="text-muted-foreground shrink-0" />}
              <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
              {!item.done && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 ml-auto">Needed before launch</Badge>}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Label className="text-xs">GA4 Conversion Event</Label>
          <Input placeholder="e.g. generate_lead" className="mt-1 h-8 font-mono text-xs" value={form.ga4Event ?? "generate_lead"} onChange={(e) => setField("ga4Event", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: any }) {
  const selectedPlatforms: Platform[] = form.platforms ?? ["Google Ads", "Microsoft Advertising"];
  const budget = Number(form.totalBudget ?? 0);
  const SPLITS: Record<Platform, number> = { "Google Ads": 0.70, "Microsoft Advertising": 0.20, "Baidu": 0.05, "Naver": 0.05, "Yahoo Japan": 0 };

  const approvals = [
    { label: "Budget Approval", done: false },
    { label: "Keyword Approval", done: !!(form.brandKeywords || form.serviceKeywords) },
    { label: "Ad Copy Approval", done: !!(form.product) },
    { label: "Tracking Approval", done: !!(form.landingPage && form.ga4Event) },
    { label: "Launch Approval", done: false },
  ];

  const score = Math.round((approvals.filter((a) => a.done).length / approvals.length) * 100);

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Campaign Summary</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Launch Readiness</span>
            <span className={`text-sm font-bold ${score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
          </div>
        </div>
        <Progress value={score} className="h-2" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-muted-foreground">Primary Goal</p><p className="font-medium">{form.primaryGoal ? GOAL_LABELS[form.primaryGoal as PrimaryGoal] : "—"}</p></div>
          <div><p className="text-muted-foreground">Urgency</p><p className="font-medium capitalize">{form.urgency ?? "Normal"}</p></div>
          <div><p className="text-muted-foreground">Geography</p><p className="font-medium">{form.geography ?? "—"}</p></div>
          <div><p className="text-muted-foreground">Monthly Budget</p><p className="font-medium">{budget ? `$${budget.toLocaleString()}` : "—"}</p></div>
          <div><p className="text-muted-foreground">Match Type</p><p className="font-medium capitalize">{form.matchType ?? "Phrase"}</p></div>
          <div><p className="text-muted-foreground">Pacing Style</p><p className="font-medium capitalize">{form.budgetStyle ?? "Balanced"}</p></div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Platform Campaign Plans</p>
        <div className="space-y-2">
          {selectedPlatforms.map((p) => (
            <div key={p} className={`flex items-center justify-between p-3 rounded-xl border ${PLATFORM_COLORS[p]}`}>
              <div>
                <p className="font-medium text-sm">{p}</p>
                <p className="text-xs text-muted-foreground">{budget ? `$${Math.round(budget * SPLITS[p]).toLocaleString()}/month allocated` : "Budget TBD"} · {PLATFORM_STATUS[p] === "connected" ? "Ready to draft" : "Account not connected"}</p>
              </div>
              <Badge variant="outline" className={`text-xs ${PLATFORM_STATUS[p] === "connected" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>
                {PLATFORM_STATUS[p] === "connected" ? "Ready" : "Not Connected"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Approval Checklist</p>
        <div className="space-y-2">
          {approvals.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done ? <CheckCircle size={15} className="text-green-400 shrink-0" /> : <XCircle size={15} className="text-muted-foreground shrink-0" />}
              <span className={`text-sm ${item.done ? "" : "text-muted-foreground"}`}>{item.label}</span>
              {!item.done && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 ml-auto">Required</Badge>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" size="sm" className="gap-1.5"><FileText size={13} /> Save Draft</Button>
        <Button variant="outline" size="sm" className="gap-1.5"><Shield size={13} /> Request Approval</Button>
        <Button variant="outline" size="sm" className="gap-1.5"><Play size={13} /> Create Platform Drafts</Button>
        <Button size="sm" className="gap-1.5"><Rocket size={13} /> Simulate Launch</Button>
      </div>
    </div>
  );
}

// ─── Guided Wizard Modal ──────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: "Goal", icon: <Target size={13} /> },
  { label: "Offer & Audience", icon: <Users size={13} /> },
  { label: "Platforms & Budget", icon: <DollarSign size={13} /> },
  { label: "Keywords", icon: <Search size={13} /> },
  { label: "Ads & Tracking", icon: <Wand2 size={13} /> },
  { label: "Review", icon: <CheckCircle size={13} /> },
];

function GuidedWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setFormState] = useState<Record<string, any>>({
    primaryGoal: "", urgency: "normal", platforms: ["Google Ads", "Microsoft Advertising"],
    matchType: "phrase", budgetStyle: "balanced", platformMode: "recommended",
  });
  const setField = (key: string, value: any) => setFormState((f) => ({ ...f, [key]: value }));

  const pct = Math.round(((step + 1) / WIZARD_STEPS.length) * 100);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1300));
    setSaving(false);
    toast({ title: "Campaign saved as draft", description: "Your SPARK Paid Search Campaign plan has been saved." });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <GoalStep form={form} setField={setField} />;
      case 1: return <OfferAudienceStep form={form} setField={setField} />;
      case 2: return <PlatformsBudgetStep form={form} setField={setField} />;
      case 3: return <KeywordsStep form={form} setField={setField} />;
      case 4: return <AdsTrackingStep form={form} setField={setField} />;
      case 5: return <ReviewStep form={form} />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-card/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MonitorPlay size={14} className="text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Guided Campaign Wizard</p>
                <p className="text-xs text-muted-foreground">Step {step + 1} of {WIZARD_STEPS.length}: <span className="text-foreground">{WIZARD_STEPS[step].label}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{pct}% complete</span>
            </div>
          </div>
          <Progress value={pct} className="h-1.5 mb-3" />
          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body — two column */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: form */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStep()}
          </div>
          {/* Right: brain */}
          <div className="w-72 shrink-0 border-l border-border/50 bg-card/40 p-5 overflow-y-auto hidden lg:flex flex-col">
            <SparkBrainPanel step={step} form={form} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 px-6 py-4 bg-card/60 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="gap-1.5">
            <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Draft saved" })}><FileText size={13} /> Save Draft</Button>
            {step < WIZARD_STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1.5">
                Next Step <ChevronRight size={14} />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                {saving ? "Saving…" : "Create Campaign Plan"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Campaign Table ───────────────────────────────────────────────────────────

function CampaignTable({ campaigns, onEdit }: { campaigns: SparkCampaign[]; onEdit: (c: SparkCampaign) => void }) {
  const [filter, setFilter] = useState("");
  const filtered = campaigns.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search campaigns…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Filter size={11} /> Filter</Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download size={11} /> Export</Button>
      </div>
      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  {["Campaign", "Platforms", "Goal", "Status", "Budget", "Spend", "CPC", "Conv.", "CPL", "Tracking", "SPARK Recommendation", "Approval", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const budgetPct = c.budget ? Math.round((c.spend / c.budget) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-card/60 group" data-testid={`campaign-row-${c.id}`}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.owner}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.platforms.map((p) => <PlatformChip key={p} platform={p} />)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">{GOAL_LABELS[c.goal]}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs border-0 ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium">${c.budget.toLocaleString()}</p>
                        {c.spend > 0 && (
                          <div className="mt-1 h-1 w-14 bg-muted/40 rounded-full">
                            <div className={`h-full rounded-full ${budgetPct > 90 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-right">{c.spend > 0 ? `$${c.spend.toLocaleString()}` : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right">{c.avgCpc > 0 ? `$${c.avgCpc}` : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right font-medium text-primary">{c.conversions > 0 ? c.conversions : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</td>
                      <td className="px-3 py-3"><TrackingBadge status={c.trackingStatus} /></td>
                      <td className="px-3 py-3 min-w-[200px]">
                        <p className="text-xs text-primary flex items-center gap-1"><Zap size={10} />{c.sparkRec}</p>
                      </td>
                      <td className="px-3 py-3"><ApprovalBadge status={c.approvalStatus} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="View"><Eye size={11} /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit" onClick={() => onEdit(c)}><Edit size={11} /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Optimise"><Zap size={11} /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="More"><MoreHorizontal size={11} /></Button>
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
  );
}

// ─── Keywords / Bidding / Accounts / Recs / Approvals / Reports (compact) ────

function QuickKeywordsTab() {
  const keywords = [
    { term: "marketing automation software", match: "Exact", cpc: 4.12, clicks: 312, conv: 28, quality: 8 },
    { term: "spark ai marketing", match: "Phrase", cpc: 1.82, clicks: 892, conv: 156, quality: 10 },
    { term: "hubspot alternative", match: "Exact", cpc: 6.21, clicks: 98, conv: 8, quality: 6 },
    { term: "ai campaign management", match: "Phrase", cpc: 3.44, clicks: 0, conv: 0, quality: 7 },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"><Wand2 size={12} /> AI Keyword Suggestions</Button>
        <Button size="sm" className="h-8 text-xs gap-1.5 ml-auto"><Plus size={12} /> Add Keywords</Button>
      </div>
      <Card className="border-border/60 bg-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["Keyword", "Match", "CPC", "Clicks", "Conv.", "Quality"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>{keywords.map((k, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-card/60">
                <td className="px-4 py-2.5 font-mono text-xs">{k.term}</td>
                <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{k.match}</Badge></td>
                <td className="px-4 py-2.5 text-right text-xs">${k.cpc}</td>
                <td className="px-4 py-2.5 text-right text-xs">{k.clicks || "—"}</td>
                <td className="px-4 py-2.5 text-right text-xs font-medium text-primary">{k.conv || "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5"><div className="w-14 h-1.5 bg-muted/40 rounded-full"><div className={`h-full rounded-full ${k.quality >= 8 ? "bg-green-400" : k.quality >= 6 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${k.quality * 10}%` }} /></div><span className="text-xs">{k.quality}/10</span></div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-red-400 mb-2">Negative Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {["free", "open source", "tutorial", "reddit", "jobs", "career", "how to", "youtube"].map((n) => (
              <Badge key={n} variant="outline" className="text-xs border-red-500/30 text-red-300 bg-red-500/10 gap-1"><XCircle size={9} />{n}</Badge>
            ))}
            <Button size="sm" variant="ghost" className="h-5 px-2 text-xs text-muted-foreground"><Plus size={9} /> Add</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickRecsTab() {
  const recs = [
    { type: "Negative Keyword", priority: "high", title: "Add 14 negative keywords to cut ~$1,840 wasted spend", campaign: "Non-Brand — Singapore SMEs" },
    { type: "Budget", priority: "high", title: "Shift $3k from Competitor Conquest (1.8x ROAS) → Brand (6.1x ROAS)", campaign: "Global" },
    { type: "Tracking", priority: "high", title: "Fix missing GA4 conversion event on Enterprise Lead Gen before launch", campaign: "Enterprise Lead Gen" },
    { type: "Ad Copy", priority: "medium", title: "Generate new headlines for Competitor Conquest (CTR only 1.9%)", campaign: "Competitor Conquest — SEMrush" },
    { type: "Keyword", priority: "low", title: "Create HubSpot competitor campaign — 22K APAC searches/mo", campaign: "Suggested new" },
  ];
  const priorityStyle: Record<string, string> = { high: "border-red-500/30 bg-red-500/5", medium: "border-amber-500/30 bg-amber-500/5", low: "border-border/60 bg-card" };
  return (
    <div className="space-y-3">
      {recs.map((r, i) => (
        <Card key={i} className={`border ${priorityStyle[r.priority]}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs border-0 bg-primary/15 text-primary">{r.type}</Badge>
                <Badge variant="outline" className={`text-xs ${r.priority === "high" ? "border-red-500/30 text-red-300" : r.priority === "medium" ? "border-amber-500/30 text-amber-300" : "border-border text-muted-foreground"}`}>{r.priority}</Badge>
                <span className="text-xs text-muted-foreground">· {r.campaign}</span>
              </div>
              <p className="text-sm font-medium">{r.title}</p>
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

// ─── Main PPC Component ───────────────────────────────────────────────────────

export default function PPC() {
  const [campaigns] = useState<SparkCampaign[]>(MOCK_CAMPAIGNS);
  const [showGuided, setShowGuided] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "optimising").length;
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok").length;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-ppc">
          <MonitorPlay size={20} className="text-primary" /> PPC / Paid Search Workbench
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Plan, connect, launch, optimise, and report on paid search campaigns across Google, Bing, Baidu, Naver, and other search ad platforms.</p>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Campaigns", value: activeCampaigns, icon: <Play size={13} className="text-primary" />, color: "text-primary" },
          { label: "Monthly Spend", value: `$${(totalSpend / 1000).toFixed(1)}k`, icon: <DollarSign size={13} className="text-amber-400" />, color: "text-amber-400" },
          { label: "Budget Remaining", value: `$${((totalBudget - totalSpend) / 1000).toFixed(1)}k`, icon: <TrendingUp size={13} className="text-green-400" />, color: "text-green-400" },
          { label: "Tracking Issues", value: trackingIssues, icon: <AlertCircle size={13} className={trackingIssues > 0 ? "text-red-400" : "text-green-400"} />, color: trackingIssues > 0 ? "text-red-400" : "text-green-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">{kpi.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three hero action cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/60 transition-colors cursor-pointer group" onClick={() => setShowGuided(true)} data-testid="card-guided-wizard">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
              <Star size={18} className="text-primary" />
            </div>
            <p className="font-bold text-base mb-1">Guided Campaign Wizard</p>
            <p className="text-sm text-muted-foreground flex-1">Let SPARK guide you from business goal to a complete paid search campaign plan — no PPC expertise required.</p>
            <Button className="mt-5 gap-1.5 w-full" onClick={() => setShowGuided(true)}>
              <Sparkles size={14} /> Start Guided Campaign
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card hover:border-border transition-colors" data-testid="card-advanced-setup">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
              <Settings size={18} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-base mb-1">Advanced Campaign Setup</p>
            <p className="text-sm text-muted-foreground flex-1">Build a search campaign with full control over keywords, match types, bids, ad copy, extensions, and conversion tracking.</p>
            <Button variant="outline" className="mt-5 gap-1.5 w-full" onClick={() => setShowAdvanced(true)}>
              <Plus size={14} /> Create Advanced Campaign
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card hover:border-border transition-colors" data-testid="card-import">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
              <Upload size={18} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-base mb-1">Import & Optimise Existing Campaigns</p>
            <p className="text-sm text-muted-foreground flex-1">Connect your search ad account and let SPARK find what to fix, pause, scale, or rewrite across your existing campaigns.</p>
            <Button variant="outline" className="mt-5 gap-1.5 w-full" onClick={() => toast({ title: "Import started", description: "Syncing connected search ad accounts…" })}>
              <RefreshCw size={14} /> Import Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="campaigns">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-0.5 p-1">
          {[["campaigns", "Search Campaigns"], ["keywords", "Keywords"], ["recommendations", "AI Recommendations"], ["approvals", "Approvals"], ["reports", "Reports"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="text-xs" data-testid={`tab-${v}`}>{l}</TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="campaigns">
            <div className="mb-3">
              <p className="text-sm font-semibold">Existing Search Campaigns</p>
              <p className="text-xs text-muted-foreground">Each SPARK campaign can run across multiple search platforms. Click a campaign to view its platform-specific plans.</p>
            </div>
            <CampaignTable campaigns={campaigns} onEdit={() => setShowGuided(true)} />
          </TabsContent>
          <TabsContent value="keywords"><QuickKeywordsTab /></TabsContent>
          <TabsContent value="recommendations"><QuickRecsTab /></TabsContent>
          <TabsContent value="approvals">
            <div className="space-y-3">
              {[
                { title: "Budget approval — Enterprise Lead Gen", type: "Budget", amount: "$18,000/mo", by: "Sarah Park", time: "2h ago", urgency: "high" },
                { title: "Keyword approval — Baidu China Expansion", type: "Keyword", amount: "142 keywords", by: "Priya Sharma", time: "4h ago", urgency: "medium" },
                { title: "Ad copy approval — Competitor Conquest v2", type: "Ad Copy", amount: "6 variants", by: "David Lee", time: "Yesterday", urgency: "medium" },
              ].map((item, i) => (
                <Card key={i} className={`border-border/60 bg-card ${item.urgency === "high" ? "border-amber-500/30" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{item.type}</Badge>
                        {item.urgency === "high" && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Urgent</Badge>}
                      </div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.amount} · by {item.by} · {item.time}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-300">Reject</Button>
                      <Button size="sm" className="h-7 text-xs gap-1"><CheckCircle size={11} /> Approve</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reports">
            <div className="grid md:grid-cols-3 gap-4">
              {["Campaign Performance Summary", "Platform Comparison (Google vs Bing)", "Keyword Performance", "Budget Pacing", "Lead Quality & CRM Attribution", "AI Executive Summary"].map((r, i) => (
                <Card key={i} className="border-border/60 bg-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText size={14} className="text-primary" /></div>
                    <p className="text-sm font-semibold">{r}</p>
                    <div className="flex gap-2"><Button size="sm" variant="outline" className="h-7 text-xs flex-1 gap-1"><Eye size={11} /> View</Button><Button size="sm" variant="ghost" className="h-7 px-2"><Download size={11} /></Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <GuidedWizard open={showGuided} onClose={() => setShowGuided(false)} />

      {/* Advanced dialog placeholder */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Advanced Campaign Setup</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The advanced 9-step campaign builder gives you full control over every PPC setting. Use this if you're an experienced PPC manager who wants to configure keywords, match types, bids, and tracking manually.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdvanced(false)}>Cancel</Button>
            <Button className="flex-1 gap-1.5" onClick={() => { setShowAdvanced(false); setShowGuided(true); }}>
              <Sparkles size={13} /> Use Guided Wizard Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
