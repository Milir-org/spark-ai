import { useState } from "react";
import { Link } from "wouter";
import { useGetPpcData, useGenerateAdCopy, getGetPpcDataQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MonitorPlay, Wand2, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader2, Copy, AlertCircle, RefreshCw, ExternalLink, Plug, ArrowRight } from "lucide-react";

const MOCK_PPC = {
  totalSpend: 58420, cpc: 3.24, ctr: 3.1, conversions: 847, cpa: 68.98, roas: 4.2,
  recommendations: [
    "Increase budget for 'Enterprise SaaS' campaign by 20% — ROAS is 6.1x vs 4.2x average",
    "Pause 'Competitor Keywords' ad group — CPA is $142, 2x higher than target",
    "Add 14 negative keywords to reduce wasted spend on non-converting queries",
  ],
  campaigns: [
    { name: "Brand Search — Core", spend: 12400, cpc: 1.82, ctr: 5.4, conversions: 312, status: "active" },
    { name: "Non-Brand — Growth", spend: 18900, cpc: 3.91, ctr: 2.8, conversions: 247, status: "active" },
    { name: "Competitor Conquest", spend: 8200, cpc: 5.12, ctr: 1.9, conversions: 58, status: "active" },
    { name: "Remarketing — Visitors", spend: 11400, cpc: 2.34, ctr: 4.1, conversions: 189, status: "active" },
    { name: "LinkedIn Lead Gen", spend: 7520, cpc: 6.84, ctr: 1.4, conversions: 41, status: "paused" },
  ],
  platforms: [
    { name: "Google Ads", status: "connected", logo: "google" },
    { name: "Microsoft Ads", status: "not_connected", logo: "microsoft" },
    { name: "Meta Ads", status: "connected", logo: "meta" },
    { name: "LinkedIn Ads", status: "connected", logo: "linkedin" },
  ],
};

