import { useState } from "react";
import { useListAssets, useGenerateAssetPack, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FolderOpen, Plus, Wand2, Copy, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

const MOCK_ASSETS = [
  { id: 1, type: "ad_copy", title: "Google Search Ad — Brand Search Primary", content: "Headline: AI Marketing Platform | Supercharge Campaign ROI\nDescription: AI-powered campaign planning for ambitious marketing teams. ROAS 4.2x average. Start free trial — no credit card.", status: "approved", approvalStatus: "approved", createdBy: 1, organizationId: 1, campaignId: 1, campaignName: "Q2 Lead Gen — Enterprise SaaS", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 2, type: "social_post", title: "LinkedIn Launch Post — Product Feature", content: "Something big is here.\n\nWe just launched a multi-channel campaign with SPARK AI — from brief to blueprint in 60 seconds.\n\nHere's what the first 7 days looked like:\n→ 84 qualified leads\n→ $38 CPL vs $52 industry average\n→ 4.2x ROAS across 4 channels\n\nAll from one AI-powered command centre.", status: "approved", approvalStatus: "approved", createdBy: 5, organizationId: 1, campaignId: 2, campaignName: "Product Launch", createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 3, type: "email_copy", title: "Dormant Lead Reactivation — Email 1 of 5", content: "Subject: We've been thinking about you\n\nHi [Name],\n\nIt's been a while, and we wanted to reach out personally.\n\nSince you last engaged with us, we've shipped some things that I think you'd actually care about — especially if campaign planning time is still a challenge for your team.\n\nMind if I share 3 things that changed? Won't take more than 2 minutes to read.", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 4, type: "landing_page_copy", title: "Pricing Page — Hero Section", content: "Headline: Simple, transparent pricing\nSubheadline: Start free. Scale as you grow. No hidden fees.\nBody: Every plan includes full access to the AI Campaign Designer, channel workbenches, and real-time performance insights. Upgrade when you're ready.", status: "approved", approvalStatus: "approved", createdBy: 5, organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 5, type: "whatsapp_message", title: "Demo No-Show Recovery", content: "Hi [Name], looks like we missed each other earlier — no worries at all. Would [Day] at [Time] work better? I have some new AI features I'd love to walk you through. Should only take 20 minutes.", status: "approved", approvalStatus: "approved", createdBy: 1, organizationId: 1, campaignId: null, campaignName: null, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const TYPE_LABELS: Record<string, string> = {
  ad_copy: "Ad Copy", social_post: "Social Post", email_copy: "Email Copy",
  landing_page_copy: "Landing Page", whatsapp_message: "WhatsApp", all: "All",
};
const APPROVAL_BADGE: Record<string, string> = {
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};
const APPROVAL_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle size={12} className="text-green-400" />,
  pending: <Clock size={12} className="text-amber-400" />,
  rejected: <XCircle size={12} className="text-red-400" />,
};

export default function Assets() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: assets = MOCK_ASSETS } = useListAssets({ type: typeFilter !== "all" ? typeFilter : undefined }, { query: { queryKey: getListAssetsQueryKey({ type: typeFilter !== "all" ? typeFilter : undefined }) } });
  const genMutation = useGenerateAssetPack({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() }); setShowGenDialog(false); } } });

  const displayAssets = (assets.length > 0 ? assets : MOCK_ASSETS).filter(
    (a) => typeFilter === "all" || a.type === typeFilter
  );

  const copyContent = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-assets">Asset Library</h1>
          <p className="text-muted-foreground text-sm">{displayAssets.length} assets · AI-generated copy and creative assets</p>
        </div>
        <Button onClick={() => setShowGenDialog(true)} className="gap-2" data-testid="btn-generate-assets">
          <Wand2 size={14} /> Generate Assets
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44" data-testid="select-type-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {displayAssets.map((asset) => (
          <Card key={asset.id} className="border-border/60 bg-card" data-testid={`asset-card-${asset.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm">{asset.title}</p>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">{TYPE_LABELS[asset.type] ?? asset.type}</Badge>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${APPROVAL_BADGE[asset.approvalStatus]}`}>
                      {APPROVAL_ICON[asset.approvalStatus]}
                      <span className="capitalize">{asset.approvalStatus}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{asset.campaignName ? `${asset.campaignName} · ` : ""}{new Date(asset.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyContent(asset.id, asset.content)} data-testid={`btn-copy-asset-${asset.id}`}>
                  {copiedId === asset.id ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/40 whitespace-pre-wrap font-sans leading-relaxed line-clamp-5">{asset.content}</pre>
            </CardContent>
          </Card>
        ))}
        {displayAssets.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>No assets yet</p>
            <Button className="mt-4 gap-2" onClick={() => setShowGenDialog(true)} data-testid="btn-empty-generate"><Wand2 size={14} /> Generate Assets</Button>
          </div>
        )}
      </div>

      <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 size={16} className="text-primary" /> Generate Asset Pack</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">SPARK AI will generate a full asset pack including ad copy, social posts, email copy, and WhatsApp messages for your campaign.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenDialog(false)}>Cancel</Button>
            <Button onClick={() => genMutation.mutate({ data: { channels: ["ppc", "social", "email", "whatsapp"] } })} disabled={genMutation.isPending} data-testid="btn-confirm-generate-assets">
              {genMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Generate Pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
