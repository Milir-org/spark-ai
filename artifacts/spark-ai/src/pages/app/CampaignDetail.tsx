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
  Target, Globe, DollarSign, Sparkles, AlertCircle, Info,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:             { bg: "bg-white/[0.04]",       text: "text-muted-foreground",    dot: "bg-muted-foreground/40" },
  planning:          { bg: "bg-blue-500/10",         text: "text-blue-300",            dot: "bg-blue-400" },
  awaiting_approval: { bg: "bg-amber-500/10",        text: "text-amber-300",           dot: "bg-amber-400" },
  ready_to_launch:   { bg: "bg-emerald-500/10",      text: "text-emerald-300",         dot: "bg-emerald-400" },
  active:            { bg: "bg-emerald-500/10",      text: "text-emerald-300",         dot: "bg-emerald-400" },
  optimising:        { bg: "bg-primary/10",          text: "text-primary",             dot: "bg-primary" },
  paused:            { bg: "bg-white/[0.04]",        text: "text-muted-foreground",    dot: "bg-muted-foreground/40" },
  completed:         { bg: "bg-white/[0.03]",        text: "text-muted-foreground/50", dot: "bg-muted-foreground/20" },
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

function RadialGauge({ score, label, size = 88 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeColor = score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const textColor   = score >= 80 ? "text-emerald-400"  : score >= 60 ? "text-amber-400"  : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className="stroke-white/[0.06]" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className={strokeColor}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${textColor}`}>{score}%</span>
      </div>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

function Divider() {
  return <div className="w-full h-px bg-white/[0.04]" />;
}

// ─── Blueprint Canvas (read-only) ─────────────────────────────────────────────

function BlueprintCanvas({ bp }: { bp: any }) {
  if (!bp) return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
        <Sparkles size={20} className="text-muted-foreground/30" />
      </div>
      <p className="text-muted-foreground font-medium">No blueprint generated yet</p>
      <p className="text-sm text-muted-foreground/50 mt-2 max-w-xs leading-relaxed">
        Open the PPC Blueprint Studio to generate a campaign strategy.
      </p>
    </div>
  );

  return (
    <div className="space-y-16">

      {/* Strategic Angle */}
      {bp.strategicAngle && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-primary" />
            <p className="text-xs font-medium text-primary/70 uppercase tracking-widest">Strategic Angle</p>
          </div>
          <p className="text-xl leading-[1.75] text-foreground/80 font-light">
            {bp.strategicAngle}
          </p>
        </section>
      )}

      {bp.strategicAngle && <Divider />}

      {/* Platform Strategy */}
      {bp.platformStrategy?.length > 0 && (
        <section className="space-y-7">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Platform Strategy</p>
            <p className="text-xs text-muted-foreground">Budget allocation across ad networks.</p>
          </div>
          <div className="space-y-4">
            {bp.platformStrategy.map((p: any) => (
              <div key={p.name} className={`p-7 rounded-2xl border ${p.recommended ? "border-white/[0.07] bg-white/[0.015]" : "border-white/[0.03] opacity-55"}`}>
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <p className="font-semibold text-lg">{p.name}</p>
                      {p.recommended && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-primary/15 text-primary/70 bg-primary/[0.06]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-4xl font-bold">{p.budgetPct}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">of budget</p>
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

      {bp.platformStrategy?.length > 0 && bp.keywordThemes?.length > 0 && <Divider />}

      {/* Keyword Themes */}
      {bp.keywordThemes?.length > 0 && (
        <section className="space-y-7">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Keyword Themes</p>
            <p className="text-xs text-muted-foreground">Strategic clusters approved for this campaign.</p>
          </div>
          <div className="space-y-4">
            {bp.keywordThemes.map((t: any) => {
              const ic = INTENT_COLORS[t.intent] ?? INTENT_COLORS.Informational;
              return (
                <div key={t.id ?? t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ic}`}>{t.intent}</span>
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(t.keywords ?? []).map((kw: string) => (
                      <span key={kw} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-foreground/60 font-mono">
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

      {bp.keywordThemes?.length > 0 && bp.negativeKeywordThemes?.length > 0 && <Divider />}

      {/* Negative Keywords */}
      {bp.negativeKeywordThemes?.length > 0 && (
        <section className="space-y-7">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Negative Keyword Themes</p>
            <p className="text-xs text-muted-foreground">Confirmed exclusion lists protecting budget from non-commercial intent.</p>
          </div>
          <div className="space-y-3">
            {bp.negativeKeywordThemes.map((t: any) => (
              <div key={t.id ?? t.name} className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
                <p className="font-medium text-sm mb-2">{t.name}</p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.rationale}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(t.terms ?? []).map((term: string) => (
                    <span key={term} className="text-xs px-2.5 py-1 rounded-full bg-red-400/[0.06] border border-red-400/12 text-red-400/60 font-mono">{term}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {bp.negativeKeywordThemes?.length > 0 && bp.adDirection && <Divider />}

      {/* Ad Direction */}
      {bp.adDirection && (
        <section className="space-y-9">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Ad Direction</p>
            <p className="text-xs text-muted-foreground">Creative brief for this campaign.</p>
          </div>
          {bp.adDirection.angle && (
            <div>
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-4">Creative Angle</p>
              <p className="text-base leading-relaxed text-foreground/80">{bp.adDirection.angle}</p>
            </div>
          )}
          {bp.adDirection.tone && (
            <div>
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-4">Tone of Voice</p>
              <p className="text-sm text-foreground/65 leading-relaxed">{bp.adDirection.tone}</p>
            </div>
          )}
          {bp.adDirection.headlines?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-4">Headlines</p>
              <div className="space-y-2">
                {bp.adDirection.headlines.map((h: string, i: number) => (
                  <div key={i} className="px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] font-medium text-sm">{h}</div>
                ))}
              </div>
            </div>
          )}
          {bp.adDirection.descriptions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-4">Descriptions</p>
              <div className="space-y-2">
                {bp.adDirection.descriptions.map((d: string, i: number) => (
                  <div key={i} className="px-5 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-foreground/60 leading-relaxed">{d}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {bp.adDirection && bp.trackingPlan && <Divider />}

      {/* Tracking */}
      {bp.trackingPlan && (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-foreground/60 mb-1">Tracking & Measurement</p>
            <p className="text-xs text-muted-foreground">Conversion setup required before launch.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
            <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-3">Implementation Notes</p>
            <p className="text-sm text-foreground/75 leading-relaxed">{bp.trackingPlan}</p>
          </div>
        </section>
      )}

      {/* Risks + Assumptions */}
      {(bp.risks?.length > 0 || bp.assumptions?.length > 0) && (
        <>
          <Divider />
          <div className="grid md:grid-cols-2 gap-10">
            {bp.risks?.length > 0 && (
              <section className="space-y-5">
                <p className="text-sm font-semibold text-foreground/60">Risks</p>
                <div className="space-y-3">
                  {bp.risks.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/70 leading-snug">{r}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {bp.assumptions?.length > 0 && (
              <section className="space-y-5">
                <p className="text-sm font-semibold text-foreground/60">Assumptions</p>
                <div className="space-y-3">
                  {bp.assumptions.map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/70 leading-snug">{a}</span>
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

  // Hard blockers — things that prevent submission
  const blockers: { msg: string; error: boolean }[] = [];
  if (!bp) blockers.push({ msg: "No blueprint generated yet", error: true });
  if (providerDrafts.length > 0 && !providerDrafts.some((d: any) => d.status === "draft_ready")) {
    blockers.push({ msg: "No provider drafts ready", error: false });
  }
  providerDrafts.forEach((d: any) => {
    (d.validationIssues ?? []).filter((i: any) => i.severity === "error").forEach((issue: any) => {
      blockers.push({ msg: `${PROVIDER_LABELS[d.provider] ?? d.provider}: ${issue.message}`, error: true });
    });
  });

  const hasHardBlockers = blockers.some((b) => b.error) && canSubmit;

  return (
    <div className="w-80 shrink-0 sticky top-[65px] max-h-[calc(100vh-65px)] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 space-y-9">

        {/* Campaign meta */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Campaign Details</p>
          <div className="space-y-3">
            {[
              { icon: Target, label: ((campaign.primaryObjective ?? campaign.objective) as string).replace(/_/g, " "), className: "capitalize" },
              { icon: Globe, label: (campaign as any).geography || null },
              { icon: DollarSign, label: `$${(campaign.budget / 1000).toFixed(0)}k budget` },
            ].filter((r) => !!r.label).map((row, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <row.icon size={13} className="shrink-0 text-muted-foreground/35" />
                <span className={`text-muted-foreground ${row.className ?? ""}`}>{row.label}</span>
              </div>
            ))}
            {(campaign as any).channels?.length > 0 && (
              <div className="flex items-center gap-2.5 text-sm">
                <span className="w-3.5 shrink-0" />
                <span className="text-muted-foreground">{(campaign.channels as string[]).join(", ").toUpperCase()}</span>
              </div>
            )}
            {(campaign as any).landingPage && (
              <div className="flex items-center gap-2.5 text-sm">
                <span className="w-3.5 shrink-0" />
                <span className="font-mono text-xs text-primary/60 truncate">{(campaign as any).landingPage}</span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Provider Readiness + Validation — merged section */}
        {providerDrafts.length > 0 && (
          <div className="space-y-6">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Validation</p>

            <div className="flex items-center justify-around">
              {providerDrafts.map((draft: any) => (
                <RadialGauge
                  key={draft.id}
                  score={draft.readinessScore}
                  label={PROVIDER_LABELS[draft.provider] ?? draft.provider}
                  size={88}
                />
              ))}
            </div>

            {/* All validation issues grouped */}
            {providerDrafts.some((d: any) => d.validationIssues?.length > 0) && (
              <div className="space-y-2">
                {providerDrafts.flatMap((d: any) =>
                  (d.validationIssues ?? []).map((issue: any, i: number) => (
                    <div key={i} className={`flex items-start gap-2 text-xs p-3 rounded-xl ${
                      issue.severity === "error" ? "bg-red-500/[0.07] text-red-300" :
                      issue.severity === "warning" ? "bg-amber-500/[0.07] text-amber-300" :
                      "bg-blue-500/[0.07] text-blue-300"
                    }`}>
                      {issue.severity === "error" ? <AlertCircle size={11} className="shrink-0 mt-0.5" /> :
                       issue.severity === "warning" ? <AlertTriangle size={11} className="shrink-0 mt-0.5" /> :
                       <Info size={11} className="shrink-0 mt-0.5" />}
                      <span className="leading-snug">{issue.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {providerDrafts.length > 0 && <Divider />}

        {/* Approval progress */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Approval Progress</p>
            <span className={`text-sm font-bold tabular-nums ${pct === 100 ? "text-emerald-400" : "text-muted-foreground"}`}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-400" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="space-y-2.5">
            {approvalSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {step.done
                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                  : <Clock size={13} className="text-muted-foreground/25 shrink-0" />
                }
                <span className={`text-xs leading-snug ${step.done ? "text-foreground/65" : "text-muted-foreground/35"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Approval requirements from blueprint */}
        {bp?.approvalRequirements?.length > 0 && (
          <>
            <Divider />
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Required Approvals</p>
              <div className="space-y-2.5">
                {bp.approvalRequirements.map((req: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 mt-1.5 shrink-0" />
                    <span className="text-xs text-foreground/60 leading-snug">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Blockers */}
        {blockers.length > 0 && canSubmit && (
          <>
            <Divider />
            <div className="space-y-2">
              {blockers.map((b, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs p-3 rounded-xl ${
                  b.error ? "bg-red-500/[0.07] text-red-300" : "bg-amber-500/[0.07] text-amber-300"
                }`}>
                  {b.error
                    ? <AlertCircle size={11} className="shrink-0 mt-0.5" />
                    : <AlertTriangle size={11} className="shrink-0 mt-0.5" />}
                  <span className="leading-snug">{b.msg}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Secondary goals */}
        {campaign.secondaryObjectives?.length > 0 && (
          <>
            <Divider />
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Secondary Goals</p>
              <div className="flex flex-wrap gap-1.5">
                {(campaign.secondaryObjectives as string[]).map((g) => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/15">{g}</span>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Submit button */}
      {canSubmit && (
        <div className="shrink-0 p-6 border-t border-white/[0.05]">
          {hasHardBlockers && (
            <p className="text-xs text-muted-foreground/50 text-center mb-4">
              Resolve blocking issues before submitting.
            </p>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting || hasHardBlockers}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-[1fr_320px] gap-10 mt-6">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground text-sm">Campaign not found.</p>
      </div>
    );
  }

  const bp = campaign.blueprint as any;
  const providerDrafts = (campaign as any).providerDrafts ?? [];

  return (
    <div className="min-h-full bg-[#0b0d14]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-[#0b0d14]/95 backdrop-blur border-b border-white/[0.05]">
        <div className="px-7 py-4 flex items-center gap-4">
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
        {/* Main blueprint canvas */}
        <div className="flex-1 min-w-0 px-9 py-12">
          <BlueprintCanvas bp={bp} />

          {!bp && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setLocation("/channels/ppc?new=1")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                <Sparkles size={14} /> Open Blueprint Studio
              </button>
            </div>
          )}
        </div>

        {/* Status sidebar */}
        <div className="border-l border-white/[0.05] bg-[#0c0e17]">
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
