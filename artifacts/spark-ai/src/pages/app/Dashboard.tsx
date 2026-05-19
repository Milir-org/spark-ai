import { useGetDashboardSummary, useGetDashboardPerformance, useGetChannelHealth, useListRecommendations, useListApprovals, getGetDashboardSummaryQueryKey, getGetDashboardPerformanceQueryKey, getGetChannelHealthQueryKey, getListRecommendationsQueryKey, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { TrendingUp, DollarSign, Users, Target, AlertCircle, Zap, BarChart3, CheckSquare, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MOCK_SUMMARY = { activeCampaigns: 7, totalSpend: 142850, leadsGenerated: 3247, conversionRate: 4.2, pendingApprovals: 8, aiOpportunities: 14, revenueInfluenced: 892000, budgetUsed: 142850, budgetTotal: 200000 };
const MOCK_CHANNEL_HEALTH = [
  { channel: "PPC", status: "healthy", score: 87, metric: "ROAS", metricValue: "4.2x", trend: "up" },
  { channel: "SEO", status: "warning", score: 64, metric: "Organic Traffic", metricValue: "-8% MoM", trend: "down" },
  { channel: "Social", status: "healthy", score: 79, metric: "Engagement", metricValue: "3.8%", trend: "up" },
  { channel: "Email/CRM", status: "healthy", score: 91, metric: "Open Rate", metricValue: "28.4%", trend: "up" },
  { channel: "WhatsApp", status: "warning", score: 58, metric: "Response Rate", metricValue: "41%", trend: "down" },
];

const STATUS_COLORS: Record<string, string> = { healthy: "text-green-400", warning: "text-amber-400", critical: "text-red-400", inactive: "text-muted-foreground" };
const APPROVAL_RISK_COLORS: Record<string, string> = { low: "text-green-400", medium: "text-amber-400", high: "text-red-400", critical: "text-red-500" };

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary = MOCK_SUMMARY, isLoading: loadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: performance = [], isLoading: loadingPerf } = useGetDashboardPerformance({ query: { queryKey: getGetDashboardPerformanceQueryKey() } });
  const { data: channelHealth = MOCK_CHANNEL_HEALTH } = useGetChannelHealth({ query: { queryKey: getGetChannelHealthQueryKey() } });
  const { data: recommendations = [] } = useListRecommendations({ status: "pending" }, { query: { queryKey: getListRecommendationsQueryKey({ status: "pending" }) } });
  const { data: approvals = [] } = useListApprovals({ status: "pending" }, { query: { queryKey: getListApprovalsQueryKey({ status: "pending" }) } });

  const kpis = [
    { label: "Active Campaigns", value: summary.activeCampaigns, icon: <Target size={16} />, color: "text-primary" },
    { label: "Total Spend", value: `$${(summary.totalSpend / 1000).toFixed(1)}k`, icon: <DollarSign size={16} />, color: "text-accent" },
    { label: "Leads Generated", value: summary.leadsGenerated.toLocaleString(), icon: <Users size={16} />, color: "text-green-400" },
    { label: "Conversion Rate", value: `${summary.conversionRate}%`, icon: <TrendingUp size={16} />, color: "text-amber-400" },
    { label: "Pending Approvals", value: summary.pendingApprovals, icon: <CheckSquare size={16} />, color: "text-red-400" },
    { label: "AI Opportunities", value: summary.aiOpportunities, icon: <Zap size={16} />, color: "text-primary" },
    { label: "Revenue Influenced", value: `$${(summary.revenueInfluenced / 1000).toFixed(0)}k`, icon: <BarChart3 size={16} />, color: "text-accent" },
    { label: "Budget Used", value: `${Math.round((summary.budgetUsed / summary.budgetTotal) * 100)}%`, icon: <AlertCircle size={16} />, color: "text-amber-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="heading-dashboard">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Marketing command centre — real-time performance overview</p>
        </div>
        <Button onClick={() => setLocation("/campaigns/new")} className="gap-2" data-testid="btn-new-campaign">
          <Zap size={14} /> New Campaign
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={kpi.label} className="border-border/60 bg-card" data-testid={`kpi-card-${i}`}>
            <CardContent className="p-4">
              {loadingSummary ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className={`flex items-center gap-2 mb-2 ${kpi.color}`}>
                    {kpi.icon}
                    <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground" data-testid={`kpi-value-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>{kpi.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance chart */}
        <Card className="lg:col-span-2 border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Campaign Performance — 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerf ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={performance} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Leads" />
                  <Line type="monotone" dataKey="conversions" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Conversions" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Channel health */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Channel Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channelHealth.map((ch) => (
              <div key={ch.channel} className="flex items-center justify-between gap-2" data-testid={`channel-health-${ch.channel.toLowerCase()}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ch.status === "healthy" ? "bg-green-400" : ch.status === "warning" ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-sm font-medium truncate">{ch.channel}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{ch.metricValue}</span>
                  <span className={`text-xs font-bold ${STATUS_COLORS[ch.status]}`}>{ch.score}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setLocation("/channels/analytics")} data-testid="btn-view-channels">
              View All Channels <ArrowRight size={12} className="ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">AI Recommendations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/approvals")} className="text-xs">View all <ArrowRight size={12} className="ml-1" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.slice(0, 3).length === 0 ? (
              [
                { title: "Shift budget from Campaign A to Campaign B", type: "budget", confidence: 0.89, impactEstimate: "+$12,400 pipeline" },
                { title: "Add 14 negative keywords to PPC — reduce wasted spend", type: "channel_optimisation", confidence: 0.94, impactEstimate: "Save $2,100/mo" },
                { title: "Launch reactivation campaign to 312 dormant leads", type: "crm", confidence: 0.78, impactEstimate: "$89,400 potential" },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/60 bg-card/50" data-testid={`rec-card-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight flex-1">{r.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0 border-primary/40 text-primary">{Math.round(r.confidence * 100)}%</Badge>
                  </div>
                  <p className="text-xs text-accent mt-1 font-medium">{r.impactEstimate}</p>
                </div>
              ))
            ) : (
              recommendations.slice(0, 3).map((r, i) => (
                <div key={r.id} className="p-3 rounded-lg border border-border/60 bg-card/50" data-testid={`rec-card-${i}`}>
                  <p className="text-sm font-medium leading-tight">{r.title}</p>
                  <p className="text-xs text-accent mt-1 font-medium">{r.impactEstimate}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Pending Approvals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/approvals")} className="text-xs">View all <ArrowRight size={12} className="ml-1" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.slice(0, 4).length === 0 ? (
              [
                { title: "Q2 Lead Gen Campaign Launch", type: "campaign_launch", requestedByName: "Sarah Park", riskLevel: "medium" },
                { title: "PPC Budget Increase — +$8,000", type: "budget", requestedByName: "Alex Chen", riskLevel: "high" },
                { title: "LinkedIn Ad Copy — 3 variants", type: "ad_copy", requestedByName: "David Lee", riskLevel: "low" },
                { title: "Dormant Lead Segment — Reactivation", type: "crm_segment", requestedByName: "Priya Sharma", riskLevel: "medium" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60" data-testid={`approval-row-${i}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">by {a.requestedByName}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${a.riskLevel === "high" ? "bg-red-500/20 text-red-300 border-red-500/30" : a.riskLevel === "medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`} variant="outline">{a.riskLevel}</Badge>
                </div>
              ))
            ) : (
              approvals.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60" data-testid={`approval-row-${a.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">by {a.requestedByName}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${APPROVAL_RISK_COLORS[a.riskLevel]}`}>{a.riskLevel}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
