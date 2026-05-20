import { useParams, useLocation } from "wouter";
import {
  useGetCampaign,
  useSubmitCampaignForApproval,
  getGetCampaignQueryKey,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, CheckCircle, Clock, SendHorizonal, AlertTriangle,
  Target, MapPin, Globe, DollarSign, Zap, BarChart2, Shield,
  Hash, TrendingUp, AlertCircle, Info,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:            { bg: "bg-muted/40",        text: "text-muted-foreground", dot: "bg-muted-foreground" },
  planning:         { bg: "bg-blue-500/15",     text: "text-blue-300",         dot: "bg-blue-400" },
  awaiting_approval:{ bg: "bg-amber-500/15",    text: "text-amber-300",        dot: "bg-amber-400" },
  ready_to_launch:  { bg: "bg-emerald-500/15",  text: "text-emerald-300",      dot: "bg-emerald-400" },
  active:           { bg: "bg-emerald-500/15",  text: "text-emerald-300",      dot: "bg-emerald-400" },
  optimising:       { bg: "bg-primary/15",      text: "text-primary",          dot: "bg-primary" },
  paused:           { bg: "bg-muted/40",        text: "text-muted-foreground", dot: "bg-muted-foreground" },
  completed:        { bg: "bg-muted/20",        text: "text-muted-foreground/70", dot: "bg-muted-foreground/50" },
};

const PROVIDER_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  microsoft_advertising: "Microsoft Advertising",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ReadinessGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const ring = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4" className="stroke-muted/30" />
          <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4" className={ring}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>{score}%</span>
      </div>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

