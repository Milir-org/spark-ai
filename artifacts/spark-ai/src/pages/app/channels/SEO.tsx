import { useGetSeoData, useRunSeoScan, getGetSeoDataQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Search, RefreshCw, AlertTriangle, AlertCircle, TrendingUp, CheckCircle, Loader2 } from "lucide-react";

const MOCK_SEO = {
  seoScore: 64,
  technicalIssues: [
    { issue: "Missing meta descriptions", severity: "high", count: 14 },
    { issue: "Slow page load speed (>3s)", severity: "critical", count: 8 },
    { issue: "Broken internal links", severity: "medium", count: 22 },
    { issue: "Missing alt text on images", severity: "medium", count: 47 },
    { issue: "Duplicate H1 tags", severity: "high", count: 5 },
  ],
  contentIssues: [
    { issue: "Thin content pages (<300 words)", severity: "medium", count: 19 },
    { issue: "Missing structured data (Schema.org)", severity: "high", count: 8 },
    { issue: "Keyword cannibalization detected", severity: "high", count: 3 },
    { issue: "Pages without internal links", severity: "low", count: 31 },
  ],
  keywordOpportunities: [
    { keyword: "ai marketing platform", volume: 8100, difficulty: 52, opportunity: "high" },
    { keyword: "campaign management software", volume: 5400, difficulty: 61, opportunity: "high" },
    { keyword: "marketing automation ai", volume: 12400, difficulty: 71, opportunity: "medium" },
    { keyword: "crm marketing integration", volume: 3200, difficulty: 44, opportunity: "high" },
    { keyword: "multi channel marketing tool", volume: 2900, difficulty: 39, opportunity: "high" },
  ],
  priorityTasks: [
    "Fix 8 slow-loading pages — estimated 18% traffic uplift",
    "Write meta descriptions for 14 priority landing pages",
    "Fix keyword cannibalization on 3 core topic clusters",
    "Add schema markup to product and pricing pages",
    "Build 5 content briefs targeting top keyword opportunities",
  ],
  metaTitleSuggestions: [
    "SPARK AI — AI-Powered Campaign Management Platform | Free Trial",
    "Automate Your Marketing Campaigns with AI | SPARK AI",
  ],
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-700/20 text-red-200 border-red-700/30",
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-muted/30 text-muted-foreground border-border",
};

const OPPORTUNITY_COLORS: Record<string, string> = {
  high: "text-green-400", medium: "text-amber-400", low: "text-muted-foreground",
};

export default function SEO() {
  const queryClient = useQueryClient();
  const { data: seo = MOCK_SEO, isLoading } = useGetSeoData({ query: { queryKey: getGetSeoDataQueryKey() } });
  const scanMutation = useRunSeoScan({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSeoDataQueryKey() }) } });

  const scoreColor = seo.seoScore >= 80 ? "text-green-400" : seo.seoScore >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-seo">
            <Search size={20} className="text-primary" /> SEO Workbench
          </h1>
          <p className="text-muted-foreground text-sm">Technical health, keyword opportunities, and content strategy</p>
        </div>
        <Button onClick={() => scanMutation.mutate({ data: { url: "https://sparkai.com" } })} disabled={scanMutation.isPending} className="gap-2" data-testid="btn-run-scan">
          {scanMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Run SEO Scan
        </Button>
      </div>

      {/* Score */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card md:col-span-1" data-testid="seo-score-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">SEO Health Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>{seo.seoScore}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
            <Progress value={seo.seoScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card md:col-span-3">
          <CardHeader><CardTitle className="text-sm">Priority Action Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {seo.priorityTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span>{task}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="technical">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="technical">Technical Issues ({seo.technicalIssues.length})</TabsTrigger>
          <TabsTrigger value="content">Content Issues ({seo.contentIssues.length})</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Opportunities ({seo.keywordOpportunities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="mt-4 space-y-3">
          {seo.technicalIssues.map((issue, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`tech-issue-${i}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={14} className={issue.severity === "critical" || issue.severity === "high" ? "text-red-400" : "text-amber-400"} />
                  <p className="text-sm">{issue.issue}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[issue.severity]}`}>{issue.severity}</Badge>
                  <span className="text-xs text-muted-foreground font-medium">{issue.count} pages</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="content" className="mt-4 space-y-3">
          {seo.contentIssues.map((issue, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`content-issue-${i}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle size={14} className="text-amber-400" />
                  <p className="text-sm">{issue.issue}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[issue.severity]}`}>{issue.severity}</Badge>
                  <span className="text-xs text-muted-foreground">{issue.count} instances</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Keyword</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Volume</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Difficulty</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seo.keywordOpportunities.map((kw, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-card/80" data-testid={`keyword-row-${i}`}>
                        <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{kw.volume.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={kw.difficulty} className="w-16 h-1.5" />
                            <span className="text-muted-foreground text-xs">{kw.difficulty}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold capitalize ${OPPORTUNITY_COLORS[kw.opportunity]}`}>{kw.opportunity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
