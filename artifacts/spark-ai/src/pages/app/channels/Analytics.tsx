import { useGetAnalyticsData, getGetAnalyticsDataQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, AlertTriangle, Brain, TrendingUp, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const MOCK_ANALYTICS = {
  conversionFunnel: [
    { stage: "Website Visitors", value: 42800 },
    { stage: "Landing Page Views", value: 18400 },
    { stage: "Form Starts", value: 4200 },
    { stage: "Form Submissions", value: 1847 },
    { stage: "Qualified Leads", value: 724 },
    { stage: "Opportunities", value: 187 },
    { stage: "Customers", value: 43 },
  ],
  channelPerformance: [
    { channel: "Google PPC", spend: 28400, leads: 847, cpl: 33.53, conversionRate: 4.2 },
    { channel: "LinkedIn Ads", spend: 18200, leads: 312, cpl: 58.33, conversionRate: 2.8 },
    { channel: "Meta Ads", spend: 12800, leads: 524, cpl: 24.43, conversionRate: 3.9 },
    { channel: "SEO (Organic)", spend: 4200, leads: 728, cpl: 5.77, conversionRate: 5.1 },
    { channel: "Email/CRM", spend: 1800, leads: 391, cpl: 4.60, conversionRate: 6.4 },
  ],
  anomalies: [
    { title: "CTR spike on Brand Search (+47%)", severity: "info", description: "Brand search CTR increased 47% this week — likely due to PR coverage. Consider increasing brand budget." },
    { title: "Conversion rate drop on landing page", severity: "warning", description: "Primary landing page conversion rate fell from 4.2% to 2.8% in 72 hours. Possible issue with page load speed or form." },
    { title: "CPA exceeds target on Competitor campaign", severity: "critical", description: "Competitor Conquest campaign CPA hit $142 — 2x the $71 target. Recommend pausing or restructuring." },
  ],
  aiSummary: "Overall campaign performance this month is tracking 12% above target for lead volume, but cost efficiency is mixed. SEO organic traffic declined 8% month-over-month. PPC ROAS of 4.2x is strong. The primary risk is the landing page conversion drop detected in the last 72 hours — this is your highest-priority action item this week.",
  recommendedNextActions: [
    "Investigate and fix landing page conversion drop immediately",
    "Pause Competitor Conquest campaign pending restructure",
    "Increase Brand Search budget by 20% to capitalise on PR-driven CTR spike",
    "Brief SEO specialist on content recovery plan",
  ],
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "border-blue-500/30 bg-blue-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  critical: "border-red-500/30 bg-red-500/5",
};

const FUNNEL_COLORS = ["hsl(263,70%,50%)", "hsl(263,65%,55%)", "hsl(263,60%,60%)", "hsl(189,94%,43%)", "hsl(189,80%,50%)", "hsl(130,50%,50%)", "hsl(130,60%,55%)"];

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { data: analytics = MOCK_ANALYTICS } = useGetAnalyticsData({ query: { queryKey: getGetAnalyticsDataQueryKey() } });

  const funnel = analytics?.conversionFunnel ?? MOCK_ANALYTICS.conversionFunnel;
  const channelPerf = analytics?.channelPerformance ?? MOCK_ANALYTICS.channelPerformance;
  const anomalies = analytics?.anomalies ?? MOCK_ANALYTICS.anomalies;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-analytics">
          <BarChart3 size={20} className="text-primary" /> Analytics Workbench
        </h1>
        <p className="text-muted-foreground text-sm">Conversion funnels, channel performance, and AI anomaly detection</p>
      </div>

      {/* AI Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-1.5">SPARK AI Intelligence Summary</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{analytics?.aiSummary ?? MOCK_ANALYTICS.aiSummary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="funnel">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Alerts ({anomalies.length})</TabsTrigger>
          <TabsTrigger value="actions">Next Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-4">
          <Card className="border-border/60 bg-card">
            <CardHeader><CardTitle className="text-sm">End-to-End Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnel.map((stage, i) => {
                  const pct = Math.round((stage.value / funnel[0].value) * 100);
                  return (
                    <div key={stage.stage} className="flex items-center gap-3" data-testid={`funnel-stage-${i}`}>
                      <span className="text-xs text-muted-foreground w-36 shrink-0 text-right">{stage.stage}</span>
                      <div className="flex-1 h-7 bg-muted/20 rounded overflow-hidden">
                        <div className="h-full rounded flex items-center px-2" style={{ width: `${pct}%`, background: FUNNEL_COLORS[i] }}>
                          <span className="text-xs font-bold text-white whitespace-nowrap">{stage.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-10 shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Channel</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Spend</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Leads</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">CPL</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerf.map((c, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-card/80" data-testid={`channel-row-${i}`}>
                        <td className="px-4 py-3 font-medium">{c.channel}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${c.spend.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-primary">{c.leads.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-accent font-medium">${c.cpl}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{c.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-4 space-y-3">
          {anomalies.map((a, i) => (
            <Card key={i} className={`border ${SEVERITY_COLORS[a.severity]}`} data-testid={`anomaly-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={14} className={a.severity === "critical" ? "text-red-400" : a.severity === "warning" ? "text-amber-400" : "text-blue-400"} />
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-3">
          {(analytics?.recommendedNextActions ?? MOCK_ANALYTICS.recommendedNextActions).map((action, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`action-${i}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-primary font-bold text-sm shrink-0">{i + 1}.</span>
                <p className="text-sm flex-1">{action}</p>
                <Button size="sm" variant="outline" className="text-xs h-7 shrink-0 gap-1">
                  Act <ArrowRight size={10} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
