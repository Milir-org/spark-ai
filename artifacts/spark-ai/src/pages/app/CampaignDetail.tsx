import { useParams, useLocation } from "wouter";
import { useGetCampaign, useSubmitCampaignForApproval, getGetCampaignQueryKey, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Clock, SendHorizonal } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground border-border",
  planning: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  awaiting_approval: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ready_to_launch: "bg-green-500/20 text-green-300 border-green-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  optimising: "bg-primary/20 text-primary border-primary/30",
  paused: "bg-muted/50 text-muted-foreground border-border",
  completed: "bg-muted/20 text-muted-foreground border-border/50",
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const numId = parseInt(id);

  const { data: campaign, isLoading } = useGetCampaign(numId, { query: { enabled: !!numId, queryKey: getGetCampaignQueryKey(numId) } });
  const submitApproval = useSubmitCampaignForApproval({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(numId) });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    }
  });

  if (isLoading) return <div className="p-6 space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!campaign) return <div className="p-6"><p className="text-muted-foreground">Campaign not found.</p></div>;

  const bp = campaign.blueprint;
  const statusClass = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/campaigns")} data-testid="btn-back"><ArrowLeft size={16} /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate" data-testid="heading-campaign-name">{campaign.name}</h1>
            <Badge variant="outline" className={`text-xs ${statusClass}`}>{campaign.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-muted-foreground text-sm capitalize">{campaign.objective.replace(/_/g, " ")} · ${(campaign.budget/1000).toFixed(0)}k budget</p>
        </div>
        {(campaign.status === "draft" || campaign.status === "planning") && (
          <Button onClick={() => submitApproval.mutate({ id: numId })} disabled={submitApproval.isPending} className="gap-2" data-testid="btn-submit-approval">
            <SendHorizonal size={14} /> Submit for Approval
          </Button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Budget", value: `$${campaign.budget.toLocaleString()}` },
          { label: "Spend", value: campaign.spend != null ? `$${campaign.spend.toLocaleString()}` : "—" },
          { label: "Leads", value: campaign.leadsGenerated != null ? campaign.leadsGenerated.toString() : "—" },
          { label: "Health Score", value: campaign.healthScore != null ? `${campaign.healthScore}/100` : "—" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card" data-testid={`kpi-${kpi.label.toLowerCase()}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="blueprint" data-testid="tab-blueprint">Blueprint</TabsTrigger>
          <TabsTrigger value="channels" data-testid="tab-channels">Channels</TabsTrigger>
          <TabsTrigger value="approval" data-testid="tab-approval">Approval Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card">
              <CardHeader><CardTitle className="text-sm">Campaign Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "Objective", value: campaign.objective.replace(/_/g, " ") },
                  { label: "Start Date", value: campaign.startDate },
                  { label: "End Date", value: campaign.endDate },
                  { label: "Channels", value: (campaign.channels as string[]).join(", ") },
                  { label: "Spend Style", value: campaign.spendStyle ?? "balanced" },
                  { label: "Owner", value: campaign.ownerName ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground capitalize">{row.label}</span>
                    <span className="font-medium text-right capitalize">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardHeader><CardTitle className="text-sm">Audience & Product</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Target Audience</p>
                  <p>{campaign.targetAudience ?? "Not defined"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Product Description</p>
                  <p>{campaign.productDescription ?? "Not defined"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blueprint" className="mt-4">
          {!bp ? (
            <Card className="border-border/60 bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-sm">No blueprint generated yet. Complete the Campaign Designer to generate one.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Strategy Summary", value: bp.strategySummary },
                { label: "Audience Strategy", value: bp.audienceStrategy },
                { label: "Budget Plan", value: bp.budgetPlan },
                { label: "Channel Plan", value: bp.channelPlan },
                { label: "Creative Plan", value: bp.creativePlan },
                { label: "Experiment Plan", value: bp.experimentPlan },
                { label: "Measurement Plan", value: bp.measurementPlan },
              ].map((section) => (
                <Card key={section.label} className="border-border/60 bg-card" data-testid={`blueprint-section-${section.label.toLowerCase().replace(/\s/g, "-")}`}>
                  <CardHeader><CardTitle className="text-xs text-primary uppercase tracking-wider">{section.label}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm leading-relaxed">{section.value}</p></CardContent>
                </Card>
              ))}
              {bp.executionChecklist?.length > 0 && (
                <Card className="border-border/60 bg-card">
                  <CardHeader><CardTitle className="text-xs text-primary uppercase tracking-wider">Execution Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {bp.executionChecklist.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            {(campaign.channels as string[]).map((ch) => (
              <Card key={ch} className="border-border/60 bg-card" data-testid={`channel-card-${ch}`}>
                <CardContent className="p-4">
                  <p className="font-semibold capitalize">{ch.replace(/_/g, " ")}</p>
                  <Badge variant="outline" className="text-xs mt-2 border-blue-500/30 text-blue-300">Planned</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { label: "Campaign drafted", done: true },
                  { label: "AI blueprint generated", done: !!bp },
                  { label: "Budget approval requested", done: campaign.status !== "draft" && campaign.status !== "planning" },
                  { label: "Creative approval requested", done: false },
                  { label: "Campaign approved", done: campaign.status === "ready_to_launch" || campaign.status === "active" },
                  { label: "Campaign launched", done: campaign.status === "active" || campaign.status === "optimising" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle size={18} className="text-green-400 shrink-0" />
                    ) : (
                      <Clock size={18} className="text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
