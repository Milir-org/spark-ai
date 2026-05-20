import { useState, useEffect, useCallback } from "react";
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
import {
  MonitorPlay, Plus, Upload, RefreshCw, Wand2, CheckCircle, XCircle,
  AlertCircle, Clock, Loader2, ChevronRight, ChevronLeft, Search, Target,
  DollarSign, BarChart2, Zap, Shield, Globe, FileText, Settings,
  MoreHorizontal, Edit, Play, Eye, Brain, Lightbulb, Sparkles,
  TrendingUp, ChevronDown, Download, Filter, Users, Rocket, Star,
  Tag, StickyNote, Link2, RotateCcw, ThumbsUp, ThumbsDown, Hash,
  MapPin, Building2, BookOpen, AlertTriangle, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "data_check" | "approval" | "live" | "optimising" | "paused" | "reporting";
type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver" | "Yahoo Japan";
type PrimaryGoal = "leads" | "sales" | "bookings" | "traffic" | "brand_protection" | "competitor_conquest" | "local_enquiries";
type WizardMode = "create" | "edit" | "resume";

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
  description?: string;
  tags?: string[];
}

interface SuggestedKeyword {
  id: number;
  term: string;
  group: "Brand" | "High Intent" | "Product / Service" | "Local Intent" | "Competitor" | "Informational";
  matchType: "Exact" | "Phrase" | "Broad";
  cpcRange: string;
  competition: "Low" | "Medium" | "High";
  platforms: string[];
  accepted: boolean | null; // null = undecided
}

interface WizardForm {
  // Step 1: Basics
  campaignName: string;
  campaignDescription: string;
  campaignSource: string;
  parentCampaign: string;
  campaignOwner: string;
  tags: string[];
  internalNotes: string;
  // Step 2: Goal
  primaryGoal: string;
  secondaryGoals: string[];
  urgency: string;
  maxCpl: string;
  maxDaily: string;
  locationRestrictions: string;
  // Step 3: Offer & Audience
  product: string;
  offer: string;
  geography: string;
  audience: string;
  landingPage: string;
  exclusions: string;
  // Step 4: Platforms & Budget
  platforms: Platform[];
  platformMode: string;
  totalBudget: string;
  duration: string;
  budgetStyle: string;
  // Step 5: Keywords
  searchIntent: string;
  brandKeywords: string;
  serviceKeywords: string;
  competitorKeywords: string;
  negativeKeywords: string;
  matchType: string;
  acceptedKeywords: SuggestedKeyword[];
  // Step 6: Ads
  headline1: string;
  headline2: string;
  headline3: string;
  desc1: string;
  desc2: string;
  ga4Event: string;
  // Step 7: Launch
  launchDate: string;
  approvers: string;
  // Meta
  draftStep: number;
}

// ─── Initial State ────────────────────────────────────────────────────────────

function getInitialWizardForm(mode: WizardMode, campaign?: SparkCampaign | null): WizardForm {
  if (mode === "create" || !campaign) {
    return {
      campaignName: "", campaignDescription: "", campaignSource: "guided",
      parentCampaign: "", campaignOwner: "Alex Chen", tags: [], internalNotes: "",
      primaryGoal: "", secondaryGoals: [], urgency: "normal",
      maxCpl: "", maxDaily: "", locationRestrictions: "",
      product: "", offer: "", geography: "", audience: "", landingPage: "", exclusions: "",
      platforms: ["Google Ads", "Microsoft Advertising"], platformMode: "recommended",
      totalBudget: "", duration: "ongoing", budgetStyle: "balanced",
      searchIntent: "", brandKeywords: "", serviceKeywords: "", competitorKeywords: "",
      negativeKeywords: "", matchType: "phrase", acceptedKeywords: [],
      headline1: "", headline2: "", headline3: "", desc1: "", desc2: "",
      ga4Event: "generate_lead", launchDate: "", approvers: "", draftStep: 0,
    };
  }
  // edit / resume — pre-fill from campaign
  return {
    campaignName: campaign.name, campaignDescription: campaign.description ?? "",
    campaignSource: "guided", parentCampaign: "", campaignOwner: campaign.owner,
    tags: campaign.tags ?? [], internalNotes: "",
    primaryGoal: campaign.goal, secondaryGoals: [], urgency: "normal",
    maxCpl: "", maxDaily: "", locationRestrictions: "",
    product: "SPARK AI — AI-powered marketing platform",
    offer: "Free 14-day trial", geography: "Singapore, Malaysia, Australia",
    audience: "Marketing managers at B2B SaaS companies",
    landingPage: "https://sparkapp.io/lp/trial", exclusions: "",
    platforms: campaign.platforms, platformMode: "recommended",
    totalBudget: campaign.budget.toString(), duration: "ongoing", budgetStyle: "balanced",
    searchIntent: "Marketing software for teams who want to replace agencies",
    brandKeywords: "spark ai, spark ai platform", serviceKeywords: "marketing automation software",
    competitorKeywords: "hubspot alternative", negativeKeywords: "free, tutorial, jobs",
    matchType: "phrase", acceptedKeywords: [],
    headline1: "SPARK AI — Marketing Suite", headline2: "AI-Powered Campaign Manager",
    headline3: "Free 14-Day Trial", desc1: "Plan, launch, optimise with AI.",
    desc2: "Connect all your channels from one platform.", ga4Event: "generate_lead",
    launchDate: "", approvers: campaign.owner, draftStep: mode === "resume" ? 3 : 0,
  };
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
  "Google Ads": "connected", "Microsoft Advertising": "connected",
  "Baidu": "disconnected", "Naver": "disconnected", "Yahoo Japan": "coming_soon",
};

const GOAL_LABELS: Record<string, string> = {
  leads: "Generate Leads", sales: "Drive Sales", bookings: "Book Appointments",
  traffic: "Website Traffic", brand_protection: "Brand Protection",
  competitor_conquest: "Competitor Conquest", local_enquiries: "Local Enquiries",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-muted/50 text-muted-foreground", data_check: "bg-amber-500/15 text-amber-300",
  approval: "bg-orange-500/15 text-orange-300", live: "bg-green-500/15 text-green-300",
  optimising: "bg-emerald-500/15 text-emerald-300", paused: "bg-muted/50 text-muted-foreground",
  reporting: "bg-indigo-500/15 text-indigo-300",
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft", data_check: "Data Check", approval: "Awaiting Approval",
  live: "Live", optimising: "Optimising", paused: "Paused", reporting: "Reporting",
};

const TAG_OPTIONS = ["Q2 Growth", "Singapore SMEs", "High Intent", "Urgent Push", "Board Approved", "Budget Sensitive", "Test Campaign"];

const TAG_COLORS: Record<string, string> = {
  "Q2 Growth": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Singapore SMEs": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "High Intent": "bg-green-500/15 text-green-300 border-green-500/30",
  "Urgent Push": "bg-red-500/15 text-red-300 border-red-500/30",
  "Board Approved": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Budget Sensitive": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Test Campaign": "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: SparkCampaign[] = [
  { id: 1, name: "Brand Awareness — APAC Q2", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "live", budget: 15000, spend: 12400, avgCpc: 1.82, conversions: 312, cpl: 39.74, trackingStatus: "ok", sparkRec: "Raise bids on top 3 brand terms — ROAS is 6.1x", approvalStatus: "approved", owner: "Alex Chen", tags: ["Q2 Growth", "Board Approved"] },
  { id: 2, name: "Non-Brand Search — Singapore SMEs", platforms: ["Google Ads"], goal: "leads", status: "optimising", budget: 22000, spend: 18900, avgCpc: 3.91, conversions: 247, cpl: 76.52, trackingStatus: "ok", sparkRec: "Add 14 negative keywords to cut wasted spend by ~$1,840", approvalStatus: "approved", owner: "Sarah Park", tags: ["Singapore SMEs", "High Intent"] },
  { id: 3, name: "Competitor Conquest — SEMrush", platforms: ["Google Ads"], goal: "competitor_conquest", status: "live", budget: 9000, spend: 8200, avgCpc: 5.12, conversions: 58, cpl: 141.38, trackingStatus: "warning", sparkRec: "Pause low-conv. ad group — CPA is 2× target", approvalStatus: "approved", owner: "Alex Chen", tags: ["Urgent Push"] },
  { id: 4, name: "Enterprise Lead Gen", platforms: ["Google Ads", "Microsoft Advertising"], goal: "leads", status: "approval", budget: 18000, spend: 0, avgCpc: 0, conversions: 0, cpl: 0, trackingStatus: "warning", sparkRec: "Awaiting budget approval before launch", approvalStatus: "pending", owner: "Sarah Park", tags: ["High Intent"] },
  { id: 5, name: "Baidu China Expansion", platforms: ["Baidu"], goal: "brand_protection", status: "data_check", budget: 12000, spend: 0, avgCpc: 0, conversions: 0, cpl: 0, trackingStatus: "error", sparkRec: "Localise keywords to Simplified Chinese before proceeding", approvalStatus: "not_required", owner: "Priya Sharma", tags: ["Test Campaign"] },
];

