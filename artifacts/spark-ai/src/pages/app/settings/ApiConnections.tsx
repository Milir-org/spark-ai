import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plug, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff,
  ExternalLink, Loader2, Copy, Check, Settings, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "connected" | "error" | "disconnected" | "pending";

interface ApiPlatform {
  id: string;
  name: string;
  category: string;
  description: string;
  docsUrl: string;
  status: ConnectionStatus;
  accountId?: string;
  lastSync?: string;
  dailyCalls?: number;
  callLimit?: number;
  scopes?: string[];
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

const PLATFORMS: ApiPlatform[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    category: "PPC",
    description: "Search, Display, Shopping, YouTube, and Performance Max campaigns",
    docsUrl: "https://developers.google.com/google-ads/api/docs/start",
    status: "connected",
    accountId: "123-456-7890",
    lastSync: "2 minutes ago",
    dailyCalls: 8420,
    callLimit: 15000,
    scopes: ["ads.manage", "analytics.read"],
    fields: [
      { key: "developer_token", label: "Developer Token", placeholder: "ABCDEF-GHIJKL-MNOPQR", secret: true },
      { key: "client_id", label: "OAuth Client ID", placeholder: "12345.apps.googleusercontent.com" },
      { key: "client_secret", label: "OAuth Client Secret", placeholder: "GOCSPX-xxxx", secret: true },
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" },
    ],
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    category: "PPC",
    description: "Facebook, Instagram, Audience Network, and Messenger advertising",
    docsUrl: "https://developers.facebook.com/docs/marketing-apis/",
    status: "connected",
    accountId: "act_98765432",
    lastSync: "5 minutes ago",
    dailyCalls: 3210,
    callLimit: 10000,
    scopes: ["ads_management", "ads_read", "business_management"],
    fields: [
      { key: "access_token", label: "System User Access Token", placeholder: "EAAxxxxx", secret: true },
      { key: "app_id", label: "App ID", placeholder: "123456789012345" },
      { key: "app_secret", label: "App Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_98765432" },
    ],
  },
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    category: "PPC",
    description: "B2B targeting via Sponsored Content, Message Ads, and Lead Gen Forms",
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/",
    status: "connected",
    accountId: "506123456",
    lastSync: "18 minutes ago",
    dailyCalls: 940,
    callLimit: 5000,
    scopes: ["r_ads", "rw_ads", "r_organization_admin"],
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "86xxxxxxxx" },
      { key: "client_secret", label: "Client Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "access_token", label: "Access Token", placeholder: "AQVxxxxxxx", secret: true },
      { key: "account_id", label: "Account ID", placeholder: "506123456" },
    ],
  },
  {
    id: "microsoft-ads",
    name: "Microsoft Ads",
    category: "PPC",
    description: "Bing Search, Microsoft Audience Network, and LinkedIn profile targeting",
    docsUrl: "https://learn.microsoft.com/en-us/advertising/guides/",
    status: "disconnected",
    fields: [
      { key: "developer_token", label: "Developer Token", placeholder: "BBD37VTxxxxxxxx", secret: true },
      { key: "client_id", label: "Application Client ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "client_secret", label: "Client Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "customer_id", label: "Customer ID", placeholder: "1234567890" },
    ],
  },
  {
    id: "tiktok-ads",
    name: "TikTok for Business",
    category: "PPC",
    description: "TopView, In-Feed Ads, Branded Hashtag Challenges, and Spark Ads",
    docsUrl: "https://ads.tiktok.com/marketing_api/docs",
    status: "disconnected",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "app_id", label: "App ID", placeholder: "1234567890123456789" },
      { key: "secret", label: "App Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "advertiser_id", label: "Advertiser ID", placeholder: "1234567890123456789" },
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    category: "Analytics",
    description: "Web and app analytics, conversion tracking, and audience data",
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    status: "connected",
    accountId: "GA4-298XXXXXX",
    lastSync: "1 hour ago",
    dailyCalls: 320,
    callLimit: 2000,
    fields: [
      { key: "property_id", label: "GA4 Property ID", placeholder: "298XXXXXX" },
      { key: "service_account", label: "Service Account JSON", placeholder: "Paste JSON key…", secret: true },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    category: "CRM",
    description: "Contacts, deals, companies, email marketing and marketing automation",
    docsUrl: "https://developers.hubspot.com/docs/api/overview",
    status: "error",
    accountId: "hub_4521xxx",
    lastSync: "3 hours ago (failed)",
    dailyCalls: 0,
    callLimit: 100000,
    fields: [
      { key: "private_app_token", label: "Private App Token", placeholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", secret: true },
      { key: "portal_id", label: "Portal ID", placeholder: "12345678" },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Leads, opportunities, campaigns, and marketing cloud integration",
    docsUrl: "https://developer.salesforce.com/docs/apis",
    status: "disconnected",
    fields: [
      { key: "client_id", label: "Consumer Key", placeholder: "3MVG9xxxxxxxxxxxxxxxx" },
      { key: "client_secret", label: "Consumer Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "instance_url", label: "Instance URL", placeholder: "https://yourorg.salesforce.com" },
      { key: "username", label: "Username", placeholder: "user@company.com" },
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Email",
    description: "Email campaigns, automations, audiences, and transactional email",
    docsUrl: "https://mailchimp.com/developer/marketing/api/",
    status: "disconnected",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1", secret: true },
      { key: "server_prefix", label: "Server Prefix", placeholder: "us1" },
    ],
  },
  {
    id: "semrush",
    name: "Semrush",
    category: "SEO",
    description: "Keyword research, backlink analysis, site audits, and competitor intelligence",
    docsUrl: "https://developer.semrush.com/api/",
    status: "disconnected",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
    ],
  },
  {
    id: "ahrefs",
    name: "Ahrefs",
    category: "SEO",
    description: "Backlinks, organic keywords, site explorer, and rank tracker",
    docsUrl: "https://ahrefs.com/api",
    status: "disconnected",
    fields: [
      { key: "api_key", label: "API Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Messaging",
    description: "SMS, WhatsApp, and voice messaging for outbound campaigns",
    docsUrl: "https://www.twilio.com/docs/usage/api",
    status: "disconnected",
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "auth_token", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "from_number", label: "From Number", placeholder: "+15551234567" },
    ],
  },
];

const CATEGORY_ORDER = ["PPC", "Analytics", "CRM", "Email", "SEO", "Messaging"];

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected: { label: "Connected", color: "border-green-500/30 text-green-300", icon: <CheckCircle size={14} className="text-green-400" /> },
  error: { label: "Auth Error", color: "border-red-500/30 text-red-300", icon: <AlertCircle size={14} className="text-red-400" /> },
  disconnected: { label: "Not Connected", color: "border-border text-muted-foreground", icon: <XCircle size={14} className="text-muted-foreground" /> },
  pending: { label: "Connecting…", color: "border-amber-500/30 text-amber-300", icon: <Loader2 size={14} className="animate-spin text-amber-400" /> },
};

function MaskedValue({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono text-muted-foreground">{show ? value : "•".repeat(Math.min(value.length, 24))}</code>
      <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground transition-colors">
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

function PlatformCard({ platform, onConfigure }: { platform: ApiPlatform; onConfigure: (p: ApiPlatform) => void }) {
  const status = STATUS_CONFIG[platform.status];
  const usagePct = platform.callLimit ? Math.round((platform.dailyCalls! / platform.callLimit) * 100) : 0;

  return (
    <Card
      className={`border-border/60 bg-card transition-colors ${platform.status === "connected" ? "border-green-500/20" : platform.status === "error" ? "border-red-500/20" : ""}`}
      data-testid={`api-card-${platform.id}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {platform.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{platform.name}</p>
              <p className="text-xs text-muted-foreground">{platform.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs ${status.color}`}>
              <span className="flex items-center gap-1">{status.icon}{status.label}</span>
            </Badge>
          </div>
        </div>

        {platform.status === "connected" && (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Account ID</p>
                <div className="flex items-center gap-1">
                  <code className="font-mono text-foreground">{platform.accountId}</code>
                  <CopyButton value={platform.accountId!} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Last Sync</p>
                <p className="text-foreground">{platform.lastSync}</p>
              </div>
            </div>
            {platform.callLimit && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">API Usage today</span>
                  <span className={usagePct > 80 ? "text-amber-400" : "text-muted-foreground"}>{platform.dailyCalls!.toLocaleString()} / {platform.callLimit.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePct > 80 ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
            )}
            {platform.scopes && (
              <div className="flex flex-wrap gap-1">
                {platform.scopes.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs border-border/40 text-muted-foreground font-mono">{s}</Badge>
                ))}
              </div>
            )}
          </>
        )}

        {platform.status === "error" && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <AlertCircle size={12} className="shrink-0" />
            Access token expired or revoked. Reconfigure credentials to restore sync.
          </div>
        )}

        <Separator className="bg-border/40" />

        <div className="flex items-center justify-between gap-2">
          <a
            href={platform.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink size={11} /> API Docs
          </a>
          <div className="flex gap-2">
            {platform.status === "connected" && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" data-testid={`btn-sync-${platform.id}`}>
                <RefreshCw size={11} /> Sync now
              </Button>
            )}
            <Button
              size="sm"
              variant={platform.status === "connected" ? "outline" : "default"}
              className="h-7 px-3 text-xs gap-1"
              onClick={() => onConfigure(platform)}
              data-testid={`btn-configure-${platform.id}`}
            >
              <Settings size={11} /> {platform.status === "connected" ? "Configure" : platform.status === "error" ? "Reconnect" : "Connect"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigureDialog({ platform, open, onClose }: { platform: ApiPlatform | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  if (!platform) return null;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast({ title: `${platform.name} configured`, description: "API credentials saved and connection verified." });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {platform.name.slice(0, 2).toUpperCase()}
            </div>
            Configure {platform.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/40 text-xs text-muted-foreground">
            <Zap size={12} className="text-primary shrink-0" />
            Credentials are encrypted at rest. Never share your secret tokens.{" "}
            <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 whitespace-nowrap">
              API Docs ↗
            </a>
          </div>

          {platform.fields.map((field) => (
            <div key={field.key}>
              <Label className="text-xs font-medium">{field.label}</Label>
              <div className="relative mt-1">
                <Input
                  type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="pr-8 font-mono text-xs"
                  data-testid={`input-${platform.id}-${field.key}`}
                />
                {field.secret && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets((s) => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecrets[field.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <Separator className="bg-border/40" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Webhook Events</p>
              <p className="text-xs text-muted-foreground">Receive real-time push updates</p>
            </div>
            <Switch checked={webhookEnabled} onCheckedChange={setWebhookEnabled} data-testid={`switch-webhook-${platform.id}`} />
          </div>

          {webhookEnabled && (
            <div>
              <Label className="text-xs font-medium">Webhook Endpoint</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input readOnly value="https://api.sparkapp.io/webhooks/inbound" className="font-mono text-xs text-muted-foreground" />
                <CopyButton value="https://api.sparkapp.io/webhooks/inbound" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paste this URL into your {platform.name} developer console.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} data-testid={`btn-save-${platform.id}`}>
            {saving ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
            {saving ? "Verifying…" : "Save & Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ApiConnections() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [configuringPlatform, setConfiguringPlatform] = useState<ApiPlatform | null>(null);

  const categories = ["All", ...CATEGORY_ORDER];
  const filtered = activeCategory === "All" ? PLATFORMS : PLATFORMS.filter((p) => p.category === activeCategory);

  const connected = PLATFORMS.filter((p) => p.status === "connected").length;
  const errors = PLATFORMS.filter((p) => p.status === "error").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-api-connections">
            <Plug size={20} className="text-primary" /> API Connections
          </h1>
          <p className="text-muted-foreground text-sm">Manage credentials and API keys for every connected platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-green-500/30 text-green-300 gap-1">
            <CheckCircle size={11} /> {connected} connected
          </Badge>
          {errors > 0 && (
            <Badge variant="outline" className="border-red-500/30 text-red-300 gap-1">
              <AlertCircle size={11} /> {errors} error{errors > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} onConfigure={setConfiguringPlatform} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ConfigureDialog
        platform={configuringPlatform}
        open={!!configuringPlatform}
        onClose={() => setConfiguringPlatform(null)}
      />
    </div>
  );
}
