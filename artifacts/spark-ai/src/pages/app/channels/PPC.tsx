import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MonitorPlay, Plus, Upload, RefreshCw, Wand2, TrendingUp, TrendingDown,
  CheckCircle, XCircle, AlertCircle, Clock, Loader2, Copy, Check, ChevronRight,
  ChevronLeft, ArrowRight, Search, Target, DollarSign, BarChart2, Zap, Shield,
  Eye, Globe, Tag, Flag, FileText, Settings, MoreHorizontal, ExternalLink,
  Play, Pause, Edit, Trash2, Filter, Download, Bell, Brain, Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "data_check" | "keyword_plan" | "ai_plan" | "approval" | "ready" | "live" | "optimising" | "reporting" | "paused";
type Platform = "Google Ads" | "Microsoft Advertising" | "Baidu" | "Naver" | "Yahoo Japan";
type CampaignSource = "standalone" | "linked" | "imported" | "ai_generated" | "adhoc";
type CampaignType = "brand" | "non_brand" | "competitor" | "product" | "service" | "local" | "lead_gen" | "regional" | "rlsa" | "pmax" | "shopping" | "adhoc";

interface SearchCampaign {
  id: number;
  name: string;
  platform: Platform;
  source: CampaignSource;
  type: CampaignType;
  tags: string[];
  objective: string;
  status: CampaignStatus;
  budget: number;
  spend: number;
  avgCpc: number;
  ctr: number;
  conversions: number;
  cpl: number;
  qualifiedLeads: number;
  trackingStatus: "ok" | "warning" | "error";
  syncStatus: "synced" | "pending" | "failed";
  nextAiAction: string;
  approvalStatus: "approved" | "pending" | "not_required" | "rejected";
  owner: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CAMPAIGNS: SearchCampaign[] = [
  {
    id: 1, name: "Brand Search — Core", platform: "Google Ads", source: "linked", type: "brand",
    tags: ["Q2 Growth", "Board Approved"], objective: "Leads", status: "live",
    budget: 15000, spend: 12400, avgCpc: 1.82, ctr: 5.4, conversions: 312, cpl: 39.74, qualifiedLeads: 198,
    trackingStatus: "ok", syncStatus: "synced", nextAiAction: "Raise bids on top 3 terms",
    approvalStatus: "approved", owner: "Alex Chen",
  },
  {
    id: 2, name: "Non-Brand — Growth APAC", platform: "Google Ads", source: "ai_generated", type: "non_brand",
    tags: ["Singapore SMEs", "High Intent", "Q2 Growth"], objective: "Leads", status: "optimising",
    budget: 22000, spend: 18900, avgCpc: 3.91, ctr: 2.8, conversions: 247, cpl: 76.52, qualifiedLeads: 121,
    trackingStatus: "ok", syncStatus: "synced", nextAiAction: "Add 14 negative keywords",
    approvalStatus: "approved", owner: "Sarah Park",
  },
  {
    id: 3, name: "Competitor Conquest — SEMrush", platform: "Google Ads", source: "standalone", type: "competitor",
    tags: ["Urgent Push", "Budget Sensitive"], objective: "Brand Protection", status: "live",
    budget: 9000, spend: 8200, avgCpc: 5.12, ctr: 1.9, conversions: 58, cpl: 141.38, qualifiedLeads: 22,
    trackingStatus: "warning", syncStatus: "synced", nextAiAction: "Pause low-conv. ad group",
    approvalStatus: "approved", owner: "Alex Chen",
  },
  {
    id: 4, name: "Bing Brand Search — UK", platform: "Microsoft Advertising", source: "imported", type: "brand",
    tags: ["Q2 Growth"], objective: "Leads", status: "live",
    budget: 5000, spend: 3100, avgCpc: 1.21, ctr: 4.8, conversions: 89, cpl: 34.83, qualifiedLeads: 67,
    trackingStatus: "ok", syncStatus: "synced", nextAiAction: "Increase budget 15%",
    approvalStatus: "approved", owner: "Priya Sharma",
  },
  {
    id: 5, name: "Lead Gen — Enterprise Search", platform: "Google Ads", source: "ai_generated", type: "lead_gen",
    tags: ["High Intent", "Test Campaign"], objective: "Leads", status: "approval",
    budget: 18000, spend: 0, avgCpc: 0, ctr: 0, conversions: 0, cpl: 0, qualifiedLeads: 0,
    trackingStatus: "warning", syncStatus: "pending", nextAiAction: "Awaiting budget approval",
    approvalStatus: "pending", owner: "Sarah Park",
  },
  {
    id: 6, name: "Baidu Brand — China Expansion", platform: "Baidu", source: "standalone", type: "regional",
    tags: ["Test Campaign", "Budget Sensitive"], objective: "Brand Awareness", status: "keyword_plan",
    budget: 12000, spend: 0, avgCpc: 0, ctr: 0, conversions: 0, cpl: 0, qualifiedLeads: 0,
    trackingStatus: "error", syncStatus: "failed", nextAiAction: "Complete keyword localisation",
    approvalStatus: "not_required", owner: "Priya Sharma",
  },
];

const WORKFLOW_STAGES: { key: CampaignStatus; label: string; color: string }[] = [
  { key: "draft", label: "Draft", color: "bg-muted/60 text-muted-foreground" },
  { key: "data_check", label: "Data Check", color: "bg-amber-500/20 text-amber-300" },
  { key: "keyword_plan", label: "Keyword Plan", color: "bg-blue-500/20 text-blue-300" },
  { key: "ai_plan", label: "AI Plan", color: "bg-purple-500/20 text-purple-300" },
  { key: "approval", label: "Approval", color: "bg-orange-500/20 text-orange-300" },
  { key: "ready", label: "Ready to Launch", color: "bg-cyan-500/20 text-cyan-300" },
  { key: "live", label: "Live", color: "bg-green-500/20 text-green-300" },
  { key: "optimising", label: "Optimising", color: "bg-emerald-500/20 text-emerald-300" },
  { key: "reporting", label: "Reporting", color: "bg-indigo-500/20 text-indigo-300" },
];

const SOURCE_LABELS: Record<CampaignSource, string> = {
  standalone: "Standalone", linked: "Linked to SPARK", imported: "Imported", ai_generated: "AI-Generated", adhoc: "Ad-hoc",
};

const TYPE_LABELS: Record<CampaignType, string> = {
  brand: "Brand Search", non_brand: "Non-Brand Search", competitor: "Competitor Search",
  product: "Product Search", service: "Service Search", local: "Local Search",
  lead_gen: "Lead Gen Search", regional: "Regional Search", rlsa: "RLSA (placeholder)",
  pmax: "Performance Max (placeholder)", shopping: "Shopping Search (placeholder)", adhoc: "Ad-hoc",
};

const TAG_COLORS: Record<string, string> = {
  "Q2 Growth": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Singapore SMEs": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "High Intent": "bg-green-500/15 text-green-300 border-green-500/30",
  "Urgent Push": "bg-red-500/15 text-red-300 border-red-500/30",
  "Board Approved": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Budget Sensitive": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Test Campaign": "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

const PLATFORM_CONFIG: Record<Platform, { color: string; status: "connected" | "disconnected" | "coming_soon" }> = {
  "Google Ads": { color: "text-blue-400", status: "connected" },
  "Microsoft Advertising": { color: "text-cyan-400", status: "connected" },
  "Baidu": { color: "text-red-400", status: "disconnected" },
  "Naver": { color: "text-green-400", status: "disconnected" },
  "Yahoo Japan": { color: "text-purple-400", status: "coming_soon" },
};

// ─── Utility Components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CampaignStatus }) {
  const stage = WORKFLOW_STAGES.find((s) => s.key === status);
  if (!stage) return null;
  return <Badge variant="outline" className={`text-xs border-0 ${stage.color}`}>{stage.label}</Badge>;
}

function TrackingBadge({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") return <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={11} /> OK</span>;
  if (status === "warning") return <span className="flex items-center gap-1 text-amber-400 text-xs"><AlertCircle size={11} /> Warning</span>;
  return <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={11} /> Error</span>;
}

function ApprovalBadge({ status }: { status: "approved" | "pending" | "not_required" | "rejected" }) {
  const cfg = {
    approved: "text-green-300 border-green-500/30",
    pending: "text-amber-300 border-amber-500/30",
    not_required: "text-muted-foreground border-border",
    rejected: "text-red-300 border-red-500/30",
  }[status];
  const label = { approved: "Approved", pending: "Pending", not_required: "—", rejected: "Rejected" }[status];
  return <Badge variant="outline" className={`text-xs ${cfg}`}>{label}</Badge>;
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  return <span className={`text-xs font-medium ${cfg.color}`}>{platform}</span>;
}

// ─── Workflow Status Board ────────────────────────────────────────────────────

function WorkflowBoard({ campaigns }: { campaigns: SearchCampaign[] }) {
  const counts = WORKFLOW_STAGES.reduce((acc, s) => {
    acc[s.key] = campaigns.filter((c) => c.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
      {WORKFLOW_STAGES.map((stage, idx) => (
        <Card key={stage.key} className="border-border/50 bg-card/60">
          <CardContent className="p-3 text-center">
            <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1 ${stage.color}`}>
              {counts[stage.key] ?? 0}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{stage.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Campaign Table ───────────────────────────────────────────────────────────

function CampaignRow({ campaign, onEdit }: { campaign: SearchCampaign; onEdit: (c: SearchCampaign) => void }) {
  const budgetUsedPct = campaign.budget ? Math.round((campaign.spend / campaign.budget) * 100) : 0;
  return (
    <tr className="border-b border-border/30 hover:bg-card/60 group" data-testid={`campaign-row-${campaign.id}`}>
      <td className="px-3 py-3 min-w-[180px]">
        <p className="font-medium text-sm text-foreground">{campaign.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{SOURCE_LABELS[campaign.source]}</p>
      </td>
      <td className="px-3 py-3 whitespace-nowrap"><PlatformBadge platform={campaign.platform} /></td>
      <td className="px-3 py-3 whitespace-nowrap">
        <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{TYPE_LABELS[campaign.type]}</Badge>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {campaign.tags.map((t) => (
            <span key={t} className={`text-xs px-1.5 py-0.5 rounded border ${TAG_COLORS[t] ?? "bg-muted/20 text-muted-foreground border-border"}`}>{t}</span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap"><StatusBadge status={campaign.status} /></td>
      <td className="px-3 py-3 whitespace-nowrap text-right">
        <p className="text-xs font-medium">${campaign.budget.toLocaleString()}</p>
        {campaign.status !== "draft" && campaign.status !== "keyword_plan" && campaign.status !== "ai_plan" && campaign.status !== "data_check" && (
          <div className="mt-1 h-1 w-16 bg-muted/40 rounded-full ml-auto">
            <div className={`h-full rounded-full ${budgetUsedPct > 90 ? "bg-red-400" : budgetUsedPct > 70 ? "bg-amber-400" : "bg-primary"}`} style={{ width: `${Math.min(budgetUsedPct, 100)}%` }} />
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-right text-sm">{campaign.spend > 0 ? `$${campaign.spend.toLocaleString()}` : "—"}</td>
      <td className="px-3 py-3 text-right text-sm">{campaign.avgCpc > 0 ? `$${campaign.avgCpc}` : "—"}</td>
      <td className="px-3 py-3 text-right text-sm">{campaign.ctr > 0 ? `${campaign.ctr}%` : "—"}</td>
      <td className="px-3 py-3 text-right text-sm font-medium text-primary">{campaign.conversions > 0 ? campaign.conversions : "—"}</td>
      <td className="px-3 py-3 text-right text-sm">{campaign.cpl > 0 ? `$${campaign.cpl.toFixed(0)}` : "—"}</td>
      <td className="px-3 py-3 text-right text-sm text-accent">{campaign.qualifiedLeads > 0 ? campaign.qualifiedLeads : "—"}</td>
      <td className="px-3 py-3"><TrackingBadge status={campaign.trackingStatus} /></td>
      <td className="px-3 py-3">
        <span className={`text-xs flex items-center gap-1 ${campaign.syncStatus === "synced" ? "text-green-400" : campaign.syncStatus === "pending" ? "text-amber-400" : "text-red-400"}`}>
          {campaign.syncStatus === "synced" ? <CheckCircle size={11} /> : campaign.syncStatus === "pending" ? <Clock size={11} /> : <XCircle size={11} />}
          {campaign.syncStatus}
        </span>
      </td>
      <td className="px-3 py-3 min-w-[160px]">
        <p className="text-xs text-primary flex items-center gap-1"><Zap size={10} />{campaign.nextAiAction}</p>
      </td>
      <td className="px-3 py-3"><ApprovalBadge status={campaign.approvalStatus} /></td>
      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{campaign.owner}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(campaign)} data-testid={`btn-edit-${campaign.id}`}><Edit size={11} /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal size={11} /></Button>
        </div>
      </td>
    </tr>
  );
}

function CampaignsTab({ campaigns, onEdit, onNew }: { campaigns: SearchCampaign[]; onEdit: (c: SearchCampaign) => void; onNew: () => void }) {
  const [filter, setFilter] = useState("");
  const filtered = campaigns.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()) || c.platform.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter campaigns…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Filter size={12} /> Filter</Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download size={12} /> Export</Button>
        <Button size="sm" className="h-8 gap-1.5 text-xs ml-auto" onClick={onNew}><Plus size={12} /> New Search Campaign</Button>
      </div>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  {["Campaign", "Platform", "Type", "Tags", "Status", "Budget", "Spend", "CPC", "CTR", "Conv.", "CPL", "Qual. Leads", "Tracking", "Sync", "Next AI Action", "Approval", "Owner", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => <CampaignRow key={c.id} campaign={c} onEdit={onEdit} />)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Search Ad Accounts Tab ───────────────────────────────────────────────────

function SearchAdAccountsTab() {
  const accounts = [
    { platform: "Google Ads" as Platform, accountId: "123-456-7890", currency: "SGD", accessLevel: "Execute", lastSync: "2 min ago", imported: 5, trackingStatus: "ok" as const },
    { platform: "Microsoft Advertising" as Platform, accountId: "9876543210", currency: "USD", accessLevel: "Execute", lastSync: "18 min ago", imported: 2, trackingStatus: "ok" as const },
    { platform: "Baidu" as Platform, accountId: null, currency: "CNY", accessLevel: "—", lastSync: "Never", imported: 0, trackingStatus: "error" as const },
    { platform: "Naver" as Platform, accountId: null, currency: "KRW", accessLevel: "—", lastSync: "Never", imported: 0, trackingStatus: "error" as const },
    { platform: "Yahoo Japan" as Platform, accountId: null, currency: "JPY", accessLevel: "—", lastSync: "—", imported: 0, trackingStatus: "error" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Connect search ad platforms to import campaigns, sync performance data, and enable automated launches.</p>
        <Link href="/settings/api-connections">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Settings size={12} /> Manage API Keys</Button>
        </Link>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const cfg = PLATFORM_CONFIG[acc.platform];
          const isConnected = cfg.status === "connected";
          const isComingSoon = cfg.status === "coming_soon";

          return (
            <Card key={acc.platform} className={`border-border/60 bg-card ${isConnected ? "border-green-500/20" : ""}`} data-testid={`account-card-${acc.platform.replace(/\s+/g, "-").toLowerCase()}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center text-sm font-bold ${cfg.color}`}>
                      {acc.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{acc.platform}</p>
                      {isConnected
                        ? <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5"><CheckCircle size={10} /> Connected</p>
                        : isComingSoon
                          ? <p className="text-xs text-purple-400 flex items-center gap-1 mt-0.5"><Clock size={10} /> Coming Soon</p>
                          : <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><XCircle size={10} /> Not Connected</p>
                      }
                    </div>
                  </div>
                  {isConnected && <TrackingBadge status={acc.trackingStatus} />}
                </div>

                {isConnected && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-muted-foreground">Account ID</p><p className="font-mono font-medium mt-0.5">{acc.accountId}</p></div>
                    <div><p className="text-muted-foreground">Currency</p><p className="font-medium mt-0.5">{acc.currency}</p></div>
                    <div><p className="text-muted-foreground">Access Level</p><p className="font-medium mt-0.5">{acc.accessLevel}</p></div>
                    <div><p className="text-muted-foreground">Last Sync</p><p className="font-medium mt-0.5">{acc.lastSync}</p></div>
                    <div><p className="text-muted-foreground">Campaigns</p><p className="font-medium mt-0.5">{acc.imported} imported</p></div>
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-muted-foreground">
                    {isComingSoon
                      ? "Yahoo Japan Search Ads API integration is planned for Q3. You can pre-configure credentials in API Connections."
                      : "Connect your account to import campaigns, sync performance data, and enable automated bid/budget actions."
                    }
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  {isConnected && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"><RefreshCw size={11} /> Sync Now</Button>
                      <Button size="sm" variant="outline" className="h-7 px-3 text-xs gap-1" onClick={() => {}}>Import Campaigns</Button>
                    </>
                  )}
                  {!isConnected && !isComingSoon && (
                    <Link href="/settings/api-connections">
                      <Button size="sm" className="h-7 px-3 text-xs gap-1"><Plus size={11} /> Connect Account</Button>
                    </Link>
                  )}
                  {isComingSoon && (
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs" disabled>Notify Me</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Keywords Tab ─────────────────────────────────────────────────────────────

function KeywordsTab() {
  const keywords = [
    { term: "marketing automation software", type: "non_brand", matchType: "Exact", campaign: "Non-Brand — Growth APAC", cpc: 4.12, impressions: 8420, clicks: 312, conv: 28, quality: 8 },
    { term: "spark ai marketing", type: "brand", matchType: "Phrase", campaign: "Brand Search — Core", cpc: 1.82, impressions: 12400, clicks: 892, conv: 156, quality: 10 },
    { term: "hubspot alternative", type: "competitor", matchType: "Exact", campaign: "Competitor Conquest — SEMrush", cpc: 6.21, impressions: 2100, clicks: 98, conv: 8, quality: 6 },
    { term: "crm software for small business", type: "non_brand", matchType: "Broad", campaign: "Non-Brand — Growth APAC", cpc: 2.85, impressions: 34200, clicks: 412, conv: 19, quality: 5 },
    { term: "ai campaign management", type: "product", matchType: "Phrase", campaign: "Lead Gen — Enterprise Search", cpc: 3.44, impressions: 0, clicks: 0, conv: 0, quality: 7 },
  ];

  const negatives = [
    "free", "open source", "tutorial", "how to", "reddit", "youtube", "course", "certification", "jobs", "career",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search keywords…" className="pl-8 h-8 text-sm" />
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Wand2 size={12} /> AI Keyword Suggestions</Button>
        <Button size="sm" className="h-8 gap-1.5 text-xs ml-auto"><Plus size={12} /> Add Keywords</Button>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <CardTitle className="text-sm">Active Keywords</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Keyword", "Type", "Match Type", "Campaign", "CPC", "Impressions", "Clicks", "Conv.", "Quality Score"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-card/60">
                    <td className="px-4 py-2.5 font-mono text-xs">{kw.term}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-xs border-0 ${kw.type === "brand" ? "bg-blue-500/15 text-blue-300" : kw.type === "competitor" ? "bg-red-500/15 text-red-300" : "bg-muted/30 text-muted-foreground"}`}>
                        {kw.type.replace("_", "-")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{kw.matchType}</Badge></td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{kw.campaign}</td>
                    <td className="px-4 py-2.5 text-right text-xs">${kw.cpc}</td>
                    <td className="px-4 py-2.5 text-right text-xs">{kw.impressions > 0 ? kw.impressions.toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs">{kw.clicks > 0 ? kw.clicks.toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium text-primary">{kw.conv > 0 ? kw.conv : "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 h-1.5 bg-muted/40 rounded-full">
                          <div className={`h-full rounded-full ${kw.quality >= 8 ? "bg-green-400" : kw.quality >= 6 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${kw.quality * 10}%` }} />
                        </div>
                        <span className="text-xs">{kw.quality}/10</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-red-300">Negative Keywords</CardTitle>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Wand2 size={11} /> AI Suggestions</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {negatives.map((n) => (
              <Badge key={n} variant="outline" className="text-xs border-red-500/30 text-red-300 bg-red-500/10 gap-1">
                <XCircle size={10} /> {n}
              </Badge>
            ))}
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1 text-muted-foreground"><Plus size={10} /> Add negative</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Bidding & Budget Tab ─────────────────────────────────────────────────────

function BiddingBudgetTab({ campaigns }: { campaigns: SearchCampaign[] }) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {campaigns.filter((c) => c.budget > 0).map((c) => {
          const pct = Math.round((c.spend / c.budget) * 100);
          return (
            <Card key={c.id} className="border-border/60 bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <PlatformBadge platform={c.platform} />
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Monthly Budget</p><p className="font-bold text-base">${c.budget.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Spent</p><p className={`font-bold text-base ${pct > 90 ? "text-red-400" : "text-foreground"}`}>${c.spend.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Remaining</p><p className="font-bold text-base text-green-400">${(c.budget - c.spend).toLocaleString()}</p></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Budget Pacing</span>
                    <span className={pct > 90 ? "text-red-400" : pct > 70 ? "text-amber-400" : "text-muted-foreground"}>{pct}% used</span>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full">
                    <div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Edit size={11} /> Adjust Budget</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary"><Wand2 size={11} /> AI Suggestion</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Lightbulb size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">AI Budget Recommendation</p>
            <p className="text-xs text-muted-foreground mt-1">Shift $3,000 from "Competitor Conquest" (ROAS 1.8x) to "Brand Search — Core" (ROAS 6.1x) to improve blended return by an estimated 24% without increasing total spend.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs">Apply Recommendation</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs">Dismiss</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Ads & Extensions Tab ─────────────────────────────────────────────────────

function AdsExtensionsTab({ onGenerateCopy }: { onGenerateCopy: () => void }) {
  const ads = [
    { campaign: "Brand Search — Core", headlines: ["SPARK AI — Marketing Suite", "AI-Powered Campaign Manager", "Free 14-Day Trial"], descriptions: ["Plan, launch and optimise campaigns with AI. No agency needed.", "Connect Google, Meta, LinkedIn and more from one command centre."], ctr: 5.4, status: "approved" },
    { campaign: "Non-Brand — Growth APAC", headlines: ["Best Marketing Automation 2025", "Replace 6 Tools With One Platform", "Start Free — No Credit Card"], descriptions: ["SPARK AI plans campaigns, writes copy, and optimises spend automatically.", "Used by 2,000+ marketing teams across APAC. Try free today."], ctr: 2.8, status: "approved" },
    { campaign: "Competitor Conquest — SEMrush", headlines: ["Better Than SEMrush?", "Compare SPARK vs Competitors", "Switch Today — Easy Migration"], descriptions: ["SPARK AI does more than SEO tools. Full campaign management + AI insights.", "Free migration support. See why teams are switching to SPARK AI."], ctr: 1.9, status: "pending" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={onGenerateCopy}><Wand2 size={12} /> Generate Search Ad Copy</Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"><Plus size={12} /> Generate Extensions</Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"><Shield size={12} /> Send for Creative Approval</Button>
      </div>
      <div className="space-y-4">
        {ads.map((ad, i) => (
          <Card key={i} className="border-border/60 bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{ad.campaign}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">CTR: <span className="text-foreground font-medium">{ad.ctr}%</span></span>
                  <ApprovalBadge status={ad.status as any} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Headlines</p>
                <div className="flex flex-wrap gap-2">
                  {ad.headlines.map((h, j) => (
                    <span key={j} className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary">{h}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Descriptions</p>
                <div className="space-y-1.5">
                  {ad.descriptions.map((d, j) => (
                    <p key={j} className="text-xs bg-card/80 border border-border/40 rounded px-2 py-1.5">{d}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Extensions <span className="text-primary">(placeholders)</span></p>
                <div className="flex gap-2">
                  {["Callouts", "Sitelinks", "Structured Snippets"].map((ext) => (
                    <Badge key={ext} variant="outline" className="text-xs border-border/40 text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-primary transition-colors">+ {ext}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI Recommendations Tab ───────────────────────────────────────────────────

function AIRecommendationsTab() {
  const recs = [
    { type: "Negative Keyword", priority: "high", title: "Add 14 negative keywords to reduce wasted spend", desc: "Queries like \"free\", \"open source\", and \"tutorial\" are consuming 18% of budget with 0 conversions. Estimated monthly saving: $1,840.", campaign: "Non-Brand — Growth APAC", icon: <XCircle size={14} className="text-red-400" /> },
    { type: "Budget", priority: "high", title: "Shift budget from Competitor Conquest to Brand Search", desc: "Brand Search is returning 6.1x ROAS vs 1.8x for Competitor Conquest. Reallocating $3,000/month could improve blended ROAS by 24%.", campaign: "Global", icon: <DollarSign size={14} className="text-amber-400" /> },
    { type: "Bid Strategy", priority: "medium", title: "Switch Competitor Conquest to Target CPA bidding", desc: "Manual CPC is underperforming. Switching to Target CPA ($120) could increase qualified lead volume by an estimated 15% at flat spend.", campaign: "Competitor Conquest — SEMrush", icon: <TrendingUp size={14} className="text-primary" /> },
    { type: "Tracking", priority: "high", title: "Fix missing GA4 conversion event before launch", desc: "Lead Gen — Enterprise Search is missing a primary GA4 conversion event. Launching without tracking means no Smart Bidding data. Do not launch until resolved.", campaign: "Lead Gen — Enterprise Search", icon: <AlertCircle size={14} className="text-red-400" /> },
    { type: "Ad Copy", priority: "medium", title: "Generate new ad copy for Competitor Conquest (CTR 1.9%)", desc: "CTR is 65% below account average. A/B testing two new headline variants could recover 40+ clicks/day. Click Generate to create AI suggestions.", campaign: "Competitor Conquest — SEMrush", icon: <Wand2 size={14} className="text-primary" /> },
    { type: "Landing Page", priority: "medium", title: "Improve landing page before increasing Non-Brand budget", desc: "Conversion rate on the non-brand landing page is 2.1% vs 4.8% for brand. Fixing form load time and adding social proof could increase leads by 30%.", campaign: "Non-Brand — Growth APAC", icon: <Globe size={14} className="text-cyan-400" /> },
    { type: "Keyword", priority: "low", title: "Create competitor search campaign for HubSpot", desc: "\"hubspot alternative\" and \"hubspot vs\" have 22K monthly searches in APAC. No current campaign targeting them. Estimated 60-120 leads/month.", campaign: "Global", icon: <Target size={14} className="text-green-400" /> },
    { type: "Risk Alert", priority: "high", title: "Baidu campaign keyword localisation incomplete", desc: "Baidu Search Ads require Simplified Chinese keywords and local ad copy. Current English keywords will be rejected at review. Resolve before requesting launch.", campaign: "Baidu Brand — China Expansion", icon: <Flag size={14} className="text-red-400" /> },
  ];

  const priorityConfig = { high: "border-red-500/30 bg-red-500/5", medium: "border-amber-500/30 bg-amber-500/5", low: "border-border/60 bg-card" };
  const typeConfig: Record<string, string> = {
    "Negative Keyword": "bg-red-500/15 text-red-300", "Budget": "bg-amber-500/15 text-amber-300",
    "Bid Strategy": "bg-primary/15 text-primary", "Tracking": "bg-red-500/15 text-red-300",
    "Ad Copy": "bg-purple-500/15 text-purple-300", "Landing Page": "bg-cyan-500/15 text-cyan-300",
    "Keyword": "bg-green-500/15 text-green-300", "Risk Alert": "bg-red-500/15 text-red-300",
  };

  return (
    <div className="space-y-3">
      {recs.map((rec, i) => (
        <Card key={i} className={`border ${priorityConfig[rec.priority]}`} data-testid={`rec-${i}`}>
          <CardContent className="p-4 flex items-start gap-4">
            <div className="mt-0.5 shrink-0">{rec.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={`text-xs border-0 ${typeConfig[rec.type] ?? "bg-muted text-muted-foreground"}`}>{rec.type}</Badge>
                <Badge variant="outline" className={`text-xs ${rec.priority === "high" ? "border-red-500/30 text-red-300" : rec.priority === "medium" ? "border-amber-500/30 text-amber-300" : "border-border text-muted-foreground"}`}>{rec.priority} priority</Badge>
                <span className="text-xs text-muted-foreground">· {rec.campaign}</span>
              </div>
              <p className="text-sm font-medium">{rec.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{rec.desc}</p>
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
  const items = [
    { id: 1, title: "Budget approval — Lead Gen Enterprise Search", type: "Budget", campaign: "Lead Gen — Enterprise Search", amount: "$18,000/mo", requestedBy: "Sarah Park", requestedAt: "2h ago", status: "pending", urgency: "high" },
    { id: 2, title: "Keyword approval — Baidu Brand China", type: "Keyword", campaign: "Baidu Brand — China Expansion", amount: "142 keywords", requestedBy: "Priya Sharma", requestedAt: "4h ago", status: "pending", urgency: "medium" },
    { id: 3, title: "Ad copy approval — Competitor Conquest v2", type: "Ad Copy", campaign: "Competitor Conquest — SEMrush", amount: "6 ad variants", requestedBy: "David Lee", requestedAt: "Yesterday", status: "pending", urgency: "medium" },
    { id: 4, title: "Launch approval — Lead Gen Enterprise Search", type: "Launch", campaign: "Lead Gen — Enterprise Search", amount: "Full campaign", requestedBy: "Sarah Park", requestedAt: "2h ago", status: "pending", urgency: "high" },
    { id: 5, title: "Tracking approval — Non-Brand APAC GA4 update", type: "Tracking", campaign: "Non-Brand — Growth APAC", amount: "GA4 config change", requestedBy: "Alex Chen", requestedAt: "3d ago", status: "approved", urgency: "low" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className={`border-border/60 bg-card ${item.status === "pending" && item.urgency === "high" ? "border-amber-500/30" : ""}`} data-testid={`approval-item-${item.id}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{item.type}</Badge>
                {item.urgency === "high" && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Urgent</Badge>}
                <ApprovalBadge status={item.status as any} />
              </div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.campaign} · {item.amount} · by {item.requestedBy} · {item.requestedAt}</p>
            </div>
            {item.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10">Reject</Button>
                <Button size="sm" className="h-7 text-xs gap-1"><CheckCircle size={11} /> Approve</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const reports = [
    { title: "Campaign Performance Summary", desc: "All active paid search campaigns — spend, leads, ROAS, CPL", updated: "Today 08:00", type: "performance" },
    { title: "Platform Performance", desc: "Google Ads vs Microsoft Advertising comparison", updated: "Today 08:00", type: "platform" },
    { title: "Keyword Performance", desc: "Top keywords by conversion, CPC, and quality score", updated: "Today 08:00", type: "keyword" },
    { title: "Search Term Insights", desc: "Actual search terms triggering your ads — find negatives & opportunities", updated: "Today 08:00", type: "search_terms" },
    { title: "Budget Pacing Report", desc: "Daily spend vs budget target — 30-day pacing view", updated: "Today 08:00", type: "budget" },
    { title: "Lead Quality Report", desc: "CRM-qualified leads by campaign, keyword, and platform", updated: "Today 08:00", type: "lead_quality" },
    { title: "Ad Copy Performance", desc: "CTR, conversion rate, and approval status for all ad variants", updated: "Today 08:00", type: "ad_copy" },
    { title: "Landing Page Performance", desc: "Conversion rates and form completion by landing page and campaign", updated: "Today 08:00", type: "landing_page" },
    { title: "AI Executive Summary", desc: "Auto-generated board-ready performance summary with recommended actions", updated: "Today 08:00", type: "ai_summary" },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {reports.map((r, i) => (
        <Card key={i} className="border-border/60 bg-card hover:border-primary/30 transition-colors cursor-pointer" data-testid={`report-card-${i}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText size={14} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{r.updated}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1"><Eye size={11} /> View</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2"><Download size={11} /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Landing Page & Tracking Tab ──────────────────────────────────────────────

function LandingTrackingTab({ campaigns }: { campaigns: SearchCampaign[] }) {
  return (
    <div className="space-y-4">
      {campaigns.filter((c) => c.status === "live" || c.status === "optimising").map((c) => (
        <Card key={c.id} className="border-border/60 bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{c.name}</p>
              <div className="flex items-center gap-2">
                <PlatformBadge platform={c.platform} />
                <TrackingBadge status={c.trackingStatus} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Landing Page URL</p>
                <code className="text-foreground font-mono text-xs bg-muted/20 px-2 py-1 rounded block truncate">https://sparkapp.io/lp/{c.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}</code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">GA4 Conversion Event</p>
                <code className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded block">generate_lead</code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">UTM Template</p>
                <code className="text-foreground font-mono text-xs bg-muted/20 px-2 py-1 rounded block truncate">utm_source={c.platform.toLowerCase().split(" ")[0]}&utm_medium=cpc</code>
              </div>
            </div>
            {c.trackingStatus === "warning" && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <AlertCircle size={12} className="shrink-0" />
                GA4 event firing intermittently — check dataLayer push on form submit.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 9-Step Wizard ────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  "Campaign Identity", "Objective", "Search Platform & Account",
  "Keywords", "Bidding & Budget", "Landing Page & Tracking",
  "Search Ads & Extensions", "AI Search Plan Review", "Approval & Launch",
];

function CampaignWizard({ open, onClose, editCampaign }: { open: boolean; onClose: () => void; editCampaign?: SearchCampaign }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: editCampaign?.name ?? "",
    source: editCampaign?.source ?? "standalone",
    type: editCampaign?.type ?? "non_brand",
    tags: editCampaign?.tags ?? [],
    owner: editCampaign?.owner ?? "Alex Chen",
    objective: "leads",
    targetCpl: "120",
    targetCpa: "80",
    platform: editCampaign?.platform ?? "Google Ads",
    accessLevel: "execute",
    brandKeywords: "spark ai, spark ai marketing, spark ai platform",
    nonBrandKeywords: "marketing automation software, ai campaign management",
    competitorKeywords: "hubspot alternative, marketo alternative",
    negativeKeywords: "free, tutorial, open source, jobs",
    matchType: "exact",
    budget: editCampaign?.budget?.toString() ?? "15000",
    dailyBudget: "500",
    bidStrategy: "target_cpa",
    maxCpc: "8",
    landingPage: "https://sparkapp.io/lp/campaign",
    ga4Event: "generate_lead",
    utmSource: "",
    headline1: "SPARK AI — Marketing Suite",
    headline2: "AI-Powered Campaign Manager",
    headline3: "Free 14-Day Trial",
    desc1: "Plan, launch and optimise campaigns with AI. No agency needed.",
    desc2: "Connect Google, Meta, LinkedIn and more from one command centre.",
  });

  const isEdit = !!editCampaign;
  const pct = Math.round(((step + 1) / WIZARD_STEPS.length) * 100);

  const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleFinish = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSaving(false);
    toast({ title: isEdit ? "Campaign updated" : "Campaign created", description: isEdit ? "Changes saved and submitted for approval." : "New paid search campaign draft created." });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-4">
          <div><Label className="text-xs">Campaign Name *</Label><Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Brand Search — Core Q2" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Campaign Source</Label>
              <Select value={form.source} onValueChange={(v) => setField("source", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Campaign Type</Label>
              <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Owner</Label><Input value={form.owner} onChange={(e) => setField("owner", e.target.value)} className="mt-1" /></div>
          <div>
            <Label className="text-xs">Marketing Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Q2 Growth", "Singapore SMEs", "High Intent", "Urgent Push", "Board Approved", "Budget Sensitive", "Test Campaign"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setField("tags", form.tags.includes(tag) ? form.tags.filter((t: string) => t !== tag) : [...form.tags, tag])}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${form.tags.includes(tag) ? (TAG_COLORS[tag] ?? "bg-primary/20 border-primary/40 text-primary") : "border-border/50 text-muted-foreground hover:border-border"}`}
                >{tag}</button>
              ))}
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Campaign Objective</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["leads", "Generate Leads"], ["sales", "Drive Sales"], ["traffic", "Website Traffic"], ["appointments", "Book Appointments"], ["brand_protection", "Brand Protection"], ["competitor_conquest", "Competitor Conquest"]].map(([v, l]) => (
                <button key={v} onClick={() => setField("objective", v)} className={`text-left p-3 rounded-lg border text-sm transition-colors ${form.objective === v ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-border"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs">Target CPL ($)</Label><Input value={form.targetCpl} onChange={(e) => setField("targetCpl", e.target.value)} className="mt-1" type="number" /></div>
            <div><Label className="text-xs">Target CPA ($)</Label><Input value={form.targetCpa} onChange={(e) => setField("targetCpa", e.target.value)} className="mt-1" type="number" /></div>
          </div>
          <div><Label className="text-xs">Primary Conversion Event</Label>
            <Select defaultValue="lead_form">
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead_form">Lead Form Submit</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="appointment">Appointment Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Search Platform</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {(["Google Ads", "Microsoft Advertising", "Baidu", "Naver", "Yahoo Japan"] as Platform[]).map((p) => {
                const cfg = PLATFORM_CONFIG[p];
                return (
                  <button
                    key={p}
                    onClick={() => cfg.status !== "coming_soon" && setField("platform", p)}
                    disabled={cfg.status === "coming_soon"}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${form.platform === p ? "border-primary/60 bg-primary/10" : "border-border/60 hover:border-border"} ${cfg.status === "coming_soon" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`font-medium ${cfg.color}`}>{p}</span>
                    <Badge variant="outline" className={`text-xs ${cfg.status === "connected" ? "border-green-500/30 text-green-300" : cfg.status === "coming_soon" ? "border-purple-500/30 text-purple-300" : "border-border text-muted-foreground"}`}>
                      {cfg.status === "connected" ? "Connected" : cfg.status === "coming_soon" ? "Coming Soon" : "Not Connected"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs">Access Level</Label>
            <Select value={form.accessLevel} onValueChange={(v) => setField("accessLevel", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="read_only">Read Only</SelectItem>
                <SelectItem value="draft">Draft Only</SelectItem>
                <SelectItem value="execute">Full Execute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-4">
          <div><Label className="text-xs">Brand Keywords (one per line)</Label><Textarea value={form.brandKeywords} onChange={(e) => setField("brandKeywords", e.target.value)} className="mt-1 font-mono text-xs h-20" /></div>
          <div><Label className="text-xs">Non-Brand Keywords</Label><Textarea value={form.nonBrandKeywords} onChange={(e) => setField("nonBrandKeywords", e.target.value)} className="mt-1 font-mono text-xs h-20" /></div>
          <div><Label className="text-xs">Competitor Keywords</Label><Textarea value={form.competitorKeywords} onChange={(e) => setField("competitorKeywords", e.target.value)} className="mt-1 font-mono text-xs h-16" /></div>
          <div><Label className="text-xs text-red-400">Negative Keywords</Label><Textarea value={form.negativeKeywords} onChange={(e) => setField("negativeKeywords", e.target.value)} className="mt-1 font-mono text-xs h-16 border-red-500/20" /></div>
          <div>
            <Label className="text-xs">Default Match Type</Label>
            <div className="flex gap-2 mt-2">
              {["exact", "phrase", "broad"].map((m) => (
                <button key={m} onClick={() => setField("matchType", m)} className={`px-3 py-1.5 rounded text-xs capitalize border transition-colors ${form.matchType === m ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{m}</button>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 w-full"><Wand2 size={12} /> Get AI Keyword Suggestions</Button>
        </div>
      );

      case 4: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs">Monthly Budget ($)</Label><Input value={form.budget} onChange={(e) => setField("budget", e.target.value)} type="number" className="mt-1" /></div>
            <div><Label className="text-xs">Daily Budget ($)</Label><Input value={form.dailyBudget} onChange={(e) => setField("dailyBudget", e.target.value)} type="number" className="mt-1" /></div>
          </div>
          <div>
            <Label className="text-xs">Bid Strategy</Label>
            <Select value={form.bidStrategy} onValueChange={(v) => setField("bidStrategy", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="target_cpa">Target CPA</SelectItem>
                <SelectItem value="target_roas">Target ROAS</SelectItem>
                <SelectItem value="maximize_conversions">Maximize Conversions</SelectItem>
                <SelectItem value="maximize_clicks">Maximize Clicks</SelectItem>
                <SelectItem value="manual_cpc">Manual CPC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Max CPC Cap ($)</Label><Input value={form.maxCpc} onChange={(e) => setField("maxCpc", e.target.value)} type="number" className="mt-1" /></div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-start gap-2">
              <Lightbulb size={13} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground"><span className="text-primary font-medium">AI Suggestion:</span> Based on your $120 CPL target and historical account data, a Target CPA of $80 with $500/day pacing should yield 90-110 leads/month at current keyword competition levels.</p>
            </CardContent>
          </Card>
        </div>
      );

      case 5: return (
        <div className="space-y-4">
          <div><Label className="text-xs">Landing Page URL *</Label><Input value={form.landingPage} onChange={(e) => setField("landingPage", e.target.value)} className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">GA4 Conversion Event</Label><Input value={form.ga4Event} onChange={(e) => setField("ga4Event", e.target.value)} placeholder="e.g. generate_lead" className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">CRM Lead Source Mapping</Label>
            <Select defaultValue="ppc_search">
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ppc_search">PPC — Paid Search</SelectItem>
                <SelectItem value="ppc_brand">PPC — Brand Search</SelectItem>
                <SelectItem value="ppc_competitor">PPC — Competitor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">UTM Template</Label><Input placeholder="utm_source=google&utm_medium=cpc&utm_campaign={campaign_name}" className="mt-1 font-mono text-xs" /></div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlertCircle size={12} className="shrink-0" /> Call tracking is not yet configured. Add a Twilio number in API Connections to enable call attribution.
          </div>
        </div>
      );

      case 6: return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div><Label className="text-xs">Headline 1 (max 30 chars)</Label><Input value={form.headline1} onChange={(e) => setField("headline1", e.target.value)} maxLength={30} className="mt-1" /></div>
            <div><Label className="text-xs">Headline 2</Label><Input value={form.headline2} onChange={(e) => setField("headline2", e.target.value)} maxLength={30} className="mt-1" /></div>
            <div><Label className="text-xs">Headline 3</Label><Input value={form.headline3} onChange={(e) => setField("headline3", e.target.value)} maxLength={30} className="mt-1" /></div>
            <div><Label className="text-xs">Description 1 (max 90 chars)</Label><Textarea value={form.desc1} onChange={(e) => setField("desc1", e.target.value)} maxLength={90} className="mt-1 h-16 text-xs" /></div>
            <div><Label className="text-xs">Description 2</Label><Textarea value={form.desc2} onChange={(e) => setField("desc2", e.target.value)} maxLength={90} className="mt-1 h-16 text-xs" /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Wand2 size={11} /> Generate Ad Copy</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus size={11} /> Add Sitelinks</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus size={11} /> Add Callouts</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Shield size={11} /> Request Creative Approval</Button>
          </div>
        </div>
      );

      case 7: return (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
            <Brain size={14} className="text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">SPARK AI has generated your paid search plan based on the inputs above. Review and adjust before proceeding to approval.</p>
          </div>
          {[
            { label: "Campaign Structure", value: "Single account — Google Ads. 3 ad groups: Brand Core, Non-Brand Exact, Non-Brand Phrase." },
            { label: "Platform Recommendation", value: "Google Ads for primary volume. Add Microsoft Advertising (Bing) in Month 2 for ~15% additional reach at 30% lower CPCs." },
            { label: "Keyword Strategy", value: `${form.brandKeywords.split(",").length} brand, ${form.nonBrandKeywords.split(",").length} non-brand, ${form.competitorKeywords.split(",").length} competitor terms. Exact match priority with phrase match secondary.` },
            { label: "Negative Keywords", value: `${form.negativeKeywords.split(",").length} negatives configured. Recommend reviewing search terms after 7 days live.` },
            { label: "Budget Recommendation", value: `$${Number(form.budget).toLocaleString()}/month. $${form.dailyBudget}/day with Balanced pacing. Expect ${Math.round(Number(form.budget) / Number(form.targetCpa))}–${Math.round(Number(form.budget) / Number(form.targetCpa) * 1.3)} leads/month.` },
            { label: "Bidding Recommendation", value: `Start with Target CPA ($${form.targetCpa}) with Max CPC cap of $${form.maxCpc}. Switch to Target ROAS after 50+ conversions.` },
            { label: "Landing Page", value: "Current LP conversion rate is 3.2%. Recommend A/B testing a shorter form (2 fields) against current 5-field form before scaling." },
            { label: "Tracking Checklist", value: "GA4 event: configured. UTM tagging: configured. CRM source mapping: configured. Call tracking: NOT configured." },
            { label: "Risk Flags", value: "⚠ Call tracking missing — phone leads will not be attributed. ⚠ No RLSA audiences configured yet — add after 30 days." },
          ].map((item) => (
            <div key={item.label} className="grid grid-cols-[140px_1fr] gap-3 text-xs">
              <p className="text-muted-foreground font-medium">{item.label}</p>
              <p className="text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      );

      case 8: return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Complete the approval checklist before launching.</p>
          {[
            { label: "Budget Approved", checked: false, required: true },
            { label: "Keywords Approved", checked: true, required: true },
            { label: "Ad Copy Approved", checked: false, required: true },
            { label: "Tracking Verified", checked: true, required: true },
            { label: "Landing Page Approved", checked: true, required: false },
            { label: "Launch Approved", checked: false, required: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.checked ? <CheckCircle size={16} className="text-green-400 shrink-0" /> : <XCircle size={16} className="text-muted-foreground shrink-0" />}
              <span className={`text-sm ${item.checked ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
              {item.required && !item.checked && <Badge variant="outline" className="text-xs border-red-500/30 text-red-300 ml-auto">Required</Badge>}
              {item.checked && <Badge variant="outline" className="text-xs border-green-500/30 text-green-300 ml-auto">Done</Badge>}
            </div>
          ))}
          <Separator className="bg-border/40" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><FileText size={13} /> Save Draft</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Bell size={13} /> Request Approval</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Play size={13} /> Simulate Launch</Button>
            <Button size="sm" className="gap-1.5"><RefreshCw size={13} /> Simulate Sync to Platform</Button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MonitorPlay size={16} className="text-primary" />
            {isEdit ? "Edit" : "New"} Search Campaign
          </DialogTitle>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step + 1} of {WIZARD_STEPS.length}: <span className="text-foreground font-medium">{WIZARD_STEPS[step]}</span></span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
              {WIZARD_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`shrink-0 text-xs px-2 py-0.5 rounded transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-muted/60 text-foreground" : "text-muted-foreground"}`}
                >{i + 1}</button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-2">
          {renderStep()}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/40 pt-4 mt-2">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="gap-1.5">
            <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < WIZARD_STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="gap-1.5">
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Campaign"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generate Ad Copy Dialog ──────────────────────────────────────────────────

function GenerateCopyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setResults([
      { platform: "Google Ads", headline1: "SPARK AI — Marketing Suite", headline2: "AI Plans Your Campaigns", desc: `${product || "AI-powered marketing"} for ${audience || "growth teams"}. Plan, launch and optimise from one platform.` },
      { platform: "Google Ads", headline1: "Replace Your Agency With AI", headline2: "Free 14-Day Trial", desc: `${product || "SPARK AI"} automates campaign planning, keyword research and ad copy. No expertise required.` },
      { platform: "Microsoft Advertising", headline1: "Best Marketing AI Platform", headline2: "Start Free Today", desc: `${product || "Marketing automation"} powered by AI. Connect Google, Bing and more. 2,000+ teams trust SPARK AI.` },
    ]);
    setLoading(false);
  };

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 size={16} className="text-primary" /> Generate Search Ad Copy</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-xs">Product / Service</Label><Input placeholder="e.g. SPARK AI — AI marketing platform" value={product} onChange={(e) => setProduct(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Target Audience</Label><Input placeholder="e.g. Marketing managers at B2B SaaS companies" value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1" /></div>
          <div>
            <Label className="text-xs">Tone</Label>
            <div className="flex gap-2 mt-1">
              {["professional", "urgent", "friendly", "bold"].map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`text-xs px-3 py-1.5 rounded border capitalize transition-colors ${tone === t ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          {results.length > 0 && (
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/60 bg-card/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{r.platform}</Badge>
                    <button onClick={() => copy(`${r.headline1} | ${r.headline2}\n${r.desc}`, i)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copiedIdx === i ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-sm font-semibold">{r.headline1}</p>
                  <p className="text-xs text-primary">{r.headline2}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleGenerate} disabled={loading} data-testid="btn-generate-copy">
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Wand2 size={14} className="mr-1" />}
            {loading ? "Generating…" : "Generate Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main PPC Component ───────────────────────────────────────────────────────

export default function PPC() {
  const [campaigns] = useState<SearchCampaign[]>(CAMPAIGNS);
  const [showWizard, setShowWizard] = useState(false);
  const [editCampaign, setEditCampaign] = useState<SearchCampaign | undefined>();
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const { toast } = useToast();

  const handleNew = () => { setEditCampaign(undefined); setShowWizard(true); };
  const handleEdit = (c: SearchCampaign) => { setEditCampaign(c); setShowWizard(true); };
  const handleSync = () => { toast({ title: "Syncing search accounts…", description: "Google Ads and Microsoft Advertising are syncing." }); };

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "optimising").length;
  const totalLeads = campaigns.reduce((s, c) => s + c.conversions, 0);
  const qualifiedLeads = campaigns.reduce((s, c) => s + c.qualifiedLeads, 0);
  const avgCpc = campaigns.filter((c) => c.avgCpc > 0).reduce((s, c, _, a) => s + c.avgCpc / a.length, 0);
  const trackingIssues = campaigns.filter((c) => c.trackingStatus !== "ok").length;
  const aiOpportunities = 8;

  const kpis = [
    { label: "Active Campaigns", value: activeCampaigns, color: "text-primary", icon: <Play size={14} className="text-primary" /> },
    { label: "Monthly Spend", value: `$${(totalSpend / 1000).toFixed(1)}k`, color: "text-amber-400", icon: <DollarSign size={14} className="text-amber-400" /> },
    { label: "Budget Remaining", value: `$${((totalBudget - totalSpend) / 1000).toFixed(1)}k`, color: "text-green-400", icon: <TrendingUp size={14} className="text-green-400" /> },
    { label: "Avg CPC", value: `$${avgCpc.toFixed(2)}`, color: "text-muted-foreground", icon: <BarChart2 size={14} className="text-muted-foreground" /> },
    { label: "Cost per Lead", value: `$${(totalSpend / (totalLeads || 1)).toFixed(0)}`, color: "text-muted-foreground", icon: <Target size={14} className="text-muted-foreground" /> },
    { label: "Qualified Leads", value: qualifiedLeads, color: "text-accent", icon: <CheckCircle size={14} className="text-accent" /> },
    { label: "Tracking Issues", value: trackingIssues, color: trackingIssues > 0 ? "text-red-400" : "text-green-400", icon: <AlertCircle size={14} className={trackingIssues > 0 ? "text-red-400" : "text-green-400"} /> },
    { label: "AI Opportunities", value: aiOpportunities, color: "text-purple-400", icon: <Zap size={14} className="text-purple-400" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-ppc">
            <MonitorPlay size={20} className="text-primary" /> PPC / Paid Search Workbench
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Plan, connect, launch, optimise, and report on paid search campaigns across Google, Bing, Baidu, Naver, and other search ad platforms.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={handleNew} className="gap-1.5 text-xs h-8"><Plus size={13} /> New Search Campaign</Button>
          <Button variant="outline" className="gap-1.5 text-xs h-8"><Upload size={13} /> Import from Network</Button>
          <Button variant="outline" className="gap-1.5 text-xs h-8" onClick={handleSync}><RefreshCw size={13} /> Sync Accounts</Button>
          <Button variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setShowCopyDialog(true)}><Wand2 size={13} /> Generate Ad Copy</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">{kpi.icon}<p className="text-xs text-muted-foreground truncate">{kpi.label}</p></div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Board */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Campaign Workflow Status</p>
        <WorkflowBoard campaigns={campaigns} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-0.5 p-1">
          {["campaigns", "plan", "accounts", "keywords", "bidding", "ads", "tracking", "recommendations", "approvals", "reports"].map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs capitalize" data-testid={`tab-${t}`}>
              {t === "campaigns" ? "Campaigns" : t === "plan" ? "Create / Plan" : t === "accounts" ? "Search Ad Accounts" : t === "keywords" ? "Keywords" : t === "bidding" ? "Bidding & Budget" : t === "ads" ? "Ads & Extensions" : t === "tracking" ? "Landing Page & Tracking" : t === "recommendations" ? "AI Recommendations" : t === "approvals" ? "Approvals" : "Reports"}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="campaigns"><CampaignsTab campaigns={campaigns} onEdit={handleEdit} onNew={handleNew} /></TabsContent>
          <TabsContent value="plan">
            <Card className="border-border/60 bg-card">
              <CardContent className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Create a New Search Campaign</p>
                  <p className="text-sm text-muted-foreground mt-1">Use the 9-step wizard to plan, configure, and launch a paid search campaign from scratch or link it to an existing SPARK master campaign.</p>
                </div>
                <Button onClick={handleNew} className="gap-1.5"><Plus size={14} /> New Search Campaign</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="accounts"><SearchAdAccountsTab /></TabsContent>
          <TabsContent value="keywords"><KeywordsTab /></TabsContent>
          <TabsContent value="bidding"><BiddingBudgetTab campaigns={campaigns} /></TabsContent>
          <TabsContent value="ads"><AdsExtensionsTab onGenerateCopy={() => setShowCopyDialog(true)} /></TabsContent>
          <TabsContent value="tracking"><LandingTrackingTab campaigns={campaigns} /></TabsContent>
          <TabsContent value="recommendations"><AIRecommendationsTab /></TabsContent>
          <TabsContent value="approvals"><ApprovalsTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </div>
      </Tabs>

      <CampaignWizard open={showWizard} onClose={() => setShowWizard(false)} editCampaign={editCampaign} />
      <GenerateCopyDialog open={showCopyDialog} onClose={() => setShowCopyDialog(false)} />
    </div>
  );
}
