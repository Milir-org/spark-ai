import { useState } from "react";
import { useListIntegrations, useConnectIntegration, useDisconnectIntegration, getListIntegrationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, CheckCircle, XCircle, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

const MOCK_INTEGRATIONS = [
  { id: 1, provider: "Google Ads", category: "advertising", status: "connected", description: "Sync campaigns, ad groups, keywords, and performance data with Google Ads.", logo: "google", lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 2, provider: "Meta Ads", category: "advertising", status: "connected", description: "Connect Facebook and Instagram ad campaigns, audiences, and creative performance.", logo: "meta", lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 3, provider: "LinkedIn Ads", category: "advertising", status: "connected", description: "LinkedIn Campaign Manager — sponsored content, lead gen forms, and audience insights.", logo: "linkedin", lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 4, provider: "Microsoft Ads", category: "advertising", status: "not_connected", description: "Bing Ads / Microsoft Advertising — reach additional search audiences with cross-platform sync.", logo: "microsoft", lastSyncedAt: null },
  { id: 5, provider: "HubSpot", category: "crm", status: "connected", description: "Full CRM integration — contacts, deals, sequences, and lifecycle stage sync.", logo: "hubspot", lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 6, provider: "Salesforce", category: "crm", status: "not_connected", description: "Enterprise CRM integration with Opportunities, Leads, and Campaign attribution.", logo: "salesforce", lastSyncedAt: null },
  { id: 7, provider: "Google Analytics 4", category: "analytics", status: "connected", description: "Website traffic, conversion events, and audience data from GA4.", logo: "google", lastSyncedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 8, provider: "Mixpanel", category: "analytics", status: "not_connected", description: "Product analytics — user behaviour, funnels, and retention analysis.", logo: "mixpanel", lastSyncedAt: null },
  { id: 9, provider: "Mailchimp", category: "email", status: "not_connected", description: "Email lists, campaigns, and automations from Mailchimp.", logo: "mailchimp", lastSyncedAt: null },
  { id: 10, provider: "Klaviyo", category: "email", status: "not_connected", description: "Advanced email and SMS marketing automation with segmentation.", logo: "klaviyo", lastSyncedAt: null },
  { id: 11, provider: "WhatsApp Business", category: "messaging", status: "not_connected", description: "WhatsApp Business API — message flows, templates, and conversation management.", logo: "whatsapp", lastSyncedAt: null },
  { id: 12, provider: "Canva", category: "creative", status: "not_connected", description: "Design assets from Canva — export to SPARK AI asset library automatically.", logo: "canva", lastSyncedAt: null },
  { id: 13, provider: "Stripe", category: "billing", status: "not_connected", description: "Revenue attribution — link conversions to actual Stripe payments and MRR.", logo: "stripe", lastSyncedAt: null },
  { id: 14, provider: "SEMrush", category: "seo", status: "not_connected", description: "Keyword rankings, backlink analysis, and competitive intelligence.", logo: "semrush", lastSyncedAt: null },
];

const CATEGORY_LABELS: Record<string, string> = {
  advertising: "Advertising", crm: "CRM", analytics: "Analytics", email: "Email",
  messaging: "Messaging", creative: "Creative", billing: "Billing", seo: "SEO", all: "All",
};

const LOGO_COLORS: Record<string, string> = {
  google: "bg-blue-500/20 text-blue-300", meta: "bg-blue-700/20 text-blue-200",
  linkedin: "bg-blue-600/20 text-blue-300", hubspot: "bg-orange-500/20 text-orange-300",
  salesforce: "bg-blue-400/20 text-blue-300", mixpanel: "bg-purple-500/20 text-purple-300",
  mailchimp: "bg-yellow-500/20 text-yellow-300", klaviyo: "bg-green-500/20 text-green-300",
  whatsapp: "bg-green-500/20 text-green-300", canva: "bg-cyan-500/20 text-cyan-300",
  stripe: "bg-violet-500/20 text-violet-300", semrush: "bg-orange-600/20 text-orange-300",
  microsoft: "bg-blue-500/20 text-blue-300",
};

export default function Integrations() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data: integrations = MOCK_INTEGRATIONS } = useListIntegrations({ category: categoryFilter !== "all" ? categoryFilter : undefined }, { query: { queryKey: getListIntegrationsQueryKey({ category: categoryFilter !== "all" ? categoryFilter : undefined }) } });
  const connectMutation = useConnectIntegration({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() }) } });
  const disconnectMutation = useDisconnectIntegration({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() }) } });

  const handleConnect = async (id: number) => {
    setLoadingId(id);
    try { await connectMutation.mutateAsync({ id }); } finally { setLoadingId(null); }
  };
  const handleDisconnect = async (id: number) => {
    setLoadingId(id);
    try { await disconnectMutation.mutateAsync({ id }); } finally { setLoadingId(null); }
  };

  const displayList = (integrations.length > 0 ? integrations : MOCK_INTEGRATIONS).filter(
    (i) => categoryFilter === "all" || i.category === categoryFilter
  );

  const connectedCount = (integrations.length > 0 ? integrations : MOCK_INTEGRATIONS).filter(i => i.status === "connected").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-integrations">Integration Marketplace</h1>
          <p className="text-muted-foreground text-sm">{connectedCount} connected · Connect your ad platforms, CRM, and analytics tools</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44" data-testid="select-category-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayList.map((integration) => {
          const isConnected = integration.status === "connected";
          const isLoading = loadingId === integration.id;
          const logoClass = LOGO_COLORS[integration.logo ?? "google"] ?? "bg-muted/30 text-muted-foreground";
          return (
            <Card key={integration.id} className={`border-border/60 bg-card ${isConnected ? "border-green-500/30" : ""}`} data-testid={`integration-card-${integration.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${logoClass}`}>
                    {integration.provider.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{integration.provider}</p>
                      {isConnected ? (
                        <CheckCircle size={12} className="text-green-400 shrink-0" />
                      ) : (
                        <XCircle size={12} className="text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground mt-0.5 capitalize">{CATEGORY_LABELS[integration.category]}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{integration.description}</p>
                {isConnected && integration.lastSyncedAt && (
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <RefreshCw size={10} /> Last sync: {new Date(integration.lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
                <Button
                  size="sm"
                  variant={isConnected ? "outline" : "default"}
                  className={`w-full ${isConnected ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : ""}`}
                  disabled={isLoading}
                  onClick={() => isConnected ? handleDisconnect(integration.id) : handleConnect(integration.id)}
                  data-testid={`btn-${isConnected ? "disconnect" : "connect"}-${integration.id}`}
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : isConnected ? "Disconnect" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