function SectionCard({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        {Icon && <Icon size={13} className="text-primary/70" />}
        <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-widest">{label}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KeywordThemeRow({ theme }: { theme: any }) {
  const intentColors: Record<string, string> = {
    Brand: "text-blue-400 bg-blue-400/10",
    "High Intent": "text-emerald-400 bg-emerald-400/10",
    Product: "text-violet-400 bg-violet-400/10",
    Competitor: "text-red-400 bg-red-400/10",
    Local: "text-cyan-400 bg-cyan-400/10",
    Informational: "text-slate-400 bg-slate-400/10",
  };
  const ic = intentColors[theme.intent] ?? "text-muted-foreground bg-muted/20";
  return (
    <div className="py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ic}`}>{theme.intent}</span>
        <span className="text-sm font-medium">{theme.name}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(theme.keywords ?? []).map((kw: string) => (
          <span key={kw} className="text-[11px] px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground font-mono">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const numId = parseInt(id);

  const { data: campaign, isLoading } = useGetCampaign(numId, {
    query: { enabled: !!numId, queryKey: getGetCampaignQueryKey(numId) },
  });

  const submitApproval = useSubmitCampaignForApproval({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(numId) });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6"><p className="text-muted-foreground">Campaign not found.</p></div>;
  }

  const bp = campaign.blueprint as any;
  const providerDrafts = (campaign as any).providerDrafts ?? [];
  const canSubmit = campaign.status === "draft" || campaign.status === "planning";

  // KPIs
  const kpis = [
    { label: "Budget", value: `$${campaign.budget.toLocaleString()}`, sub: campaign.dailyBudget ? `$${campaign.dailyBudget.toLocaleString()}/day` : null },
    { label: "Spend", value: campaign.spend != null ? `$${campaign.spend.toLocaleString()}` : "—", sub: campaign.spend && campaign.budget ? `${((campaign.spend / campaign.budget) * 100).toFixed(0)}% used` : null },
    { label: "Leads", value: campaign.leadsGenerated != null ? campaign.leadsGenerated.toLocaleString() : "—", sub: null },
    { label: "Health", value: campaign.healthScore != null ? `${campaign.healthScore}/100` : "—", sub: campaign.healthScore ? (campaign.healthScore >= 80 ? "Good" : campaign.healthScore >= 60 ? "Fair" : "At risk") : null },
  ];

  return (
    <div className="min-h-full bg-[#0b0d14]">
      {/* ── Header ─── */}
      <div className="sticky top-0 z-10 bg-[#0b0d14]/95 backdrop-blur border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/campaigns")}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold truncate" data-testid="heading-campaign-name">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-muted-foreground text-xs mt-0.5 capitalize">
              {((campaign as any).primaryObjective ?? campaign.objective).replace(/_/g, " ")}
              {(campaign as any).geography ? ` · ${(campaign as any).geography}` : ""}
              {" · "}${ (campaign.budget / 1000).toFixed(0)}k budget
            </p>
          </div>
          {canSubmit && (
            <Button
              onClick={() => submitApproval.mutate({ id: numId })}
              disabled={submitApproval.isPending}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
              data-testid="btn-submit-approval"
            >
              <SendHorizonal size={13} /> Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Strip ─── */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4" data-testid={`kpi-${k.label.toLowerCase()}`}>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
            {k.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Tabs ─── */}
      <div className="px-6 pb-8">
        <Tabs defaultValue={bp ? "blueprint" : "overview"}>
          <TabsList className="bg-white/[0.03] border border-white/[0.06] mb-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="blueprint" data-testid="tab-blueprint">Blueprint</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">Provider Readiness</TabsTrigger>
            <TabsTrigger value="approval" data-testid="tab-approval">Approval</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <SectionCard label="Campaign Details" icon={Target}>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Objective", value: ((campaign as any).primaryObjective ?? campaign.objective).replace(/_/g, " ") },
                    { label: "Start", value: campaign.startDate },
                    { label: "End", value: campaign.endDate },
                    { label: "Channels", value: (campaign.channels as string[]).join(", ") },
                    { label: "Spend Style", value: campaign.spendStyle ?? "balanced" },
                    { label: "Owner", value: (campaign as any).ownerName ?? "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <span className="text-muted-foreground shrink-0">{row.label}</span>
                      <span className="font-medium text-right capitalize">{row.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard label="Targeting & Product" icon={MapPin}>
                <div className="space-y-4 text-sm">
                  {(campaign as any).geography && (
                    <div className="flex items-start gap-2">
                      <Globe size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-[11px] mb-0.5">Geography</p>
                        <p className="font-medium">{(campaign as any).geography}</p>
                      </div>
                    </div>
                  )}
                  {campaign.targetAudience && (
                    <div>
                      <p className="text-muted-foreground text-[11px] mb-0.5">Target Audience</p>
                      <p className="leading-relaxed">{campaign.targetAudience}</p>
                    </div>
                  )}
                  {campaign.productDescription && (
                    <div>
                      <p className="text-muted-foreground text-[11px] mb-0.5">Product</p>
                      <p className="leading-relaxed">{campaign.productDescription}</p>
                    </div>
                  )}
                  {(campaign as any).landingPage && (
                    <div>
                      <p className="text-muted-foreground text-[11px] mb-0.5">Landing Page</p>
                      <p className="font-mono text-xs text-primary">{(campaign as any).landingPage}</p>
                    </div>
                  )}
                  {(campaign as any).secondaryObjectives?.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-[11px] mb-1.5">Secondary Goals</p>
                      <div className="flex flex-wrap gap-1.5">
                        {((campaign as any).secondaryObjectives as string[]).map((g) => (
                          <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── Blueprint ── */}
          <TabsContent value="blueprint" className="space-y-4">
            {!bp ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
                <p className="text-muted-foreground text-sm">No blueprint yet — use the PPC Blueprint Studio to generate one.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setLocation("/channels/ppc?new=1")}>
                  Open Blueprint Studio
                </Button>
              </div>
            ) : (
              <>
                {bp.strategicAngle && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-primary" />
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">Strategic Angle</p>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">{bp.strategicAngle}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: "Strategy Summary", icon: Target, value: bp.strategySummary },
                    { label: "Audience Strategy", icon: Target, value: bp.audienceStrategy },
                    { label: "Budget Plan", icon: DollarSign, value: bp.budgetPlan },
                    { label: "Channel Plan", icon: BarChart2, value: bp.channelPlan },
                    { label: "Creative Plan", icon: TrendingUp, value: bp.creativePlan },
                    { label: "Measurement Plan", icon: BarChart2, value: bp.measurementPlan },
                  ].map((section) => section.value ? (
                    <SectionCard key={section.label} label={section.label} icon={section.icon}>
                      <p className="text-sm leading-relaxed text-foreground/80">{section.value}</p>
                    </SectionCard>
                  ) : null)}
                </div>

                {bp.trackingPlan && (
                  <SectionCard label="Tracking Plan" icon={Shield}>
                    <p className="text-sm leading-relaxed text-foreground/80">{bp.trackingPlan}</p>
                  </SectionCard>
                )}

                {/* Platform strategy */}
                {bp.platformStrategy?.length > 0 && (
                  <SectionCard label="Platform Strategy" icon={Globe}>
                    <div className="space-y-3">
                      {bp.platformStrategy.map((p: any) => (
                        <div key={p.name} className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{p.name}</span>
                              {p.recommended && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Recommended</span>}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{p.rationale}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-primary">{p.budgetPct}%</p>
                            <p className="text-[10px] text-muted-foreground">of budget</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Keyword themes */}
                {bp.keywordThemes?.length > 0 && (
                  <SectionCard label="Keyword Themes" icon={Hash}>
                    {bp.keywordThemes.map((t: any) => <KeywordThemeRow key={t.id} theme={t} />)}
                  </SectionCard>
                )}

                {/* Negative themes */}
                {bp.negativeKeywordThemes?.length > 0 && (
                  <SectionCard label="Negative Keyword Themes" icon={Shield}>
                    <div className="space-y-3">
                      {bp.negativeKeywordThemes.map((t: any) => (
                        <div key={t.id} className="py-2 border-b border-white/[0.04] last:border-0">
                          <p className="text-sm font-medium mb-1">{t.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{t.rationale}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(t.terms ?? []).map((term: string) => (
                              <span key={term} className="text-[11px] px-2 py-0.5 rounded bg-red-400/10 text-red-400 font-mono">{term}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Ad direction */}
                {bp.adDirection && (
                  <SectionCard label="Ad Direction" icon={TrendingUp}>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Strategic Angle</p>
                        <p className="text-sm leading-relaxed">{bp.adDirection.angle}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Tone</p>
                        <p className="text-sm">{bp.adDirection.tone}</p>
                      </div>
                      {bp.adDirection.headlines?.length > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Headlines</p>
                          <div className="space-y-1.5">
                            {bp.adDirection.headlines.map((h: string, i: number) => (
                              <div key={i} className="text-sm px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] font-medium">{h}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {bp.adDirection.descriptions?.length > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Descriptions</p>
                          <div className="space-y-1.5">
                            {bp.adDirection.descriptions.map((d: string, i: number) => (
                              <div key={i} className="text-sm px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-foreground/80">{d}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* Execution checklist */}
                {bp.executionChecklist?.length > 0 && (
                  <SectionCard label="Execution Checklist" icon={CheckCircle}>
                    <div className="space-y-2">
                      {bp.executionChecklist.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Risks + Assumptions */}
                {(bp.risks?.length > 0 || bp.assumptions?.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {bp.risks?.length > 0 && (
                      <SectionCard label="Risks" icon={AlertTriangle}>
                        <div className="space-y-2">
                          {bp.risks.map((r: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                              <span className="text-foreground/80 leading-snug">{r}</span>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}
                    {bp.assumptions?.length > 0 && (
                      <SectionCard label="Assumptions" icon={Info}>
                        <div className="space-y-2">
                          {bp.assumptions.map((a: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                              <span className="text-foreground/80 leading-snug">{a}</span>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Provider Readiness ── */}
          <TabsContent value="providers" className="space-y-4">
            {providerDrafts.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
                <p className="text-muted-foreground text-sm">Provider draft readiness is generated after blueprint creation.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {providerDrafts.map((draft: any) => (
                  <div key={draft.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="font-semibold text-sm">{PROVIDER_LABELS[draft.provider] ?? draft.provider}</p>
                        <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{draft.syncStatus?.replace(/_/g, " ") ?? "Not synced"}</p>
                      </div>
                      <ReadinessGauge score={draft.readinessScore} label="Readiness" />
                    </div>

                    {draft.draftSummary && (
                      <p className="text-xs text-foreground/70 leading-relaxed mb-4">{draft.draftSummary}</p>
                    )}

                    {draft.validationIssues?.length > 0 && (
                      <div className="space-y-2">
                        {draft.validationIssues.map((issue: any, i: number) => (
                          <div key={i} className={`flex items-start gap-2 text-xs rounded-lg p-2.5 ${
                            issue.severity === "error" ? "bg-red-500/10 text-red-300" :
                            issue.severity === "warning" ? "bg-amber-500/10 text-amber-300" :
                            "bg-blue-500/10 text-blue-300"
                          }`}>
                            {issue.severity === "error" ? <AlertCircle size={12} className="shrink-0 mt-0.5" /> :
                             issue.severity === "warning" ? <AlertTriangle size={12} className="shrink-0 mt-0.5" /> :
                             <Info size={12} className="shrink-0 mt-0.5" />}
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {draft.validationIssues?.length === 0 && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 rounded-lg p-2.5">
                        <CheckCircle size={12} className="shrink-0" />
                        <span>All validation checks passed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Approval ── */}
          <TabsContent value="approval" className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="space-y-4">
                {[
                  { label: "Campaign drafted", done: true },
                  { label: "AI blueprint generated", done: !!bp },
                  { label: "Provider drafts ready", done: providerDrafts.some((d: any) => d.status === "draft_ready") },
                  { label: "Budget approval requested", done: campaign.status !== "draft" && campaign.status !== "planning" },
                  { label: "Creative assets approved", done: false },
                  { label: "Campaign approved", done: campaign.status === "ready_to_launch" || campaign.status === "active" },
                  { label: "Campaign launched", done: campaign.status === "active" || campaign.status === "optimising" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {bp?.approvalRequirements?.length > 0 && (
              <SectionCard label="Required Approvals" icon={Shield}>
                <div className="space-y-2">
                  {bp.approvalRequirements.map((req: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400/60 shrink-0" />
                      <span className="text-foreground/80">{req}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
