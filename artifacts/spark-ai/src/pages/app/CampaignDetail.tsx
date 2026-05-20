import { useParams, useLocation } from "wouter";
import {
  useGetCampaign,
  useSubmitCampaignForApproval,
  getGetCampaignQueryKey,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, CheckCircle, Clock, SendHorizonal, AlertTriangle,
  Target, Globe, DollarSign, Zap, BarChart2, Shield,
  Hash, TrendingUp, AlertCircle, Info, Sparkles, ChevronRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:             { bg: "bg-muted/30",        text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  planning:          { bg: "bg-blue-500/10",      text: "text-blue-300",         dot: "bg-blue-400" },
  awaiting_approval: { bg: "bg-amber-500/10",     text: "text-amber-300",        dot: "bg-amber-400" },
  ready_to_launch:   { bg: "bg-emerald-500/10",   text: "text-emerald-300",      dot: "bg-emerald-400" },
  active:            { bg: "bg-emerald-500/10",   text: "text-emerald-300",      dot: "bg-emerald-400" },
  optimising:        { bg: "bg-primary/10",       text: "text-primary",          dot: "bg-primary" },
  paused:            { bg: "bg-muted/30",         text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  completed:         { bg: "bg-muted/20",         text: "text-muted-foreground/60", dot: "bg-muted-foreground/30" },
};

const PROVIDER_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  microsoft_advertising: "Microsoft Advertising",
};

const INTENT_COLORS: Record<string, string> = {
  Brand:         "bg-blue-400/10 text-blue-300 border-blue-400/20",
  "High Intent": "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  Product:       "bg-violet-400/10 text-violet-300 border-violet-400/20",
  Competitor:    "bg-red-400/10 text-red-300 border-red-400/20",
  Local:         "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  Informational: "bg-slate-400/10 text-slate-300 border-slate-400/20",
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function RadialGauge({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeColor = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const textColor   = score >= 80 ? "text-emerald-400"  : score >= 60 ? "text-amber-400"  : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="5" className="stroke-white/[0.06]" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="5" className={strokeColor}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

function SectionDivider() {
  return <div className="w-full h-px bg-white/[0.05]" />;
}

// ─── Blueprint Canvas ─────────────────────────────────────────────────────────

function BlueprintCanvas({ bp }: { bp: any }) {
  if (!bp) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <Sparkles size={20} className="text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground text-sm font-medium">No blueprint generated yet</p>
      <p className="text-xs text-muted-foreground/50 mt-1.5 max-w-xs">Open the PPC Blueprint Studio to generate a campaign strategy.</p>
    </div>
  );

  return (
    <div className="space-y-14">

      {/* Strategic Angle */}
      {bp.strategicAngle && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={13} className="text-primary" />
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Strategic Angle</p>
          </div>
          <p className="text-xl leading-relaxed text-foreground/85 font-light">
            {bp.strategicAngle}
          </p>
        </section>
      )}

      <SectionDivider />

      {/* Platform Strategy */}
      {bp.platformStrategy?.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-7">Platform Strategy</p>
          <div className="space-y-4">
            {bp.platformStrategy.map((p: any) => (
              <div key={p.name} className={`p-6 rounded-2xl border ${p.recommended ? "border-white/[0.08] bg-white/[0.015]" : "border-white/[0.04] opacity-60"}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <p className="font-semibold text-base">{p.name}</p>
                      {p.recommended && (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-primary/20 text-primary bg-primary/[0.07]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold">{p.budgetPct}%</p>
                    <p className="text-xs text-muted-foreground">of budget</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.recommended ? "bg-primary" : "bg-white/20"}`} style={{ width: `${p.budgetPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {bp.platformStrategy?.length > 0 && <SectionDivider />}

      {/* Keyword Themes */}
      {bp.keywordThemes?.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-7">Keyword Themes</p>
          <div className="space-y-4">
            {bp.keywordThemes.map((t: any) => {
              const ic = INTENT_COLORS[t.intent] ?? INTENT_COLORS.Informational;
              return (
                <div key={t.id ?? t.name} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.01]">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${ic}`}>{t.intent}</span>
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(t.keywords ?? []).map((kw: string) => (
                      <span key={kw} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] text-foreground/65 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {bp.keywordThemes?.length > 0 && bp.negativeKeywordThemes?.length > 0 && <SectionDivider />}

      {/* Negative Keywords */}
      {bp.negativeKeywordThemes?.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-7">Negative Keyword Themes</p>
          <div className="space-y-3">
            {bp.negativeKeywordThemes.map((t: any) => (
              <div key={t.id ?? t.name} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                <p className="font-medium text-sm mb-1.5">{t.name}</p>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t.rationale}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(t.terms ?? []).map((term: string) => (
                    <span key={term} className="text-[11px] px-2.5 py-1 rounded-full bg-red-400/[0.07] border border-red-400/15 text-red-400/70 font-mono">{term}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {bp.negativeKeywordThemes?.length > 0 && bp.adDirection && <SectionDivider />}

      {/* Ad Direction */}
      {bp.adDirection && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-7">Ad Direction</p>
          <div className="space-y-8">
            {bp.adDirection.angle && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Creative Angle</p>
                <p className="text-base leading-relaxed text-foreground/85">{bp.adDirection.angle}</p>
              </div>
            )}
            {bp.adDirection.tone && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tone</p>
                <p className="text-sm text-foreground/70 leading-relaxed">{bp.adDirection.tone}</p>
              </div>
            )}
            {bp.adDirection.headlines?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Headlines</p>
                <div className="space-y-2">
                  {bp.adDirection.headlines.map((h: string, i: number) => (
                    <div key={i} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] font-medium text-sm">{h}</div>
                  ))}
                </div>
              </div>
            )}
            {bp.adDirection.descriptions?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Descriptions</p>
                <div className="space-y-2">
                  {bp.adDirection.descriptions.map((d: string, i: number) => (
                    <div key={i} className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-foreground/65 leading-relaxed">{d}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {bp.adDirection && (bp.trackingPlan || bp.executionChecklist?.length > 0) && <SectionDivider />}

      {/* Tracking */}
      {bp.trackingPlan && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-5">Tracking & Measurement</p>
          <p className="text-sm text-foreground/75 leading-relaxed">{bp.trackingPlan}</p>
        </section>
      )}

      {/* Execution checklist */}
      {bp.executionChecklist?.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-5">Execution Checklist</p>
          <div className="space-y-3">
            {bp.executionChecklist.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm leading-relaxed text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risks + Assumptions */}
      {(bp.risks?.length > 0 || bp.assumptions?.length > 0) && (
        <>
          <SectionDivider />
          <div className="grid md:grid-cols-2 gap-8">
            {bp.risks?.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-5">Risks</p>
                <div className="space-y-3">
                  {bp.risks.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/75 leading-snug">{r}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {bp.assumptions?.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-5">Assumptions</p>
                <div className="space-y-3">
                  {bp.assumptions.map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/75 leading-snug">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}

    </div>
  );
}

// ─── Status Sidebar ───────────────────────────────────────────────────────────

function StatusSidebar({ campaign, providerDrafts, bp, onSubmit, submitting }: {
  campaign: any;
  providerDrafts: any[];
  bp: any;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const canSubmit = campaign.status === "draft" || campaign.status === "planning";

  const approvalSteps = [
    { label: "Campaign drafted", done: true },
    { label: "AI blueprint generated", done: !!bp },
    { label: "Provider drafts ready", done: providerDrafts.some((d: any) => d.status === "draft_ready") },
    { label: "Approval submitted", done: campaign.status !== "draft" && campaign.status !== "planning" },
    { label: "Campaign approved", done: campaign.status === "ready_to_launch" || campaign.status === "active" || campaign.status === "optimising" },
  ];

  const doneCount = approvalSteps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / approvalSteps.length) * 100);

  const kpis = [
    { label: "Budget", value: `$${campaign.budget.toLocaleString()}`, sub: campaign.dailyBudget ? `$${campaign.dailyBudget.toLocaleString()}/day` : null },
    { label: "Spend", value: campaign.spend != null ? `$${campaign.spend.toLocaleString()}` : "—", sub: campaign.spend && campaign.budget ? `${((campaign.spend / campaign.budget) * 100).toFixed(0)}% used` : null },
    { label: "Leads", value: campaign.leadsGenerated != null ? campaign.leadsGenerated.toLocaleString() : "—", sub: null },
    { label: "Health", value: campaign.healthScore != null ? `${campaign.healthScore}/100` : "—", sub: null },
  ];

  return (
    <div className="w-72 shrink-0 sticky top-[73px] max-h-[calc(100vh-73px)] flex flex-col overflow-y-auto">
      <div className="p-6 space-y-8">

        {/* Campaign meta */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4">Campaign Details</p>
          <div className="space-y-2.5 text-sm">
            {[
              { label: "Objective", value: ((campaign.primaryObjective ?? campaign.objective) as string).replace(/_/g, " ") },
              { label: "Channels", value: (campaign.channels as string[]).join(", ") },
              { label: "Pacing", value: campaign.spendStyle ?? "balanced" },
              campaign.geography ? { label: "Geography", value: campaign.geography } : null,
              campaign.targetAudience ? { label: "Audience", value: campaign.targetAudience } : null,
              campaign.landingPage ? { label: "Landing Page", value: null, mono: campaign.landingPage } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex items-start gap-2 justify-between">
                <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{row.label}</span>
                {row.mono ? (
                  <span className="font-mono text-[11px] text-primary text-right truncate max-w-[140px]">{row.mono}</span>
                ) : (
                  <span className="font-medium text-xs text-right capitalize">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4">Metrics</p>
          <div className="grid grid-cols-2 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3" data-testid={`kpi-${k.label.toLowerCase()}`}>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-xl font-bold leading-tight">{k.value}</p>
                {k.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Provider Readiness */}
        {providerDrafts.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-5">Provider Readiness</p>
            <div className="flex items-center justify-around gap-4">
              {providerDrafts.map((draft: any) => (
                <div key={draft.id} className="flex flex-col items-center">
                  <RadialGauge score={draft.readinessScore} label={PROVIDER_LABELS[draft.provider] ?? draft.provider} size={72} />
                  {draft.validationIssues?.length > 0 && (
                    <span className="mt-1.5 text-[10px] text-amber-400/70">{draft.validationIssues.length} issue{draft.validationIssues.length > 1 ? "s" : ""}</span>
                  )}
                </div>
              ))}
            </div>
            {/* Validation issues (compact) */}
            {providerDrafts.some((d: any) => d.validationIssues?.length > 0) && (
              <div className="mt-4 space-y-2">
                {providerDrafts.flatMap((d: any) =>
                  (d.validationIssues ?? []).slice(0, 3).map((issue: any, i: number) => (
                    <div key={i} className={`flex items-start gap-2 text-[11px] p-2.5 rounded-lg ${
                      issue.severity === "error" ? "bg-red-500/[0.08] text-red-300" :
                      issue.severity === "warning" ? "bg-amber-500/[0.08] text-amber-300" :
                      "bg-blue-500/[0.08] text-blue-300"
                    }`}>
                      {issue.severity === "error" ? <AlertCircle size={10} className="shrink-0 mt-0.5" /> :
                       issue.severity === "warning" ? <AlertTriangle size={10} className="shrink-0 mt-0.5" /> :
                       <Info size={10} className="shrink-0 mt-0.5" />}
                      <span className="leading-snug">{issue.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Approval Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Approval Progress</p>
            <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full mb-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-400" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="space-y-3">
            {approvalSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                ) : (
                  <Clock size={13} className="text-muted-foreground/30 shrink-0" />
                )}
                <span className={`text-xs leading-snug ${step.done ? "text-foreground/70" : "text-muted-foreground/40"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Requirements from blueprint */}
        {bp?.approvalRequirements?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4">Required Approvals</p>
            <div className="space-y-2.5">
              {bp.approvalRequirements.map((req: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />
                  <span className="text-xs text-foreground/65 leading-snug">{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Goals */}
        {campaign.secondaryObjectives?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-3">Secondary Goals</p>
            <div className="flex flex-wrap gap-1.5">
              {(campaign.secondaryObjectives as string[]).map((g) => (
                <span key={g} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{g}</span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Submit button */}
      {canSubmit && (
        <div className="mt-auto p-5 border-t border-white/[0.06]">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="btn-submit-approval"
          >
            <SendHorizonal size={14} />
            {submitting ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
        <Skeleton className="h-12 w-80" />
        <div className="grid grid-cols-[1fr_288px] gap-8 mt-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Campaign not found.</p>
      </div>
    );
  }

  const bp = campaign.blueprint as any;
  const providerDrafts = (campaign as any).providerDrafts ?? [];

  return (
    <div className="min-h-full bg-[#0b0d14]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-[#0b0d14]/95 backdrop-blur border-b border-white/[0.06]">
        <div className="px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setLocation("/campaigns")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            data-testid="btn-back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold truncate" data-testid="heading-campaign-name">
                {campaign.name}
              </h1>
              <StatusPill status={campaign.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {((campaign as any).primaryObjective ?? campaign.objective).replace(/_/g, " ")}
              {(campaign as any).geography ? ` · ${(campaign as any).geography}` : ""}
              {" · "}${(campaign.budget / 1000).toFixed(0)}k budget
            </p>
          </div>
        </div>
      </div>

      {/* ── Two-Column Body ── */}
      <div className="flex gap-0">
        {/* Main canvas */}
        <div className="flex-1 min-w-0 px-8 py-10">
          <BlueprintCanvas bp={bp} />

          {!bp && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setLocation("/channels/ppc?new=1")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/25 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                <Sparkles size={14} /> Open Blueprint Studio
              </button>
            </div>
          )}
        </div>

        {/* Status sidebar */}
        <div className="border-l border-white/[0.06] bg-[#0c0e17]">
          <StatusSidebar
            campaign={campaign}
            providerDrafts={providerDrafts}
            bp={bp}
            onSubmit={() => submitApproval.mutate({ id: numId })}
            submitting={submitApproval.isPending}
          />
        </div>
      </div>
    </div>
  );
}