// ─── Keyword generation mock ──────────────────────────────────────────────────

function generateMockKeywords(form: WizardForm): SuggestedKeyword[] {
  const productWord = form.product?.split(" ")[0] || "marketing";
  const goal = GOAL_LABELS[form.primaryGoal] || "leads";
  let id = 1;
  return [
    { id: id++, term: `${productWord.toLowerCase()} software`, group: "Product / Service", matchType: "Exact", cpcRange: "$3.50–$6.00", competition: "High", platforms: ["Google Ads", "Microsoft Advertising"], accepted: null },
    { id: id++, term: "ai marketing platform", group: "Product / Service", matchType: "Exact", cpcRange: "$4.00–$7.50", competition: "High", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: "marketing automation software", group: "High Intent", matchType: "Exact", cpcRange: "$3.80–$6.20", competition: "High", platforms: ["Google Ads", "Microsoft Advertising"], accepted: null },
    { id: id++, term: `best ${productWord.toLowerCase()} tool`, group: "High Intent", matchType: "Phrase", cpcRange: "$2.80–$5.00", competition: "Medium", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: "spark ai", group: "Brand", matchType: "Exact", cpcRange: "$0.80–$1.50", competition: "Low", platforms: ["Google Ads", "Microsoft Advertising"], accepted: null },
    { id: id++, term: "spark ai marketing", group: "Brand", matchType: "Phrase", cpcRange: "$0.90–$1.80", competition: "Low", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: "hubspot alternative", group: "Competitor", matchType: "Exact", cpcRange: "$5.50–$9.00", competition: "High", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: "marketo pricing", group: "Competitor", matchType: "Phrase", cpcRange: "$4.00–$7.00", competition: "High", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: form.geography ? `marketing software ${form.geography.split(",")[0].trim().toLowerCase()}` : "marketing software singapore", group: "Local Intent", matchType: "Phrase", cpcRange: "$2.00–$3.80", competition: "Medium", platforms: ["Google Ads"], accepted: null },
    { id: id++, term: "what is marketing automation", group: "Informational", matchType: "Broad", cpcRange: "$0.80–$1.50", competition: "Low", platforms: ["Google Ads"], accepted: null },
  ];
}

const NEGATIVE_SUGGESTIONS = [
  "free", "open source", "jobs", "salary", "template", "tutorial", "course",
  "examples", "DIY", "cheap", "review", "reddit", "youtube", "how to", "certification",
];

// ─── Utility Components ───────────────────────────────────────────────────────

function PlatformChip({ platform }: { platform: Platform }) {
  return <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PLATFORM_COLORS[platform]}`}>{platform === "Microsoft Advertising" ? "Bing" : platform.split(" ")[0]}</span>;
}

function TrackingBadge({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") return <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} />OK</span>;
  if (status === "warning") return <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle size={11} />Warning</span>;
  return <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={11} />Error</span>;
}

function ApprovalBadge({ status }: { status: SparkCampaign["approvalStatus"] }) {
  const cfg: Record<string, string> = { approved: "text-green-300 border-green-500/30", pending: "text-amber-300 border-amber-500/30", not_required: "text-muted-foreground border-border", rejected: "text-red-300 border-red-500/30" };
  const label: Record<string, string> = { approved: "Approved", pending: "Pending", not_required: "—", rejected: "Rejected" };
  return <Badge variant="outline" className={`text-xs ${cfg[status]}`}>{label[status]}</Badge>;
}

// ─── SPARK Brain (Action-Oriented) ────────────────────────────────────────────

interface BrainAction { label: string; onClick: () => void; }

interface BrainContent {
  headline: string;
  summary?: string;
  bullets: string[];
  warnings?: string[];
  tip?: string;
  actions?: BrainAction[];
}

function getBrainContent(step: number, form: WizardForm, brainCallbacks: Record<string, () => void>): BrainContent {
  switch (step) {
    case 0: return {
      headline: "Campaign Basics",
      summary: form.campaignName ? `Campaign: "${form.campaignName}"` : undefined,
      bullets: [
        form.campaignName ? `Name set. SPARK will use this to label platform-specific plans.` : "Give your campaign a clear name so team members can identify it at a glance.",
        "The campaign source tells SPARK how this campaign was created and how it relates to your marketing plan.",
        "Marketing tags help filter and report across campaigns.",
        "Internal notes are only visible inside SPARK — great for approver context.",
      ],
      actions: [
        { label: "Suggest campaign name", onClick: brainCallbacks.suggestName },
        { label: "Improve description", onClick: brainCallbacks.improveDesc },
      ],
      tip: "A good campaign name includes the goal, audience, and platform or region — e.g. 'Brand Search — APAC Q2'.",
    };
    case 1: return {
      headline: "Setting Your Campaign Goal",
      summary: form.primaryGoal ? `Primary goal: ${GOAL_LABELS[form.primaryGoal]}` : undefined,
      bullets: [
        form.primaryGoal ? `You've chosen: ${GOAL_LABELS[form.primaryGoal]}. SPARK will optimise bids and measurement for this outcome.` : "Choose a primary goal to continue — this drives everything.",
        "Secondary goals are tracked but don't control bidding.",
        "Guardrails prevent overspending and protect your CPL target.",
        form.urgency ? `Urgency set to: ${form.urgency}. ${form.urgency === "aggressive" ? "Full budget spend every day." : form.urgency === "test" ? "Low spend — learning mode." : "Standard pacing."}` : "",
      ].filter(Boolean),
      actions: [
        { label: "Recommend primary goal", onClick: brainCallbacks.recommendGoal },
        { label: "Add sensible guardrails", onClick: brainCallbacks.addGuardrails },
      ],
      tip: "Not sure? 'Generate Leads' is the most common goal for B2B paid search.",
    };
    case 2: return {
      headline: "Understanding Your Offer & Audience",
      summary: form.product ? `Promoting: ${form.product.slice(0, 50)}…` : undefined,
      bullets: [
        form.product ? `Product set. SPARK will use this for keyword and ad suggestions.` : "⚠ No product description yet — this is needed for keyword and copy generation.",
        form.landingPage ? `Landing page: ${form.landingPage}` : "⚠ No landing page — required before launch.",
        form.geography ? `Geography: ${form.geography}` : "Add a geography so SPARK can adjust keyword suggestions and platform targeting.",
      ],
      warnings: !form.product ? ["A vague or missing product description produces weaker keyword and ad copy suggestions."] : [],
      actions: [],
      tip: "The more specific your offer, the better SPARK's suggestions.",
    };
    case 3: return {
      headline: "Platform & Budget Recommendations",
      summary: form.totalBudget ? `$${Number(form.totalBudget).toLocaleString()}/month across ${form.platforms.length} platform(s)` : undefined,
      bullets: [
        "Google Ads: Largest volume. Recommended starting point.",
        "Microsoft Advertising: ~15–20% lower CPCs. Great for incremental reach.",
        form.totalBudget ? `SPARK suggests: ${Math.round(Number(form.totalBudget) * 0.70).toLocaleString()} Google / ${Math.round(Number(form.totalBudget) * 0.20).toLocaleString()} Bing as the starting split.` : "Set your budget to see the recommended split.",
        "Baidu / Naver require separate keyword strategies and account setup.",
      ],
      actions: [
        { label: "Recommend platform mix", onClick: brainCallbacks.recommendPlatforms },
        { label: "Allocate budget", onClick: brainCallbacks.allocateBudget },
      ],
      tip: "Start with Google + Bing. Add other platforms after 30 days of data.",
    };
    case 4: return {
      headline: "Keyword & Search Intent",
      summary: (() => {
        const kws = [form.brandKeywords, form.serviceKeywords, form.competitorKeywords].filter(Boolean).join(", ");
        return kws ? `Keywords entered: ${kws.split(",").filter(Boolean).length} terms` : undefined;
      })(),
      bullets: [
        "High-intent keywords cost more but convert better.",
        form.negativeKeywords ? `${form.negativeKeywords.split(",").filter(Boolean).length} negatives added. SPARK recommends 20–30 at launch.` : "⚠ No negative keywords — this is the #1 cause of wasted spend.",
        form.acceptedKeywords?.length ? `${form.acceptedKeywords.filter((k: SuggestedKeyword) => k.accepted).length} AI keyword suggestions accepted.` : "Click 'Suggest Keywords with AI' for SPARK-generated keyword groups.",
      ],
      warnings: !form.negativeKeywords ? ["Missing negative keywords is one of the most common causes of wasted paid search spend."] : [],
      actions: [
        { label: "Suggest keywords with AI", onClick: brainCallbacks.suggestKeywords },
        { label: "Suggest negative keywords", onClick: brainCallbacks.suggestNegatives },
        { label: "Estimate CPC / bid forecast", onClick: brainCallbacks.estimateCpc },
      ],
      tip: "Think about what your customers would NOT type — those are your negatives.",
    };
    case 5: return {
      headline: "Ad Copy & Extensions",
      summary: form.headline1 ? `Headlines ready: "${form.headline1}", "${form.headline2}"…` : undefined,
      bullets: [
        "Headlines must be under 30 characters each and include your keyword or offer.",
        "Descriptions should state the benefit and include a clear CTA.",
        "Sitelinks and callout extensions increase CTR by 10–20% on average.",
        form.ga4Event ? `GA4 event: ${form.ga4Event}` : "⚠ Set a GA4 conversion event before launch.",
      ],
      actions: [
        { label: "Generate ad copy", onClick: brainCallbacks.generateAdCopy },
        { label: "Generate extensions", onClick: brainCallbacks.generateExtensions },
      ],
      tip: "Write for your customer, not for the algorithm. Lead with your strongest benefit.",
    };
    case 6: return {
      headline: "Launch Plan",
      bullets: [
        "Set a launch date so approvers know the deadline.",
        "Add approvers who need to sign off on budget, keywords, and copy.",
        "SPARK will send approval reminders 48h before your target launch date.",
      ],
      actions: [
        { label: "Check launch readiness", onClick: brainCallbacks.checkReadiness },
      ],
      tip: "Do not launch without verified conversion tracking. Smart Bidding needs conversion data.",
    };
    case 7: return {
      headline: "Final Review",
      summary: form.campaignName ? `Reviewing: "${form.campaignName}"` : undefined,
      bullets: [
        "Review every section before requesting approval.",
        "Your Launch Readiness Score reflects how complete and risk-free the campaign is.",
        "Platform drafts can be created in SPARK first — live sync requires approval.",
      ],
      warnings: !form.landingPage || !form.ga4Event ? ["Do not launch without verified conversion tracking."] : [],
      tip: "Save Draft to keep working. Request Approval when ready to go live.",
    };
    default: return { headline: "SPARK Brain", bullets: [] };
  }
}

