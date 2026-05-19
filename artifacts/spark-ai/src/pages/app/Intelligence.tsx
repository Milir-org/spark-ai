import { useListSegments, useGetOpportunityFeed, useGetIntelligenceSummary, getListSegmentsQueryKey, getGetOpportunityFeedQueryKey, getGetIntelligenceSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Minus, Users, AlertCircle, Zap, ArrowRight, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const MOCK_SEGMENTS = [
  { id: 1, name: "Dormant Leads (90+ days)", description: "Contacts with no activity in 90+ days", source: "HubSpot CRM", size: 312, tags: ["dormant", "reactivation"], insightSummary: "312 leads last contacted 90+ days ago. 68% opened at least 1 email. High reactivation potential.", organizationId: 1, conversionRate: 8.2, trend: "declining" },
  { id: 2, name: "High-Intent Visitors", description: "Visited pricing or features page 2+ times", source: "GA4 + CRM", size: 74, tags: ["high-intent", "hot"], insightSummary: "74 visitors hit pricing page 2+ times without converting. Average session time 4.2 minutes.", organizationId: 1, conversionRate: 22.4, trend: "growing" },
  { id: 3, name: "Upsell Candidates", description: "Customers on Starter plan for 60+ days", source: "Billing + CRM", size: 127, tags: ["upsell", "existing-customer"], insightSummary: "127 Starter plan customers approaching feature limits. Growth plan conversion rate historically 34%.", organizationId: 1, conversionRate: 34.1, trend: "stable" },
  { id: 4, name: "Lost Deals (180 days)", description: "Opportunities closed-lost in last 180 days", source: "Salesforce", size: 89, tags: ["lost", "winback"], insightSummary: "89 closed-lost opportunities. 41% cited budget constraints. May be ready to revisit with ROI data.", organizationId: 1, conversionRate: 12.8, trend: "stable" },
];

const MOCK_OPPORTUNITIES = [
  { id: 1, title: "312 dormant leads ready for reactivation", type: "reactivation", description: "312 leads have not been contacted in 90+ days. 68% previously opened emails. SPARK AI predicts 24% reactivation rate with personalised outreach.", potentialValue: "$89,400 pipeline opportunity", segmentSize: 312, priority: "high" },
  { id: 2, title: "74 high-intent visitors didn't convert", type: "conversion", description: "74 leads visited the pricing page 2+ times but did not submit a form. A targeted follow-up sequence could recover significant pipeline.", potentialValue: "$142,000 potential ARR", segmentSize: 74, priority: "high" },
  { id: 3, title: "Singapore SME segment converts 2.3x better", type: "segment_insight", description: "Contacts tagged as Singapore SME owners have a 22.4% conversion rate vs 9.7% average. Recommend increasing spend on this segment.", potentialValue: "2.3x conversion improvement", segmentSize: 1240, priority: "medium" },
  { id: 4, title: "127 customers approaching plan limits", type: "upsell", description: "127 Starter plan customers have used 80%+ of their monthly campaign credits. Targeted Growth plan upgrade campaign.", potentialValue: "$38,100 expansion MRR", segmentSize: 127, priority: "medium" },
  { id: 5, title: "Campaign A leads have 3x lower LTV than B", type: "quality", description: "Despite Campaign A generating 2x more leads, post-sale LTV is $1,200 vs $3,800 for Campaign B. Recommend shifting 30% of budget.", potentialValue: "18% improvement in LTV", segmentSize: 189, priority: "high" },
];

const MOCK_SUMMARY = { dormantLeads: 312, highIntentVisitors: 74, upsellCandidates: 127, lostOpportunities: 89, highValueSegments: 4, poorLeadSources: 2, bestConvertingSegment: "Singapore SME Owners" };

const TREND_ICON: Record<string, React.ReactNode> = {
  growing: <TrendingUp size={14} className="text-green-400" />,
  declining: <TrendingDown size={14} className="text-red-400" />,
  stable: <Minus size={14} className="text-muted-foreground" />,
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-green-500/20 text-green-300 border-green-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  reactivation: "Reactivation", conversion: "Conversion", segment_insight: "Segment Insight",
  upsell: "Upsell", quality: "Lead Quality",
};

export default function Intelligence() {
  const [, setLocation] = useLocation();
  const { data: segments = MOCK_SEGMENTS } = useListSegments({ query: { queryKey: getListSegmentsQueryKey() } });
  const { data: opportunities = MOCK_OPPORTUNITIES } = useGetOpportunityFeed({ query: { queryKey: getGetOpportunityFeedQueryKey() } });
  const { data: summary = MOCK_SUMMARY } = useGetIntelligenceSummary({ query: { queryKey: getGetIntelligenceSummaryQueryKey() } });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-intelligence">
            <Brain size={22} className="text-primary" /> Customer Intelligence
          </h1>
          <p className="text-muted-foreground text-sm">AI-surfaced insights from your CRM, analytics, and campaign data</p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="btn-refresh-intel">
          <RefreshCw size={14} /> Refresh Insights
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Dormant Leads", value: summary.dormantLeads, icon: <Users size={14} />, color: "text-amber-400", sub: "90+ days no contact" },
          { label: "High-Intent Visitors", value: summary.highIntentVisitors, icon: <Zap size={14} />, color: "text-primary", sub: "Pricing page 2+ visits" },
          { label: "Upsell Candidates", value: summary.upsellCandidates, icon: <TrendingUp size={14} />, color: "text-green-400", sub: "Near plan limits" },
          { label: "Lost Opportunities", value: summary.lostOpportunities, icon: <AlertCircle size={14} />, color: "text-red-400", sub: "180 days" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card" data-testid={`intel-kpi-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-2 mb-1 ${kpi.color}`}>{kpi.icon}<span className="text-xs text-muted-foreground">{kpi.label}</span></div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Opportunity Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Opportunity Feed</h2>
          {opportunities.map((opp) => (
            <Card key={opp.id} className="border-border/60 bg-card hover:border-primary/40 transition-colors" data-testid={`opp-card-${opp.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm leading-tight flex-1">{opp.title}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">{TYPE_LABEL[opp.type] ?? opp.type}</Badge>
                    <Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[opp.priority]}`}>{opp.priority}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{opp.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-accent">{opp.potentialValue}</span>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setLocation("/campaigns/new")} data-testid={`btn-create-campaign-opp-${opp.id}`}>
                    <Zap size={10} /> Act on This
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Segments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Audience Segments</h2>
          {segments.map((seg) => (
            <Card key={seg.id} className="border-border/60 bg-card" data-testid={`segment-card-${seg.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{seg.name}</p>
                    {TREND_ICON[(seg as any).trend ?? "stable"]}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">{seg.source}</Badge>
                    <span className="text-sm font-bold text-primary">{seg.size.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{seg.insightSummary ?? seg.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(seg.tags as string[]).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-primary/30 text-primary/80">{tag}</Badge>
                  ))}
                  {seg.conversionRate != null && (
                    <span className="text-xs text-accent ml-auto font-medium">{seg.conversionRate}% conv. rate</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
