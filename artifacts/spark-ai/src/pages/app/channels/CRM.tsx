import { useGetCrmData, getGetCrmDataQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { useLocation } from "wouter";

const MOCK_CRM = {
  segments: [
    { id: 1, name: "Dormant Leads (90+ days)", size: 312, source: "HubSpot", tags: ["dormant", "reactivation"], insightSummary: "312 leads last contacted 90+ days ago. High reactivation potential.", conversionRate: 8.2, trend: "declining" },
    { id: 2, name: "High-Intent Visitors", size: 74, source: "GA4 + CRM", tags: ["high-intent", "hot"], insightSummary: "74 visitors hit pricing page 2+ times. Average session time 4.2 minutes.", conversionRate: 22.4, trend: "growing" },
    { id: 3, name: "Upsell Candidates", size: 127, source: "Billing + CRM", tags: ["upsell"], insightSummary: "127 Starter plan customers approaching feature limits.", conversionRate: 34.1, trend: "stable" },
    { id: 4, name: "Lost Deals (180 days)", size: 89, source: "Salesforce", tags: ["lost", "winback"], insightSummary: "89 closed-lost opportunities. 41% cited budget constraints.", conversionRate: 12.8, trend: "stable" },
  ],
  emailSequences: [
    { id: 1, name: "Dormant Lead Reactivation", steps: 5, status: "active", targetSegment: "Dormant Leads (90+ days)" },
    { id: 2, name: "High-Intent Nurture", steps: 3, status: "draft", targetSegment: "High-Intent Visitors" },
    { id: 3, name: "Upsell Journey — Starter to Growth", steps: 4, status: "active", targetSegment: "Upsell Candidates" },
    { id: 4, name: "Win-Back Campaign", steps: 6, status: "draft", targetSegment: "Lost Deals (180 days)" },
  ],
  lifecycleIdeas: [
    "30-day check-in sequence for new customers (3 emails + 1 LinkedIn DM)",
    "Quarterly ROI review email for Pro plan customers",
    "Feature adoption drip for users not using AI Campaign Designer",
  ],
  reactivationIdeas: [
    "Personalised video message from Account Manager for high-value dormant leads",
    "'What changed' campaign — showcase new features since they last engaged",
    "Limited-time offer: 2-month discount for reactivating dormant accounts",
  ],
};

const TREND_ICON: Record<string, React.ReactNode> = {
  growing: <TrendingUp size={12} className="text-green-400" />,
  declining: <TrendingDown size={12} className="text-red-400" />,
  stable: <Minus size={12} className="text-muted-foreground" />,
};

export default function CRM() {
  const [, setLocation] = useLocation();
  const { data: crm = MOCK_CRM } = useGetCrmData({ query: { queryKey: getGetCrmDataQueryKey() } });

  const segments = crm?.segments ?? MOCK_CRM.segments;
  const emailSequences = crm?.emailSequences ?? MOCK_CRM.emailSequences;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-crm">
          <Mail size={20} className="text-primary" /> CRM & Email Workbench
        </h1>
        <p className="text-muted-foreground text-sm">Audience segments, email sequences, and lifecycle marketing</p>
      </div>

      <Tabs defaultValue="segments">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="segments">Audience Segments</TabsTrigger>
          <TabsTrigger value="sequences">Email Sequences</TabsTrigger>
          <TabsTrigger value="ideas">AI Ideas</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="mt-4 space-y-4">
          {segments.map((seg) => (
            <Card key={seg.id} className="border-border/60 bg-card" data-testid={`crm-segment-${seg.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{seg.name}</p>
                      {TREND_ICON[seg.trend]}
                    </div>
                    <p className="text-xs text-muted-foreground">{seg.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{seg.size.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">contacts</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{seg.insightSummary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    {seg.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-primary/30 text-primary/80">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {seg.conversionRate != null && <span className="text-xs text-accent font-medium">{seg.conversionRate}% conv. rate</span>}
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setLocation("/campaigns/new")} data-testid={`btn-activate-${seg.id}`}>
                      <Zap size={10} className="mr-1" /> Activate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sequences" className="mt-4 space-y-4">
          {emailSequences.map((seq) => (
            <Card key={seq.id} className="border-border/60 bg-card" data-testid={`email-seq-${seq.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{seq.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{seq.steps} steps · Target: {seq.targetSegment}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${seq.status === "active" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{seq.status}</Badge>
                  <Button size="sm" variant="outline" className="text-xs h-7">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ideas" className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-primary">Lifecycle Ideas</h3>
            <div className="space-y-2">
              {MOCK_CRM.lifecycleIdeas.map((idea, i) => (
                <Card key={i} className="border-border/60 bg-card">
                  <CardContent className="p-3 flex items-start gap-2">
                    <Zap size={13} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">{idea}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-accent">Reactivation Ideas</h3>
            <div className="space-y-2">
              {MOCK_CRM.reactivationIdeas.map((idea, i) => (
                <Card key={i} className="border-border/60 bg-card">
                  <CardContent className="p-3 flex items-start gap-2">
                    <Users size={13} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-sm">{idea}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
