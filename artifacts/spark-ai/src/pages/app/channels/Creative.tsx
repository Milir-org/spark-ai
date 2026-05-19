import { useState } from "react";
import { useListAssets, useGenerateAssetPack, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Wand2, CheckCircle, Clock, Copy, Loader2 } from "lucide-react";

const MOCK_ASSETS = [
  { id: 1, type: "ad_copy", title: "Google Search Ad — Brand Search Primary", content: "Headline: AI Marketing Platform | Supercharge Campaign ROI\nDescription: AI-powered campaign planning. ROAS 4.2x average. Start free trial.", status: "approved", approvalStatus: "approved", createdBy: 1, organizationId: 1, campaignId: 1, campaignName: "Q2 Lead Gen", createdAt: new Date().toISOString() },
  { id: 2, type: "social_post", title: "LinkedIn Launch Post", content: "Something big is here. We just launched a multi-channel campaign with SPARK AI — from brief to blueprint in 60 seconds.", status: "approved", approvalStatus: "approved", createdBy: 5, organizationId: 1, campaignId: 2, campaignName: "Product Launch", createdAt: new Date().toISOString() },
  { id: 3, type: "email_copy", title: "Dormant Lead Email 1 of 5", content: "Subject: We've been thinking about you\n\nHi [Name], It's been a while, and we wanted to reach out personally...", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date().toISOString() },
  { id: 4, type: "landing_page_copy", title: "Pricing Page — Hero", content: "Headline: Simple, transparent pricing\nSubheadline: Start free. Scale as you grow. No hidden fees.", status: "approved", approvalStatus: "approved", createdBy: 5, organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date().toISOString() },
];

const TYPE_COLORS: Record<string, string> = {
  ad_copy: "border-blue-500/30 text-blue-300",
  social_post: "border-cyan-500/30 text-cyan-300",
  email_copy: "border-violet-500/30 text-violet-300",
  landing_page_copy: "border-pink-500/30 text-pink-300",
  whatsapp_message: "border-green-500/30 text-green-300",
};

const TYPE_LABELS: Record<string, string> = {
  ad_copy: "Ad Copy", social_post: "Social Post", email_copy: "Email Copy",
  landing_page_copy: "Landing Page", whatsapp_message: "WhatsApp",
};

export default function Creative() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: assets = MOCK_ASSETS } = useListAssets({}, { query: { queryKey: getListAssetsQueryKey() } });
  const genMutation = useGenerateAssetPack({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() }); setShowDialog(false); } } });

  const displayAssets = assets.length > 0 ? assets : MOCK_ASSETS;

  const copyContent = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const byType = displayAssets.reduce<Record<string, typeof displayAssets>>((acc, asset) => {
    if (!acc[asset.type]) acc[asset.type] = [];
    acc[asset.type].push(asset);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-creative">
            <Palette size={20} className="text-primary" /> Creative Assets Workbench
          </h1>
          <p className="text-muted-foreground text-sm">AI-generated copy, assets, and creative approvals</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2" data-testid="btn-generate-assets">
          <Wand2 size={14} /> Generate Asset Pack
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all">All ({displayAssets.length})</TabsTrigger>
          {Object.keys(byType).map((type) => (
            <TabsTrigger key={type} value={type}>{TYPE_LABELS[type] ?? type} ({byType[type].length})</TabsTrigger>
          ))}
        </TabsList>

        {["all", ...Object.keys(byType)].map((tabKey) => {
          const list = tabKey === "all" ? displayAssets : (byType[tabKey] ?? []);
          return (
            <TabsContent key={tabKey} value={tabKey} className="mt-4 space-y-4">
              {list.map((asset) => (
                <Card key={asset.id} className="border-border/60 bg-card" data-testid={`creative-asset-${asset.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{asset.title}</p>
                        <Badge variant="outline" className={`text-xs ${TYPE_COLORS[asset.type] ?? "border-border text-muted-foreground"}`}>{TYPE_LABELS[asset.type] ?? asset.type}</Badge>
                        {asset.approvalStatus === "approved" ? (
                          <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={10} /> Approved</div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-400"><Clock size={10} /> Pending review</div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyContent(asset.id, asset.content)}>
                        {copiedId === asset.id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                      </Button>
                    </div>
                    <pre className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/40 whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">{asset.content}</pre>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 size={16} className="text-primary" /> Generate Asset Pack</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">SPARK AI will generate a full asset pack — ad copy, social posts, email copy, landing page copy, and WhatsApp messages.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => genMutation.mutate({ data: { channels: ["ppc", "social", "email", "whatsapp"] } })} disabled={genMutation.isPending} data-testid="btn-confirm-gen-assets">
              {genMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
