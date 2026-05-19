import { useState } from "react";
import { useLocation } from "wouter";
import { useListReports, useGenerateReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, CheckCircle, XCircle, TrendingUp, Loader2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MOCK_REPORTS = [
  { id: 1, type: "monthly_performance", title: "April 2026 Monthly Performance Report", summary: "Overall campaign performance tracked 12% above target for lead volume. ROAS at 4.2x. Primary risk: landing page conversion rate drop detected this week.", insights: ["CTR improved 18% but conversions flat", "Email channel has lowest CPL at $4.60", "Singapore SME segment converts 2.3x better"], whatWorked: ["Brand search ROAS 6.1x", "Email nurture 28.4% open rate"], whatDidntWork: ["Competitor Conquest CPA $142", "Landing page B 34% lower conversion"], recommendations: ["Pause Competitor Conquest", "Increase email budget 40%"], organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 2, type: "campaign_performance", title: "Q2 Lead Gen Campaign — Mid-Point Report", summary: "Campaign is tracking at 87% of lead generation target at the midpoint. Cost-per-lead is $38, below the $45 target. LinkedIn is outperforming Google on lead quality.", insights: ["LinkedIn leads convert to opportunities at 31% vs 19% for Google", "WhatsApp follow-up reduced no-show rate by 28%"], whatWorked: ["LinkedIn targeting precision", "5-step email nurture sequence"], whatDidntWork: ["Competitor keywords — paused Week 3"], recommendations: ["Scale LinkedIn by $5,000", "Remove bottom 3 Google keywords"], organizationId: 1, campaignId: 1, campaignName: "Q2 Lead Gen — Enterprise SaaS", createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 3, type: "channel_analysis", title: "PPC Channel Deep-Dive — Q2", summary: "Google Ads performance analysis for Q2. Overall ROAS of 4.2x against target 3.5x. Budget utilisation at 71%.", insights: ["Brand keywords drive 68% of conversions despite 31% of spend", "Top 5 keywords account for 82% of qualified leads"], whatWorked: ["Broad match modifier expansion", "Ad schedule optimisation"], whatDidntWork: ["Display network — paused", "Competitor bidding"], recommendations: ["Shift 15% from display to search", "Launch Performance Max campaign"], organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date(Date.now() - 18 * 86400000).toISOString() },
];

const TYPE_LABELS: Record<string, string> = {
  monthly_performance: "Monthly Performance",
  campaign_performance: "Campaign Performance",
  channel_analysis: "Channel Analysis",
  quarterly_review: "Quarterly Review",
  custom: "Custom Report",
};

export default function Reports() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [genType, setGenType] = useState("monthly_performance");
  const [genTitle, setGenTitle] = useState("");

  const { data: reports = MOCK_REPORTS, isLoading } = useListReports({ query: { queryKey: getListReportsQueryKey() } });
  const generateMutation = useGenerateReport({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() }); setShowGenerateDialog(false); } } });

  const displayReports = reports.length > 0 ? reports : MOCK_REPORTS;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-reports">Reports</h1>
          <p className="text-muted-foreground text-sm">AI-generated campaign analysis and performance insights</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)} className="gap-2" data-testid="btn-generate-report">
          <Plus size={14} /> Generate Report
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {displayReports.map((report) => (
            <Card key={report.id} className="border-border/60 bg-card hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/reports/${report.id}`)} data-testid={`report-card-${report.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-primary shrink-0" />
                      <p className="font-semibold text-sm truncate">{report.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">{TYPE_LABELS[report.type] ?? report.type}</Badge>
                      {report.campaignName && <span>· {report.campaignName}</span>}
                      <span>· {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{report.summary}</p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1"><TrendingUp size={11} /> What Worked</p>
                    <ul className="space-y-1">
                      {report.whatWorked.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle size={10} className="text-green-400 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-destructive/80 mb-1.5 flex items-center gap-1"><XCircle size={11} /> What Didn't Work</p>
                    <ul className="space-y-1">
                      {report.whatDidntWork.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-accent mb-1.5">Recommendations</p>
                    <ul className="space-y-1">
                      {report.recommendations.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="text-accent shrink-0">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate AI Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger className="mt-1" data-testid="select-report-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Report Title</Label>
              <Input placeholder={`e.g. ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} Performance Report`} value={genTitle} onChange={(e) => setGenTitle(e.target.value)} className="mt-1" data-testid="input-report-title" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={() => generateMutation.mutate({ data: { type: genType, title: genTitle || `${TYPE_LABELS[genType]} — ${new Date().toLocaleDateString()}` } })} disabled={generateMutation.isPending} data-testid="btn-confirm-generate-report">
              {generateMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
