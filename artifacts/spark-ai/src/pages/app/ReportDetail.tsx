import { useParams, useLocation } from "wouter";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABELS: Record<string, string> = {
  monthly_performance: "Monthly Performance", campaign_performance: "Campaign Performance",
  channel_analysis: "Channel Analysis", quarterly_review: "Quarterly Review", custom: "Custom Report",
};

const MOCK_REPORT = {
  id: 1, type: "monthly_performance", title: "April 2026 Monthly Performance Report",
  summary: "Overall campaign performance tracked 12% above target for lead volume. ROAS at 4.2x. Primary risk: landing page conversion rate drop detected this week.",
  insights: ["CTR improved 18% but conversions remained flat — suggests landing page or offer issue", "Email channel has lowest CPL at $4.60 — significantly underinvested", "Singapore SME segment converts 2.3x better than average", "Brand search CTR spiked 47% — likely due to PR coverage"],
  whatWorked: ["Brand search campaigns — ROAS 6.1x, well above 4.2x average", "Email nurture sequences — 28.4% open rate, 6.4% conversion", "LinkedIn audience targeting — highest qualified lead rate at 31%"],
  whatDidntWork: ["Competitor Conquest campaign — CPA $142 vs $71 target", "Landing page B variant — 34% lower conversion than control", "TikTok ads test — insufficient data, paused after 5 days"],
  recommendations: ["Pause Competitor Conquest campaign and rebuild keyword strategy", "Increase email marketing budget by 40%", "Scale Singapore SME LinkedIn targeting", "Fix landing page — run UX audit and A/B test"],
  organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date().toISOString(),
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const numId = parseInt(id);

  const { data: report = MOCK_REPORT, isLoading } = useGetReport(numId, { query: { enabled: !!numId, queryKey: getGetReportQueryKey(numId) } });

  if (isLoading) return <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/reports")}><ArrowLeft size={16} /></Button>
        <div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h1 className="text-xl font-bold" data-testid="heading-report-title">{report.title}</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{TYPE_LABELS[report.type] ?? report.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date(report.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}{report.campaignName ? ` · ${report.campaignName}` : ""}</p>
        </div>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm text-primary uppercase tracking-wider">Executive Summary</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed">{report.summary}</p></CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm text-primary uppercase tracking-wider flex items-center gap-2"><TrendingUp size={14} /> Key Insights</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {report.insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold shrink-0">{i + 1}.</span>
              <span className="leading-relaxed">{ins}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card border-green-500/20">
          <CardHeader><CardTitle className="text-sm text-green-400 uppercase tracking-wider flex items-center gap-2"><CheckCircle size={14} /> What Worked</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.whatWorked.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card border-red-500/20">
          <CardHeader><CardTitle className="text-sm text-red-400 uppercase tracking-wider flex items-center gap-2"><XCircle size={14} /> What Didn't Work</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.whatDidntWork.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card border-accent/20">
        <CardHeader><CardTitle className="text-sm text-accent uppercase tracking-wider">Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-accent font-bold shrink-0">→</span>
              <span>{rec}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
