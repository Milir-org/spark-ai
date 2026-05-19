import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Download, User, Settings, Zap, Shield, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth";

const AUDIT_EVENTS = [
  { id: 1, user: "Alex Chen", action: "Campaign Created", resource: "Q2 Lead Gen — Enterprise SaaS", type: "campaign", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), ip: "103.21.44.12" },
  { id: 2, user: "Sarah Park", action: "Approval Submitted", resource: "Budget Increase — $8,000", type: "approval", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), ip: "103.21.44.19" },
  { id: 3, user: "Alex Chen", action: "Blueprint Generated", resource: "Q2 Lead Gen — Enterprise SaaS", type: "ai", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), ip: "103.21.44.12" },
  { id: 4, user: "James Wong", action: "Budget Approved", resource: "PPC Campaign — +$8,000", type: "finance", timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), ip: "103.21.44.30" },
  { id: 5, user: "Priya Sharma", action: "Integration Connected", resource: "Google Ads", type: "system", timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), ip: "103.21.44.44" },
  { id: 6, user: "David Lee", action: "Asset Approved", resource: "LinkedIn Ad Copy — 3 Variants", type: "creative", timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), ip: "103.21.44.51" },
  { id: 7, user: "Nina Foster", action: "Report Viewed", resource: "April 2026 Monthly Performance", type: "report", timestamp: new Date(Date.now() - 30 * 3600000).toISOString(), ip: "103.21.44.55" },
  { id: 8, user: "Alex Chen", action: "User Invited", resource: "nina@milir.ai (Viewer)", type: "user", timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), ip: "103.21.44.12" },
  { id: 9, user: "Alex Chen", action: "AI Settings Changed", resource: "Autonomous Actions: Disabled", type: "settings", timestamp: new Date(Date.now() - 72 * 3600000).toISOString(), ip: "103.21.44.12" },
  { id: 10, user: "Sarah Park", action: "Campaign Submitted for Approval", resource: "Product Launch — SPARK Pro Features", type: "campaign", timestamp: new Date(Date.now() - 96 * 3600000).toISOString(), ip: "103.21.44.19" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  campaign: <Zap size={12} className="text-primary" />,
  approval: <Shield size={12} className="text-amber-400" />,
  ai: <Zap size={12} className="text-cyan-400" />,
  finance: <DollarSign size={12} className="text-green-400" />,
  system: <Settings size={12} className="text-muted-foreground" />,
  creative: <Shield size={12} className="text-pink-400" />,
  report: <ScrollText size={12} className="text-blue-400" />,
  user: <User size={12} className="text-violet-400" />,
  settings: <Settings size={12} className="text-muted-foreground" />,
};

export default function Audit() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const isEnterprise = user?.organizationPlan === "enterprise";

  const filtered = AUDIT_EVENTS.filter(e =>
    (typeFilter === "all" || e.type === typeFilter) &&
    (!search || e.action.toLowerCase().includes(search.toLowerCase()) || e.user.toLowerCase().includes(search.toLowerCase()) || e.resource.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-audit">
            <ScrollText size={20} className="text-primary" /> Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">Complete activity trail for compliance and governance</p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="btn-export-audit"><Download size={14} /> Export CSV</Button>
      </div>

      {!isEnterprise && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-xs text-amber-300">Full audit log export and 12-month retention are Enterprise features. Showing last 30 days of activity.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events, users, resources..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-audit-search" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9" data-testid="select-audit-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["campaign", "approval", "ai", "finance", "system", "creative", "report", "user", "settings"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Resource</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(event => (
                  <tr key={event.id} className="border-b border-border/40 hover:bg-card/80" data-testid={`audit-row-${event.id}`}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{event.user}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs">{TYPE_ICONS[event.type]}{event.action}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-48 truncate">{event.resource}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{event.ip}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No audit events match your filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