export default function PPC() {
  const [showAdCopyDialog, setShowAdCopyDialog] = useState(false);
  const [adCopyProduct, setAdCopyProduct] = useState("");
  const [adCopyAudience, setAdCopyAudience] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState<any[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const { data: ppc = MOCK_PPC, isLoading } = useGetPpcData({ query: { queryKey: getGetPpcDataQueryKey() } });
  const genCopyMutation = useGenerateAdCopy({
    mutation: {
      onSuccess: (data) => { setGeneratedCopy(data as any[]); }
    }
  });

  const handleGenCopy = () => {
    genCopyMutation.mutate({ data: { product: adCopyProduct, targetAudience: adCopyAudience, tone: "professional" } });
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const kpis = [
    { label: "Total Spend", value: `$${(ppc.totalSpend / 1000).toFixed(1)}k`, color: "text-amber-400" },
    { label: "Avg CPC", value: `$${ppc.cpc}`, color: "text-muted-foreground" },
    { label: "CTR", value: `${ppc.ctr}%`, color: "text-primary" },
    { label: "Conversions", value: ppc.conversions.toLocaleString(), color: "text-green-400" },
    { label: "CPA", value: `$${ppc.cpa}`, color: "text-muted-foreground" },
    { label: "ROAS", value: `${ppc.roas}x`, color: "text-accent" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-ppc">
            <MonitorPlay size={20} className="text-primary" /> PPC Workbench
          </h1>
          <p className="text-muted-foreground text-sm">Paid search and social advertising command centre</p>
        </div>
        <Button onClick={() => setShowAdCopyDialog(true)} className="gap-2" data-testid="btn-generate-ad-copy">
          <Wand2 size={14} /> Generate Ad Copy
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/60 bg-card" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="platforms">Ad Network APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Campaign</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Spend</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">CPC</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">CTR</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Conv.</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ppc.campaigns.map((c, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-card/80" data-testid={`ppc-row-${i}`}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${c.spend.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${c.cpc}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{c.ctr}%</td>
                        <td className="px-4 py-3 text-right font-medium text-primary">{c.conversions}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`text-xs ${c.status === "active" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{c.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4 space-y-3">
          {ppc.recommendations.map((rec, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`ppc-rec-${i}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <Wand2 size={14} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{rec}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="platforms" className="mt-4 space-y-4">
          {/* Banner linking to full API settings */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Plug size={14} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Manage API keys, webhooks and rate limits for all networks in</span>
              <Link href="/settings/api-connections" className="text-primary font-medium hover:underline underline-offset-2">
                Settings → API Connections
              </Link>
            </div>
            <Link href="/settings/api-connections">
              <Button size="sm" variant="outline" className="gap-1 h-7 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10">
                Manage All <ArrowRight size={11} />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Google Ads", status: "connected", accountId: "123-456-7890", lastSync: "2 min ago", dailyCalls: 8420, callLimit: 15000, docsUrl: "https://developers.google.com/google-ads/api/docs/start" },
              { name: "Meta Ads", status: "connected", accountId: "act_98765432", lastSync: "5 min ago", dailyCalls: 3210, callLimit: 10000, docsUrl: "https://developers.facebook.com/docs/marketing-apis/" },
              { name: "LinkedIn Ads", status: "connected", accountId: "506123456", lastSync: "18 min ago", dailyCalls: 940, callLimit: 5000, docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/" },
              { name: "Microsoft Ads", status: "disconnected", accountId: null, lastSync: null, dailyCalls: 0, callLimit: 0, docsUrl: "https://learn.microsoft.com/en-us/advertising/guides/" },
              { name: "TikTok for Business", status: "disconnected", accountId: null, lastSync: null, dailyCalls: 0, callLimit: 0, docsUrl: "https://ads.tiktok.com/marketing_api/docs" },
            ].map((p, i) => {
              const usagePct = p.callLimit ? Math.round((p.dailyCalls / p.callLimit) * 100) : 0;
              return (
                <Card
                  key={i}
                  className={`border-border/60 bg-card ${p.status === "connected" ? "border-green-500/20" : ""}`}
                  data-testid={`platform-${i}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-center text-xs font-bold text-primary">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          {p.status === "connected"
                            ? <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Connected · {p.accountId}</p>
                            : <p className="text-xs text-muted-foreground flex items-center gap-1"><XCircle size={10} /> Not connected</p>
                          }
                        </div>
                      </div>
                      <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="API Docs">
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    {p.status === "connected" && p.callLimit > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">API calls today</span>
                          <span className={usagePct > 80 ? "text-amber-400" : "text-muted-foreground"}>
                            {p.dailyCalls.toLocaleString()} / {p.callLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usagePct > 80 ? "bg-amber-400" : "bg-primary"}`}
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Last sync: {p.lastSync}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {p.status === "connected" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" data-testid={`btn-sync-ppc-${i}`}>
                          <RefreshCw size={11} /> Sync
                        </Button>
                      )}
                      <Link href="/settings/api-connections">
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs gap-1" data-testid={`btn-configure-ppc-${i}`}>
                          {p.status === "connected" ? "Configure" : "Connect"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdCopyDialog} onOpenChange={setShowAdCopyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 size={16} className="text-primary" /> Generate Ad Copy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Product / Service</Label><Input placeholder="e.g. SPARK AI — AI marketing platform" value={adCopyProduct} onChange={(e) => setAdCopyProduct(e.target.value)} className="mt-1" /></div>
            <div><Label>Target Audience</Label><Input placeholder="e.g. Marketing managers at B2B SaaS companies" value={adCopyAudience} onChange={(e) => setAdCopyAudience(e.target.value)} className="mt-1" /></div>
            {generatedCopy.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {generatedCopy.map((copy, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/60 bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{copy.platform}</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(`${copy.headline}\n${copy.description}\n${copy.cta}`, i)}>
                        {copiedIdx === i ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                      </Button>
                    </div>
                    <p className="text-sm font-semibold">{copy.headline}</p>
                    <p className="text-xs text-muted-foreground mt-1">{copy.description}</p>
                    <p className="text-xs text-primary mt-1 font-medium">CTA: {copy.cta}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdCopyDialog(false)}>Close</Button>
            <Button onClick={handleGenCopy} disabled={genCopyMutation.isPending} data-testid="btn-confirm-gen-copy">
              {genCopyMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Generate Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
