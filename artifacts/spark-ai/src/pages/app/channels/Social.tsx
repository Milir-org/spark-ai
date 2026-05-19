import { useState } from "react";
import { useGetSocialData, useGenerateSocialPlan, getGetSocialDataQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Wand2, CheckCircle, XCircle, Clock, Loader2, Edit, Copy } from "lucide-react";

const MOCK_SOCIAL = {
  posts: [
    { id: 1, content: "AI is changing the way marketing teams plan campaigns — not just executing faster, but thinking smarter. Here's what a 70% reduction in campaign planning time looks like in practice.", platform: "LinkedIn", scheduledDate: "2026-05-15", status: "published", engagement: 847 },
    { id: 2, content: "New feature: SPARK AI now generates complete multi-channel campaign blueprints in under 60 seconds. Strategy, audience breakdown, channel plan, creative brief — all in one view.", platform: "LinkedIn", scheduledDate: "2026-05-18", status: "published", engagement: 1204 },
    { id: 3, content: "Why do 74% of leads go cold after 90 days? Because follow-up is inconsistent. SPARK AI's CRM intelligence identifies dormant contacts before they're gone for good.", platform: "Instagram", scheduledDate: "2026-05-20", status: "scheduled", engagement: null },
    { id: 4, content: "Our clients are generating 3.2x more qualified leads with AI-assisted campaign planning. Here's the 4-step approach they're using.", platform: "Twitter/X", scheduledDate: "2026-05-21", status: "scheduled", engagement: null },
    { id: 5, content: "Campaign planning shouldn't take 3 days. With SPARK AI, your entire multi-channel strategy is built in 60 seconds — complete with AI blueprint, audience plan, and creative brief.", platform: "Facebook", scheduledDate: "2026-05-22", status: "draft", engagement: null },
  ],
  platforms: [
    { name: "LinkedIn", followers: "12,400", status: "connected" },
    { name: "Instagram", followers: "8,200", status: "connected" },
    { name: "Facebook", followers: "6,800", status: "connected" },
    { name: "Twitter/X", followers: "4,100", status: "read_only" },
  ],
  engagementSummary: { totalReach: 94200, avgEngagement: 3.8, topPlatform: "LinkedIn" },
};

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-500/20 text-green-300 border-green-500/30",
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  draft: "bg-muted/30 text-muted-foreground border-border",
};

export default function Social() {
  const queryClient = useQueryClient();
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planTheme, setPlanTheme] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any[]>([]);

  const { data: social = MOCK_SOCIAL } = useGetSocialData({ query: { queryKey: getGetSocialDataQueryKey() } });
  const genPlanMutation = useGenerateSocialPlan({
    mutation: { onSuccess: (data) => setGeneratedPlan(data as any[]) }
  });

  const displayPosts = social?.posts ?? MOCK_SOCIAL.posts;
  const platforms = social?.platforms ?? MOCK_SOCIAL.platforms;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-social">
            <Share2 size={20} className="text-primary" /> Social Media Workbench
          </h1>
          <p className="text-muted-foreground text-sm">Content calendar, AI post generation, and engagement analytics</p>
        </div>
        <Button onClick={() => setShowPlanDialog(true)} className="gap-2" data-testid="btn-generate-social-plan">
          <Wand2 size={14} /> Generate Content Plan
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card" data-testid="kpi-total-reach">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Reach</p><p className="text-2xl font-bold text-primary">{(social?.engagementSummary?.totalReach ?? 94200).toLocaleString()}</p></CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Avg Engagement</p><p className="text-2xl font-bold text-accent">{social?.engagementSummary?.avgEngagement ?? 3.8}%</p></CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Top Platform</p><p className="text-2xl font-bold">{social?.engagementSummary?.topPlatform ?? "LinkedIn"}</p></CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Scheduled Posts</p><p className="text-2xl font-bold text-amber-400">{displayPosts.filter(p => p.status === "scheduled").length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="platforms">Platform Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4 space-y-3">
          {displayPosts.map((post) => (
            <Card key={post.id} className="border-border/60 bg-card" data-testid={`social-post-${post.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">{post.platform}</Badge>
                    <Badge variant="outline" className={`text-xs ${STATUS_BADGE[post.status]}`}>{post.status}</Badge>
                    <span className="text-xs text-muted-foreground">{post.scheduledDate}</span>
                    {post.engagement && <span className="text-xs text-green-400 font-medium">{post.engagement.toLocaleString()} engagements</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><Edit size={12} /></Button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {platforms.map((p, i) => (
              <Card key={i} className={`border-border/60 bg-card ${p.status === "connected" ? "border-green-500/20" : ""}`} data-testid={`social-platform-${i}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.followers} followers · <span className={`capitalize ${p.status === "connected" ? "text-green-400" : p.status === "read_only" ? "text-amber-400" : "text-muted-foreground"}`}>{p.status.replace(/_/g, " ")}</span></p>
                  </div>
                  {p.status === "connected" ? <CheckCircle size={16} className="text-green-400" /> : p.status === "read_only" ? <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Read Only</Badge> : <Button size="sm" variant="outline">Connect</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 size={16} className="text-primary" /> Generate Social Content Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Campaign Theme</Label><Input placeholder="e.g. Product Launch — SPARK AI Pro Features" value={planTheme} onChange={(e) => setPlanTheme(e.target.value)} className="mt-1" data-testid="input-plan-theme" /></div>
            {generatedPlan.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generatedPlan.map((post, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/60 bg-card/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{post.platform}</Badge>
                      <span className="text-xs text-muted-foreground">{post.scheduledDate}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Close</Button>
            <Button onClick={() => genPlanMutation.mutate({ data: { theme: planTheme } })} disabled={genPlanMutation.isPending} data-testid="btn-confirm-generate-plan">
              {genPlanMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Generate Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