function SparkBrainPanel({ step, form, brainCallbacks }: { step: number; form: WizardForm; brainCallbacks: Record<string, () => void> }) {
  const content = getBrainContent(step, form, brainCallbacks);
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Brain size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary">SPARK Brain</p>
          <p className="text-xs text-muted-foreground">AI guidance</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="text-sm font-semibold mb-1">{content.headline}</p>
          {content.summary && (
            <p className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary mb-2">{content.summary}</p>
          )}
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
                <AlertTriangle size={11} className="shrink-0 mt-0.5" />{w}
              </div>
            ))}
          </div>
        )}

        {content.actions && content.actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
            {content.actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs text-primary transition-colors gap-2"
              >
                <span className="flex items-center gap-1.5"><Zap size={10} />{action.label}</span>
                <ArrowRight size={10} className="shrink-0" />
              </button>
            ))}
          </div>
        )}

        {content.tip && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs text-muted-foreground">
            <Lightbulb size={11} className="shrink-0 mt-0.5 text-amber-400" />
            <span>{content.tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Campaign Basics ──────────────────────────────────────────────────

function BasicsStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">Campaign Name <span className="text-red-400">*</span></Label>
        <Input
          placeholder="e.g. Brand Search — APAC Q2 2025"
          value={form.campaignName}
          onChange={(e) => setField("campaignName", e.target.value)}
          className="mt-2 h-9"
          data-testid="input-campaign-name"
        />
        <p className="text-xs text-muted-foreground mt-1">Include goal, audience, and region for clarity — e.g. "Lead Gen — Singapore SMEs — Q2"</p>
      </div>

      <div>
        <Label className="text-sm font-semibold">Campaign Description</Label>
        <Textarea
          placeholder="Briefly describe what this campaign is for and who approved it…"
          value={form.campaignDescription}
          onChange={(e) => setField("campaignDescription", e.target.value)}
          className="mt-2 h-20 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Campaign Source</Label>
          <Select value={form.campaignSource} onValueChange={(v) => setField("campaignSource", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="guided">New SPARK Guided Campaign</SelectItem>
              <SelectItem value="linked">Linked to Master Campaign</SelectItem>
              <SelectItem value="adhoc">Ad-hoc Campaign</SelectItem>
              <SelectItem value="imported">Imported from Ad Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Campaign Owner</Label>
          <Select value={form.campaignOwner} onValueChange={(v) => setField("campaignOwner", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Alex Chen", "Sarah Park", "James Wong", "Priya Sharma", "David Lee"].map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.campaignSource === "linked" && (
        <div>
          <Label className="text-sm font-semibold">Parent SPARK Campaign (Optional)</Label>
          <Select value={form.parentCampaign} onValueChange={(v) => setField("parentCampaign", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue placeholder="Select parent campaign…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="q2_growth">Q2 Growth Initiative</SelectItem>
              <SelectItem value="apac_expansion">APAC Market Expansion</SelectItem>
              <SelectItem value="brand_2025">Brand Refresh 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Marketing Tags</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Use tags to filter, group, and report across campaigns.</p>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => setField("tags", form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag])}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${form.tags.includes(tag) ? (TAG_COLORS[tag] ?? "bg-primary/15 text-primary border-primary/30") : "border-border/50 text-muted-foreground hover:border-border"}`}
            >{tag}</button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Internal Notes</Label>
        <Textarea
          placeholder="Notes for your team or approvers — not visible outside SPARK…"
          value={form.internalNotes}
          onChange={(e) => setField("internalNotes", e.target.value)}
          className="mt-2 h-16 text-sm resize-none text-muted-foreground"
        />
      </div>
    </div>
  );
}

// ─── Step 2: Goal ─────────────────────────────────────────────────────────────

function GoalStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const goals = Object.entries(GOAL_LABELS);
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">Primary Goal <span className="text-red-400">*</span></Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Pick one — this drives how SPARK optimises bids and measures success.</p>
        <div className="grid grid-cols-2 gap-2">
          {goals.map(([key, label]) => (
            <button key={key} onClick={() => setField("primaryGoal", key)} className={`text-left p-3 rounded-xl border text-sm transition-all ${form.primaryGoal === key ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px] shadow-primary/20" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"}`}>
              <p className="font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {form.primaryGoal && (
        <div>
          <Label className="text-sm font-semibold">Secondary Goals (optional)</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Tracked but don't control bidding.</p>
          <div className="flex flex-wrap gap-2">
            {goals.filter(([k]) => k !== form.primaryGoal).map(([key, label]) => (
              <button key={key} onClick={() => setField("secondaryGoals", form.secondaryGoals.includes(key) ? form.secondaryGoals.filter((g) => g !== key) : [...form.secondaryGoals, key])} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.secondaryGoals.includes(key) ? "border-primary/60 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}>{label}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Campaign Urgency</Label>
        <div className="flex gap-2 mt-2">
          {[["test", "Test", "Low spend — learn first"], ["normal", "Normal", "Standard pacing"], ["aggressive", "Aggressive", "Spend fully, maximise reach"]].map(([v, l, desc]) => (
            <button key={v} onClick={() => setField("urgency", v)} className={`flex-1 p-3 rounded-xl border text-left transition-all ${form.urgency === v ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground hover:border-border"}`}>
              <p className={`font-semibold text-sm ${form.urgency === v ? "text-primary" : ""}`}>{l}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} /> Advanced Guardrails
      </button>
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/40 bg-muted/10">
          <div><Label className="text-xs">Max CPL ($)</Label><Input placeholder="e.g. 120" type="number" className="mt-1 h-8" value={form.maxCpl} onChange={(e) => setField("maxCpl", e.target.value)} /></div>
          <div><Label className="text-xs">Max Daily Spend ($)</Label><Input placeholder="e.g. 500" type="number" className="mt-1 h-8" value={form.maxDaily} onChange={(e) => setField("maxDaily", e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Location Restrictions</Label><Input placeholder="e.g. Exclude: USA, UK" className="mt-1 h-8" value={form.locationRestrictions} onChange={(e) => setField("locationRestrictions", e.target.value)} /></div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Offer & Audience ─────────────────────────────────────────────────

function OfferAudienceStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">What are you promoting? <span className="text-red-400">*</span></Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Be specific — SPARK uses this to generate keywords and ad copy.</p>
        <Textarea placeholder="e.g. SPARK AI — an AI-powered marketing platform for B2B SaaS companies. Helps marketing managers plan and launch campaigns without needing an agency." value={form.product} onChange={(e) => setField("product", e.target.value)} className="h-24 text-sm resize-none" />
      </div>
      <div><Label className="text-sm font-semibold">Offer or Call-to-Action</Label><Input placeholder="e.g. Free 14-day trial, no credit card required" className="mt-2 h-9" value={form.offer} onChange={(e) => setField("offer", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-sm font-semibold">Target Geography <span className="text-red-400">*</span></Label><Input placeholder="e.g. Singapore, Malaysia, Australia" className="mt-2 h-9" value={form.geography} onChange={(e) => setField("geography", e.target.value)} /></div>
        <div><Label className="text-sm font-semibold">Target Customer Type</Label><Input placeholder="e.g. Marketing managers at B2B SaaS" className="mt-2 h-9" value={form.audience} onChange={(e) => setField("audience", e.target.value)} /></div>
      </div>
      <div><Label className="text-sm font-semibold">Landing Page URL <span className="text-red-400">*</span></Label><Input placeholder="https://yoursite.com/lp/offer" className="mt-2 h-9 font-mono text-xs" value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} /></div>
      <div><Label className="text-sm font-semibold">Exclusions or Restrictions</Label><Input placeholder="e.g. No students, no job seekers, no free plan users" className="mt-2 h-9" value={form.exclusions} onChange={(e) => setField("exclusions", e.target.value)} /></div>
    </div>
  );
}

// ─── Step 4: Platforms & Budget ───────────────────────────────────────────────

const ALL_PLATFORMS: Platform[] = ["Google Ads", "Microsoft Advertising", "Baidu", "Naver", "Yahoo Japan"];
const PLATFORM_SPLITS: Record<Platform, number> = { "Google Ads": 0.70, "Microsoft Advertising": 0.20, "Baidu": 0, "Naver": 0.10, "Yahoo Japan": 0 };
const PLATFORM_CPC: Record<Platform, string> = { "Google Ads": "$1.50–$6.00", "Microsoft Advertising": "$0.90–$4.00", "Baidu": "¥2–¥15", "Naver": "₩200–₩1,500", "Yahoo Japan": "—" };
const PLATFORM_TEMPLATE: Record<Platform, string> = { "Google Ads": "Lead Gen Search", "Microsoft Advertising": "Brand + Non-Brand", "Baidu": "Brand Search (CN)", "Naver": "Brand Search (KR)", "Yahoo Japan": "Coming Soon" };
const PLATFORM_NOTE: Record<Platform, string> = {
  "Google Ads": "Largest search volume. Recommended starting point.",
  "Microsoft Advertising": "~15–20% lower CPCs. Great for incremental reach.",
  "Baidu": "China only. Requires Simplified Chinese keywords.",
  "Naver": "South Korea's #1 search engine. Separate strategy needed.",
  "Yahoo Japan": "Integration planned for Q3. Pre-configure API credentials.",
};

function PlatformsBudgetStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  const totalBudget = Number(form.totalBudget ?? 0);
  const togglePlatform = (p: Platform) => {
    if (PLATFORM_STATUS[p] === "coming_soon") return;
    setField("platforms", form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p]);
  };
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">Platform Selection Mode</Label>
        <div className="flex gap-3 mt-2">
          {[["recommended", "Let SPARK recommend"], ["manual", "I'll choose manually"]].map(([v, l]) => (
            <button key={v} onClick={() => setField("platformMode", v)} className={`flex-1 p-3 rounded-xl border text-sm transition-all ${form.platformMode === v ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Select Platforms</Label>
        <p className="text-xs text-muted-foreground">SPARK creates a separate plan for each platform under one unified budget.</p>
        {ALL_PLATFORMS.map((platform) => {
          const isSelected = form.platforms.includes(platform);
          const status = PLATFORM_STATUS[platform];
          const isComingSoon = status === "coming_soon";
          const allocated = totalBudget && PLATFORM_SPLITS[platform] ? Math.round(totalBudget * PLATFORM_SPLITS[platform]) : null;
          return (
            <button key={platform} onClick={() => togglePlatform(platform)} disabled={isComingSoon} className={`w-full text-left p-3.5 rounded-xl border transition-all ${isSelected ? `${PLATFORM_COLORS[platform]}` : "border-border/50 hover:border-border"} ${isComingSoon ? "opacity-50 cursor-not-allowed" : ""}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>{isSelected && <CheckCircle size={10} className="text-white" />}</div>
                  <span className="font-semibold text-sm text-foreground">{platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${status === "connected" ? "border-green-500/30 text-green-300" : status === "coming_soon" ? "border-purple-500/30 text-purple-300" : "border-border text-muted-foreground"}`}>{status === "connected" ? "Connected" : status === "coming_soon" ? "Coming Soon" : "Not Connected"}</Badge>
                  {isSelected && allocated ? <span className="text-xs font-bold">${allocated.toLocaleString()}/mo</span> : null}
                </div>
              </div>
              <div className="ml-6 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <span>Est. CPC: <span className="text-foreground">{PLATFORM_CPC[platform]}</span></span>
                <span>Template: <span className="text-foreground">{PLATFORM_TEMPLATE[platform]}</span></span>
                <span className="hidden sm:inline">{PLATFORM_NOTE[platform]}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2"><Label className="text-sm font-semibold">Total Monthly Budget ($) <span className="text-red-400">*</span></Label><Input placeholder="e.g. 15000" type="number" className="mt-2 h-9" value={form.totalBudget} onChange={(e) => setField("totalBudget", e.target.value)} /></div>
        <div><Label className="text-sm font-semibold">Duration</Label>
          <Select value={form.duration} onValueChange={(v) => setField("duration", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[["ongoing","Ongoing"],["1_month","1 Month"],["3_months","3 Months"],["6_months","6 Months"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Budget Pacing Style</Label>
        <div className="flex gap-2 mt-2">
          {[["conservative","Conservative","Spend ~80% of daily budget. Lower risk."],["balanced","Balanced","Standard pacing. Recommended."],["aggressive","Aggressive","Spend fully each day."]].map(([v,l,desc]) => (
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

// ─── Step 5: Keywords ─────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  "Brand": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "High Intent": "bg-green-500/15 text-green-300 border-green-500/30",
  "Product / Service": "bg-primary/15 text-primary border-primary/30",
  "Local Intent": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "Competitor": "bg-red-500/15 text-red-300 border-red-500/30",
  "Informational": "bg-muted/40 text-muted-foreground border-border",
};
const COMPETITION_COLOR = { Low: "text-green-400", Medium: "text-amber-400", High: "text-red-400" };

function KeywordsStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingNegatives, setLoadingNegatives] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNegSuggestions, setShowNegSuggestions] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<SuggestedKeyword[]>([]);
  const [acceptedNegatives, setAcceptedNegatives] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSuggestKeywords = async () => {
    setLoadingKeywords(true);
    await new Promise((r) => setTimeout(r, 1200));
    const kws = generateMockKeywords(form);
    setSuggestedKeywords(kws);
    setField("acceptedKeywords", kws);
    setShowSuggestions(true);
    setLoadingKeywords(false);
  };

  const handleSuggestNegatives = async () => {
    setLoadingNegatives(true);
    await new Promise((r) => setTimeout(r, 800));
    setShowNegSuggestions(true);
    setLoadingNegatives(false);
  };

  const setKeywordAccepted = (id: number, accepted: boolean) => {
    const updated = (form.acceptedKeywords as SuggestedKeyword[]).map((k) => k.id === id ? { ...k, accepted } : k);
    setField("acceptedKeywords", updated);
    setSuggestedKeywords((prev) => prev.map((k) => k.id === id ? { ...k, accepted } : k));
  };

  const acceptNeg = (n: string) => setAcceptedNegatives((prev) => ({ ...prev, [n]: !prev[n] }));

  const acceptedCount = suggestedKeywords.filter((k) => k.accepted === true).length;
  const rejectedCount = suggestedKeywords.filter((k) => k.accepted === false).length;

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold">What would your customers search for?</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Describe it naturally. SPARK generates keyword groups from your answer.</p>
        <Textarea placeholder="e.g. Marketing software that helps small teams run campaigns without needing a big agency. People might search for alternatives to HubSpot or Marketo." value={form.searchIntent} onChange={(e) => setField("searchIntent", e.target.value)} className="h-20 text-sm resize-none" />
      </div>

      {/* AI action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleSuggestKeywords} disabled={loadingKeywords} data-testid="btn-suggest-keywords">
          {loadingKeywords ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} Suggest Keywords with AI
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleSuggestNegatives} disabled={loadingNegatives}>
          {loadingNegatives ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />} Suggest Negative Keywords
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5">
          <Hash size={11} /> Group Keywords by Intent
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5">
          <BarChart2 size={11} /> Estimate CPC / Bid Forecast
        </Button>
      </div>

      {/* AI keyword suggestions */}
      {showSuggestions && suggestedKeywords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">AI Keyword Suggestions</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-green-400">{acceptedCount} accepted</span>
              <span className="text-red-400">{rejectedCount} rejected</span>
              <span>{suggestedKeywords.length - acceptedCount - rejectedCount} undecided</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {suggestedKeywords.map((kw) => (
              <div key={kw.id} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${kw.accepted === true ? "border-green-500/30 bg-green-500/5" : kw.accepted === false ? "border-red-500/20 bg-red-500/5 opacity-50" : "border-border/50 bg-card/50"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-medium">{kw.term}</span>
                    <Badge variant="outline" className={`text-xs border-0 ${GROUP_COLORS[kw.group] ?? "bg-muted text-muted-foreground"}`}>{kw.group}</Badge>
                    <Badge variant="outline" className="text-xs border-border/40">{kw.matchType}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>CPC: <span className="text-foreground">{kw.cpcRange}</span></span>
                    <span>Competition: <span className={COMPETITION_COLOR[kw.competition]}>{kw.competition}</span></span>
                    <span>{kw.platforms.join(", ")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setKeywordAccepted(kw.id, true)} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${kw.accepted === true ? "bg-green-500/30 text-green-300" : "hover:bg-green-500/10 text-muted-foreground hover:text-green-400"}`}><ThumbsUp size={12} /></button>
                  <button onClick={() => setKeywordAccepted(kw.id, false)} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${kw.accepted === false ? "bg-red-500/20 text-red-400" : "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"}`}><ThumbsDown size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative keyword suggestions */}
      {showNegSuggestions && (
        <div>
          <p className="text-sm font-semibold text-red-400 mb-2">Suggested Negative Keywords</p>
          <p className="text-xs text-muted-foreground mb-2">Click to add to your negative keyword list.</p>
          <div className="flex flex-wrap gap-2">
            {NEGATIVE_SUGGESTIONS.map((n) => (
              <button key={n} onClick={() => acceptNeg(n)} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${acceptedNegatives[n] ? "border-red-500/50 bg-red-500/15 text-red-300" : "border-border/50 text-muted-foreground hover:border-red-500/30 hover:text-red-300"}`}>
                <span className="flex items-center gap-1"><XCircle size={9} />{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-border/40" />

      {/* Manual keyword entry */}
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-sm font-semibold">Brand Keywords</Label><Textarea placeholder="spark ai, spark ai platform" value={form.brandKeywords} onChange={(e) => setField("brandKeywords", e.target.value)} className="mt-2 h-20 font-mono text-xs resize-none" /></div>
        <div><Label className="text-sm font-semibold">Service / Product Keywords</Label><Textarea placeholder="marketing automation software, ai campaign" value={form.serviceKeywords} onChange={(e) => setField("serviceKeywords", e.target.value)} className="mt-2 h-20 font-mono text-xs resize-none" /></div>
        <div><Label className="text-sm font-semibold">Competitor Keywords</Label><Textarea placeholder="hubspot alternative, marketo pricing" value={form.competitorKeywords} onChange={(e) => setField("competitorKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none" /></div>
        <div><Label className="text-sm font-semibold text-red-400">Negative Keywords <span className="text-muted-foreground font-normal text-xs">(important!)</span></Label><Textarea placeholder="free, tutorial, jobs, reddit" value={form.negativeKeywords} onChange={(e) => setField("negativeKeywords", e.target.value)} className="mt-2 h-16 font-mono text-xs resize-none border-red-500/20" /></div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Default Match Type</Label>
        <div className="flex gap-2 mt-2">
          {[["exact","Exact Match","Precise. Lower volume, higher intent."],["phrase","Phrase Match","Balanced. Recommended for most."],["broad","Broad Match","High reach. Needs strong negatives."]].map(([v,l,desc]) => (
            <button key={v} onClick={() => setField("matchType", v)} className={`flex-1 p-3 rounded-xl border text-xs text-left transition-all ${form.matchType === v ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground"}`}>
              <p className={`font-semibold ${form.matchType === v ? "text-primary" : ""}`}>{l}</p>
              <p className="mt-0.5 text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} /> Advanced: Location Keywords & Platform Notes
      </button>
      {showAdvanced && (
        <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-2">
          <div><Label className="text-xs">Location Intent Keywords</Label><Input placeholder="e.g. marketing agency singapore, crm australia" className="mt-1 h-8 font-mono text-xs" /></div>
          <p className="text-xs text-muted-foreground"><span className="text-primary">Platform note:</span> Baidu and Naver require separate keyword strategies. SPARK will generate Simplified Chinese and Korean suggestions based on your entries.</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 6: Ads & Extensions ─────────────────────────────────────────────────

function AdsExtensionsStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  const [regenerating, setRegenerating] = useState(false);
  const regen = async () => { setRegenerating(true); await new Promise((r) => setTimeout(r, 900)); setRegenerating(false); };

  const headlines = [
    form.headline1 || "SPARK AI — Marketing Suite",
    form.headline2 || "AI-Powered Campaign Manager",
    form.headline3 || form.offer || "Free 14-Day Trial",
    "Replace Your Marketing Agency",
    "Plan. Launch. Optimise. With AI.",
  ].filter(Boolean);

  const descriptions = [
    form.desc1 || `${form.product?.slice(0, 60) || "AI marketing platform"}. No expertise needed.`,
    form.desc2 || `${form.offer || "Start free today"}. Connect ${form.platforms.slice(0, 2).join(" & ")} from one command centre.`,
  ];

  const trackingItems = [
    { label: "Landing page URL", done: !!form.landingPage },
    { label: "GA4 conversion event", done: !!form.ga4Event },
    { label: "UTM tagging template", done: !!form.landingPage },
    { label: "CRM lead source mapping", done: false },
    { label: "Call tracking", done: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div><Label className="text-sm font-semibold">Generated Ad Copy</Label><p className="text-xs text-muted-foreground">Based on your goal, offer, and keywords</p></div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={regen} disabled={regenerating}>{regenerating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate</Button>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Headlines <span className="text-foreground">(max 30 chars each)</span></p></div>
            <div className="flex flex-wrap gap-2">
              {headlines.map((h, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">{h}</span>)}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {["headline1","headline2","headline3"].map((k,i) => (
                <div key={k}><Label className="text-xs">H{i+1}</Label><Input value={(form as any)[k]} onChange={(e) => setField(k, e.target.value)} maxLength={30} className="mt-1 h-7 text-xs" /></div>
              ))}
            </div>
          </div>
          <Separator className="bg-border/30" />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Descriptions <span className="text-foreground">(max 90 chars each)</span></p>
            {descriptions.map((d, i) => <p key={i} className="text-xs bg-muted/20 border border-border/30 rounded px-3 py-2 mb-1.5">{d}</p>)}
            <Textarea value={form.desc1} onChange={(e) => setField("desc1", e.target.value)} maxLength={90} className="h-14 text-xs resize-none mt-2" placeholder="Description 1…" />
            <Textarea value={form.desc2} onChange={(e) => setField("desc2", e.target.value)} maxLength={90} className="h-14 text-xs resize-none mt-2" placeholder="Description 2…" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[["Sitelinks", "3 generated"], ["Callout Extensions", "5 generated"], ["Structured Snippets", "Placeholder — configure after launch"], ["CTA Suggestion", form.offer || "Start Free Trial"]].map(([label, value]) => (
          <div key={label} className="p-3 rounded-xl border border-border/40 bg-card/40"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div>
        ))}
      </div>

      <div>
        <Label className="text-sm font-semibold">Tracking</Label>
        <div className="mt-3 space-y-2 mb-3">
          {trackingItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done ? <CheckCircle size={15} className="text-green-400 shrink-0" /> : <XCircle size={15} className="text-muted-foreground shrink-0" />}
              <span className={`text-sm ${item.done ? "" : "text-muted-foreground"}`}>{item.label}</span>
              {!item.done && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 ml-auto">Needed before launch</Badge>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">GA4 Conversion Event</Label><Input value={form.ga4Event} onChange={(e) => setField("ga4Event", e.target.value)} className="mt-1 h-8 font-mono text-xs" placeholder="generate_lead" /></div>
          <div><Label className="text-xs">Final URL</Label><Input value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} className="mt-1 h-8 font-mono text-xs" placeholder="https://…" /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 7: Launch Plan ──────────────────────────────────────────────────────

function LaunchPlanStep({ form, setField }: { form: WizardForm; setField: (k: string, v: any) => void }) {
  const readiness = [
    { label: "Campaign name set", done: !!form.campaignName },
    { label: "Primary goal selected", done: !!form.primaryGoal },
    { label: "Landing page URL entered", done: !!form.landingPage },
    { label: "At least one platform selected", done: form.platforms.length > 0 },
    { label: "Budget entered", done: !!form.totalBudget },
    { label: "Keywords entered", done: !!(form.brandKeywords || form.serviceKeywords || form.searchIntent) },
    { label: "GA4 conversion event set", done: !!form.ga4Event },
    { label: "Negative keywords entered", done: !!form.negativeKeywords },
  ];
  const score = Math.round((readiness.filter((r) => r.done).length / readiness.length) * 100);

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Pre-Launch Readiness Check</p>
          <span className={`text-lg font-bold ${score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="space-y-1.5 mt-2">
          {readiness.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {item.done ? <CheckCircle size={13} className="text-green-400 shrink-0" /> : <XCircle size={13} className="text-muted-foreground shrink-0" />}
              <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Target Launch Date</Label>
          <Input type="date" value={form.launchDate} onChange={(e) => setField("launchDate", e.target.value)} className="mt-2 h-9" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Approval Required From</Label>
          <Select value={form.approvers || "alex_chen"} onValueChange={(v) => setField("approvers", v)}>
            <SelectTrigger className="mt-2 h-9"><SelectValue placeholder="Select approver…" /></SelectTrigger>
            <SelectContent>
              {["Alex Chen", "Sarah Park", "James Wong", "Priya Sharma"].map((n) => <SelectItem key={n} value={n.toLowerCase().replace(" ","_")}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {score < 80 && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-300">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Campaign is not yet launch-ready</p>
            <p className="mt-0.5 text-amber-300/80">Complete the missing items before requesting approval. Launching without tracking means no Smart Bidding data.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 8: Review & Approval ────────────────────────────────────────────────

function ReviewStep({ form, mode }: { form: WizardForm; mode: WizardMode }) {
  const budget = Number(form.totalBudget ?? 0);
  const approvals = [
    { label: "Budget Approval", done: false },
    { label: "Keyword Approval", done: !!(form.brandKeywords || form.serviceKeywords) },
    { label: "Ad Copy Approval", done: !!(form.headline1 && form.desc1) || !!form.product },
    { label: "Tracking Approval", done: !!(form.landingPage && form.ga4Event) },
    { label: "Launch Approval", done: false },
  ];
  const readinessScore = Math.round((approvals.filter((a) => a.done).length / approvals.length) * 100);
  const acceptedKws = (form.acceptedKeywords as SuggestedKeyword[] ?? []).filter((k) => k.accepted === true);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Campaign Summary</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Launch Readiness</span>
            <span className={`text-sm font-bold ${readinessScore >= 80 ? "text-green-400" : readinessScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{readinessScore}%</span>
          </div>
        </div>
        <Progress value={readinessScore} className="h-1.5" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {[
            ["Campaign Name", form.campaignName || "—"],
            ["Primary Goal", form.primaryGoal ? GOAL_LABELS[form.primaryGoal] : "—"],
            ["Geography", form.geography || "—"],
            ["Monthly Budget", budget ? `$${budget.toLocaleString()}` : "—"],
            ["Platforms", form.platforms.join(", ") || "—"],
            ["Match Type", form.matchType || "Phrase"],
            ["Budget Style", form.budgetStyle || "Balanced"],
            ["Owner", form.campaignOwner || "—"],
          ].map(([k, v]) => (
            <div key={k}><p className="text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
          ))}
        </div>
        {form.secondaryGoals.length > 0 && (
          <div className="text-xs"><p className="text-muted-foreground">Secondary Goals</p><p>{form.secondaryGoals.map((g) => GOAL_LABELS[g]).join(", ")}</p></div>
        )}
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {form.tags.map((t) => <span key={t} className={`text-xs px-2 py-0.5 rounded border ${TAG_COLORS[t] ?? "bg-muted text-muted-foreground border-border"}`}>{t}</span>)}
          </div>
        )}
      </div>

      {/* Platform allocation */}
      {form.platforms.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Platform Budget Allocation</p>
          <div className="space-y-2">
            {form.platforms.map((p) => {
              const alloc = budget && PLATFORM_SPLITS[p] ? Math.round(budget * PLATFORM_SPLITS[p]) : null;
              return (
                <div key={p} className={`flex items-center justify-between p-3 rounded-xl border ${PLATFORM_COLORS[p]}`}>
                  <div><p className="font-medium text-sm">{p}</p><p className="text-xs text-muted-foreground">{PLATFORM_STATUS[p] === "connected" ? "Ready to draft" : "Account not connected"}</p></div>
                  <div className="text-right"><p className="font-bold text-sm">{alloc ? `$${alloc.toLocaleString()}/mo` : "—"}</p><Badge variant="outline" className={`text-xs mt-0.5 ${PLATFORM_STATUS[p] === "connected" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{PLATFORM_STATUS[p] === "connected" ? "Ready" : "Not Connected"}</Badge></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyword preview */}
      {acceptedKws.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Accepted Keywords ({acceptedKws.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {acceptedKws.slice(0, 12).map((k) => (
              <span key={k.id} className={`text-xs px-2 py-0.5 rounded border ${GROUP_COLORS[k.group] ?? "bg-muted text-muted-foreground border-border"}`}>{k.term}</span>
            ))}
            {acceptedKws.length > 12 && <span className="text-xs text-muted-foreground">+{acceptedKws.length - 12} more</span>}
          </div>
        </div>
      )}

      {/* Ad copy preview */}
      {(form.headline1 || form.product) && (
        <div>
          <p className="text-sm font-semibold mb-2">Ad Copy Preview</p>
          <div className="p-3 rounded-xl border border-border/50 bg-card/50 text-xs space-y-1">
            <p className="text-blue-400 font-medium">{form.headline1 || "SPARK AI — Marketing Suite"} | {form.headline2 || "AI-Powered Campaign Manager"}</p>
            <p className="text-green-400 font-mono">{form.landingPage || "sparkapp.io › lp › trial"}</p>
            <p className="text-muted-foreground">{form.desc1 || "AI-powered marketing platform for teams. Plan, launch and optimise campaigns."}</p>
          </div>
        </div>
      )}

      {/* Approval checklist */}
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

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button variant="outline" size="sm" className="gap-1.5"><FileText size={13} /> {mode === "edit" ? "Save Changes" : mode === "resume" ? "Update Draft" : "Save New Draft"}</Button>
        <Button variant="outline" size="sm" className="gap-1.5"><Shield size={13} /> Request Approval</Button>
        <Button variant="outline" size="sm" className="gap-1.5"><Play size={13} /> Create Platform Drafts</Button>
        <Button size="sm" className="gap-1.5"><Rocket size={13} /> Simulate Launch</Button>
      </div>
    </div>
  );
}

// ─── Guided Wizard Modal ──────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: "Campaign Basics", icon: <StickyNote size={12} /> },
  { label: "Goal", icon: <Target size={12} /> },
  { label: "Offer & Audience", icon: <Users size={12} /> },
  { label: "Platforms & Budget", icon: <DollarSign size={12} /> },
  { label: "Keywords", icon: <Search size={12} /> },
  { label: "Ads & Extensions", icon: <Wand2 size={12} /> },
  { label: "Launch Plan", icon: <Rocket size={12} /> },
  { label: "Review & Approval", icon: <CheckCircle size={12} /> },
];

interface GuidedWizardProps {
  open: boolean;
  onClose: () => void;
  mode: WizardMode;
  selectedCampaign?: SparkCampaign | null;
}

function GuidedWizard({ open, onClose, mode, selectedCampaign }: GuidedWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setFormState] = useState<WizardForm>(() => getInitialWizardForm(mode, selectedCampaign));

  // When the wizard opens, reset state correctly for the current mode
  useEffect(() => {
    if (open) {
      const initial = getInitialWizardForm(mode, selectedCampaign);
      setFormState(initial);
      setStep(mode === "resume" ? (initial.draftStep ?? 0) : 0);
    }
  }, [open, mode, selectedCampaign]);

  const setField = useCallback((key: string, value: any) => {
    setFormState((f) => ({ ...f, [key]: value }));
  }, []);

  const pct = Math.round(((step + 1) / WIZARD_STEPS.length) * 100);

  // Brain callbacks
  const brainCallbacks: Record<string, () => void> = {
    suggestName: () => { setField("campaignName", `${form.primaryGoal ? GOAL_LABELS[form.primaryGoal] : "Brand Search"} — ${form.geography?.split(",")[0]?.trim() || "APAC"} Q${Math.ceil((new Date().getMonth() + 1) / 3)}`); toast({ title: "Campaign name suggested" }); },
    improveDesc: () => { if (!form.campaignDescription) setField("campaignDescription", "SPARK-guided paid search campaign targeting high-intent leads for our core B2B SaaS offering."); toast({ title: "Description improved" }); },
    recommendGoal: () => { setField("primaryGoal", "leads"); toast({ title: "Goal recommended: Generate Leads" }); },
    addGuardrails: () => { setField("maxCpl", "120"); setField("maxDaily", "500"); toast({ title: "Guardrails applied: max CPL $120, max daily $500" }); },
    recommendPlatforms: () => { setField("platforms", ["Google Ads", "Microsoft Advertising"]); toast({ title: "Platforms recommended: Google Ads + Microsoft Advertising" }); },
    allocateBudget: () => { if (!form.totalBudget) setField("totalBudget", "15000"); toast({ title: "Budget allocation: $15,000/mo suggested" }); },
    suggestKeywords: () => toast({ title: "Use the 'Suggest Keywords with AI' button in the form" }),
    suggestNegatives: () => toast({ title: "Use the 'Suggest Negative Keywords' button in the form" }),
    estimateCpc: () => toast({ title: "CPC forecast: $1.80–$5.50 estimated range for selected platforms" }),
    generateAdCopy: () => { setField("headline1", "SPARK AI — Marketing Suite"); setField("headline2", "AI-Powered Campaign Manager"); setField("headline3", form.offer || "Free 14-Day Trial"); setField("desc1", `${form.product?.slice(0, 60) || "AI marketing platform for growing teams"}. No expertise required.`); setField("desc2", `${form.offer || "Start free today"}. Connect all your channels from one place.`); toast({ title: "Ad copy generated" }); },
    generateExtensions: () => toast({ title: "Extensions generated: 3 sitelinks, 5 callouts" }),
    checkReadiness: () => { const missing = [!form.campaignName && "Campaign name", !form.primaryGoal && "Primary goal", !form.landingPage && "Landing page", !form.ga4Event && "GA4 event"].filter(Boolean); toast({ title: missing.length ? `${missing.length} items still needed` : "Campaign is ready to launch!", description: missing.join(", ") || undefined }); },
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1300));
    setSaving(false);
    const label = mode === "edit" ? "Campaign updated" : mode === "resume" ? "Draft updated" : "Campaign draft saved";
    toast({ title: label, description: `"${form.campaignName || "Untitled Campaign"}" has been saved.` });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <BasicsStep form={form} setField={setField} />;
      case 1: return <GoalStep form={form} setField={setField} />;
      case 2: return <OfferAudienceStep form={form} setField={setField} />;
      case 3: return <PlatformsBudgetStep form={form} setField={setField} />;
      case 4: return <KeywordsStep form={form} setField={setField} />;
      case 5: return <AdsExtensionsStep form={form} setField={setField} />;
      case 6: return <LaunchPlanStep form={form} setField={setField} />;
      case 7: return <ReviewStep form={form} mode={mode} />;
      default: return null;
    }
  };

  const modeBadge = { create: null, edit: <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Editing Campaign</Badge>, resume: <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">Resuming Draft</Badge> }[mode];

  const saveLabel = { create: "Save New Draft", edit: "Save Changes", resume: "Update Draft" }[mode];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-card/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <MonitorPlay size={14} className="text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-semibold text-sm leading-none">Guided Campaign Wizard</DialogTitle>
                  {modeBadge}
                </div>
                <p className="text-xs text-muted-foreground">Step {step + 1} of {WIZARD_STEPS.length}: <span className="text-foreground">{WIZARD_STEPS[step].label}</span></p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{pct}% complete</span>
          </div>
          <Progress value={pct} className="h-1.5 mb-3" />
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {WIZARD_STEPS.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {s.icon}<span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">{renderStep()}</div>
          <div className="w-72 shrink-0 border-l border-border/50 bg-card/40 p-5 overflow-y-auto hidden lg:flex flex-col">
            <SparkBrainPanel step={step} form={form} brainCallbacks={brainCallbacks} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 px-6 py-4 bg-card/60 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="gap-1.5">
            <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => toast({ title: "Draft saved", description: `"${form.campaignName || "Untitled"}" saved at step ${step + 1}.` })}><FileText size={13} />{saveLabel}</Button>
            {step < WIZARD_STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1.5">Next <ChevronRight size={14} /></Button>
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
        <div className="relative flex-1 max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search campaigns…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 h-8 text-sm" /></div>
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
                  const pct = c.budget ? Math.round((c.spend / c.budget) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-card/60 group" data-testid={`campaign-row-${c.id}`}>
                      <td className="px-3 py-3"><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.owner}</p></td>
                      <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{c.platforms.map((p) => <PlatformChip key={p} platform={p} />)}</div></td>
                      <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-muted-foreground">{GOAL_LABELS[c.goal]}</span></td>
                      <td className="px-3 py-3 whitespace-nowrap"><Badge variant="outline" className={`text-xs border-0 ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</Badge></td>
                      <td className="px-3 py-3 whitespace-nowrap"><p className="text-xs font-medium">${c.budget.toLocaleString()}</p>{c.spend > 0 && <div className="mt-1 h-1 w-14 bg-muted/40 rounded-full"><div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${Math.min(pct,100)}%` }} /></div>}</td>
                      <td className="px-3 py-3 text-xs text-right">{c.spend > 0 ? `$${c.spend.toLocaleString()}` : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right">{c.avgCpc > 0 ? `$${c.avgCpc}` : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right font-medium text-primary">{c.conversions > 0 ? c.conversions : "—"}</td>
                      <td className="px-3 py-3 text-xs text-right">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</td>
                      <td className="px-3 py-3"><TrackingBadge status={c.trackingStatus} /></td>
                      <td className="px-3 py-3 min-w-[180px]"><p className="text-xs text-primary flex items-center gap-1"><Zap size={10} />{c.sparkRec}</p></td>
                      <td className="px-3 py-3"><ApprovalBadge status={c.approvalStatus} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="View"><Eye size={11} /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit" onClick={() => onEdit(c)} data-testid={`btn-edit-${c.id}`}><Edit size={11} /></Button>
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

// ─── Main PPC Component ───────────────────────────────────────────────────────

export default function PPC() {
  const [campaigns] = useState<SparkCampaign[]>(MOCK_CAMPAIGNS);
  const [showGuided, setShowGuided] = useState(false);
  const [wizardMode, setWizardMode] = useState<WizardMode>("create");
  const [selectedCampaign, setSelectedCampaign] = useState<SparkCampaign | null>(null);
  const [wizardSessionId, setWizardSessionId] = useState<string>("initial");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Draft exists if any campaign is in draft status
  const draftCampaign = campaigns.find((c) => c.status === "draft" || c.status === "data_check");

  const startNewCampaign = () => {
    setWizardMode("create");
    setSelectedCampaign(null);
    setWizardSessionId(Date.now().toString());
    setShowGuided(true);
  };

  const editCampaign = (campaign: SparkCampaign) => {
    setWizardMode("edit");
    setSelectedCampaign(campaign);
    setWizardSessionId(`edit-${campaign.id}-${Date.now()}`);
    setShowGuided(true);
  };

  const resumeDraft = () => {
    if (!draftCampaign) return;
    setWizardMode("resume");
    setSelectedCampaign(draftCampaign);
    setWizardSessionId(`resume-${draftCampaign.id}-${Date.now()}`);
    setShowGuided(true);
  };

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

      {/* KPI strip */}
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
              <div><p className="text-xs text-muted-foreground">{kpi.label}</p><p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three hero action cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/60 transition-colors cursor-pointer group" onClick={startNewCampaign} data-testid="card-guided-wizard">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
              <Star size={18} className="text-primary" />
            </div>
            <p className="font-bold text-base mb-1">Guided Campaign Wizard</p>
            <p className="text-sm text-muted-foreground flex-1">Let SPARK guide you from business goal to a complete paid search campaign plan — no PPC expertise required.</p>
            <div className="flex gap-2 mt-5">
              <Button className="gap-1.5 flex-1" onClick={(e) => { e.stopPropagation(); startNewCampaign(); }} data-testid="btn-start-guided">
                <Sparkles size={14} /> Start Guided Campaign
              </Button>
            </div>
            {draftCampaign && (
              <Button variant="ghost" size="sm" className="mt-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); resumeDraft(); }} data-testid="btn-resume-draft">
                <RotateCcw size={11} /> Resume Last Draft: "{draftCampaign.name}"
              </Button>
            )}
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

      {/* Tabs */}
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
              <p className="text-xs text-muted-foreground">Each SPARK campaign can run across multiple search platforms. Click Edit to modify via the wizard.</p>
            </div>
            <CampaignTable campaigns={campaigns} onEdit={editCampaign} />
          </TabsContent>

          <TabsContent value="keywords">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"><Wand2 size={12} /> AI Keyword Suggestions</Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 ml-auto"><Plus size={12} /> Add Keywords</Button>
              </div>
              <Card className="border-border/60 bg-card">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">{["Keyword","Match","CPC","Clicks","Conv.","Quality"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                    <tbody>
                      {[{t:"marketing automation software",m:"Exact",cpc:4.12,cl:312,cv:28,q:8},{t:"spark ai marketing",m:"Phrase",cpc:1.82,cl:892,cv:156,q:10},{t:"hubspot alternative",m:"Exact",cpc:6.21,cl:98,cv:8,q:6},{t:"ai campaign management",m:"Phrase",cpc:3.44,cl:0,cv:0,q:7}].map((k,i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-card/60">
                          <td className="px-4 py-2.5 font-mono text-xs">{k.t}</td>
                          <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{k.m}</Badge></td>
                          <td className="px-4 py-2.5 text-right text-xs">${k.cpc}</td>
                          <td className="px-4 py-2.5 text-right text-xs">{k.cl || "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-primary">{k.cv || "—"}</td>
                          <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><div className="w-14 h-1.5 bg-muted/40 rounded-full"><div className={`h-full rounded-full ${k.q>=8?"bg-green-400":k.q>=6?"bg-amber-400":"bg-red-400"}`} style={{width:`${k.q*10}%`}}/></div><span className="text-xs">{k.q}/10</span></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card"><CardContent className="p-4"><p className="text-xs font-semibold text-red-400 mb-2">Negative Keywords</p><div className="flex flex-wrap gap-1.5">{["free","open source","tutorial","reddit","jobs","career"].map((n) => <Badge key={n} variant="outline" className="text-xs border-red-500/30 text-red-300 bg-red-500/10 gap-1"><XCircle size={9}/>{n}</Badge>)}<Button size="sm" variant="ghost" className="h-5 px-2 text-xs text-muted-foreground"><Plus size={9}/> Add</Button></div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-3">
              {[
                { type:"Negative Keyword", priority:"high", title:"Add 14 negative keywords to cut ~$1,840 wasted spend", campaign:"Non-Brand — Singapore SMEs" },
                { type:"Budget", priority:"high", title:"Shift $3k from Competitor Conquest (1.8x) → Brand Search (6.1x ROAS)", campaign:"Global" },
                { type:"Tracking", priority:"high", title:"Fix missing GA4 conversion event on Enterprise Lead Gen before launch", campaign:"Enterprise Lead Gen" },
                { type:"Ad Copy", priority:"medium", title:"Generate new headlines for Competitor Conquest (CTR only 1.9%)", campaign:"Competitor Conquest" },
                { type:"Keyword", priority:"low", title:"Create HubSpot competitor campaign — 22K APAC searches/mo", campaign:"Suggested new" },
              ].map((r, i) => (
                <Card key={i} className={`border ${r.priority==="high"?"border-red-500/30 bg-red-500/5":r.priority==="medium"?"border-amber-500/30 bg-amber-500/5":"border-border/60 bg-card"}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs border-0 bg-primary/15 text-primary">{r.type}</Badge>
                        <Badge variant="outline" className={`text-xs ${r.priority==="high"?"border-red-500/30 text-red-300":r.priority==="medium"?"border-amber-500/30 text-amber-300":"border-border text-muted-foreground"}`}>{r.priority}</Badge>
                        <span className="text-xs text-muted-foreground">· {r.campaign}</span>
                      </div>
                      <p className="text-sm font-medium">{r.title}</p>
                    </div>
                    <div className="flex gap-2 shrink-0"><Button size="sm" variant="ghost" className="h-7 text-xs">Dismiss</Button><Button size="sm" className="h-7 text-xs gap-1"><Zap size={11}/> Apply</Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <div className="space-y-3">
              {[{title:"Budget approval — Enterprise Lead Gen",type:"Budget",amount:"$18,000/mo",by:"Sarah Park",time:"2h ago",urgency:"high"},{title:"Keyword approval — Baidu China Expansion",type:"Keyword",amount:"142 keywords",by:"Priya Sharma",time:"4h ago",urgency:"medium"},{title:"Ad copy approval — Competitor Conquest v2",type:"Ad Copy",amount:"6 variants",by:"David Lee",time:"Yesterday",urgency:"medium"}].map((item,i) => (
                <Card key={i} className={`border-border/60 bg-card ${item.urgency==="high"?"border-amber-500/30":""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{item.type}</Badge>{item.urgency==="high"&&<Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Urgent</Badge>}</div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.amount} · by {item.by} · {item.time}</p>
                    </div>
                    <div className="flex gap-2 shrink-0"><Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-300">Reject</Button><Button size="sm" className="h-7 text-xs gap-1"><CheckCircle size={11}/> Approve</Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid md:grid-cols-3 gap-4">
              {["Campaign Performance Summary","Platform Comparison (Google vs Bing)","Keyword Performance","Budget Pacing","Lead Quality & CRM Attribution","AI Executive Summary"].map((r,i) => (
                <Card key={i} className="border-border/60 bg-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText size={14} className="text-primary"/></div>
                    <p className="text-sm font-semibold">{r}</p>
                    <div className="flex gap-2"><Button size="sm" variant="outline" className="h-7 text-xs flex-1 gap-1"><Eye size={11}/> View</Button><Button size="sm" variant="ghost" className="h-7 px-2"><Download size={11}/></Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Guided Wizard — key changes every session so React fully remounts it */}
      <GuidedWizard
        key={wizardSessionId}
        open={showGuided}
        onClose={() => setShowGuided(false)}
        mode={wizardMode}
        selectedCampaign={selectedCampaign}
      />

      {/* Advanced dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Advanced Campaign Setup</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The advanced campaign builder gives you full manual control over every PPC setting — keywords, match types, bid strategy, ad copy, extensions, and tracking. Use this if you're an experienced PPC manager.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdvanced(false)}>Cancel</Button>
            <Button className="flex-1 gap-1.5" onClick={() => { setShowAdvanced(false); startNewCampaign(); }}><Sparkles size={13}/> Use Guided Wizard</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
