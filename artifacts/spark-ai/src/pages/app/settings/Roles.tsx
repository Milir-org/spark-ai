import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Lock } from "lucide-react";

const ROLES = [
  {
    name: "Owner", color: "border-violet-500/40 text-violet-300", description: "Full platform access. All permissions. Cannot be removed.",
    permissions: { campaigns: true, channels: true, intelligence: true, approvals: true, integrations: true, reports: true, assets: true, billing: true, users: true, governance: true, audit: true },
  },
  {
    name: "Admin", color: "border-blue-500/40 text-blue-300", description: "Platform admin with full access except billing ownership.",
    permissions: { campaigns: true, channels: true, intelligence: true, approvals: true, integrations: true, reports: true, assets: true, billing: false, users: true, governance: true, audit: true },
  },
  {
    name: "Marketing Manager", color: "border-cyan-500/40 text-cyan-300", description: "Campaign creation, channel management, and strategy oversight.",
    permissions: { campaigns: true, channels: true, intelligence: true, approvals: true, integrations: false, reports: true, assets: true, billing: false, users: false, governance: false, audit: false },
  },
  {
    name: "Finance Approver", color: "border-amber-500/40 text-amber-300", description: "Budget and spend approvals. View-only for campaigns and channels.",
    permissions: { campaigns: false, channels: false, intelligence: true, approvals: true, integrations: false, reports: true, assets: false, billing: true, users: false, governance: false, audit: true },
  },
  {
    name: "Channel Specialist", color: "border-green-500/40 text-green-300", description: "Manages individual channel workbenches. No approval authority.",
    permissions: { campaigns: false, channels: true, intelligence: true, approvals: false, integrations: false, reports: true, assets: true, billing: false, users: false, governance: false, audit: false },
  },
  {
    name: "Creative Reviewer", color: "border-pink-500/40 text-pink-300", description: "Reviews and approves creative assets and ad copy.",
    permissions: { campaigns: false, channels: false, intelligence: false, approvals: true, integrations: false, reports: false, assets: true, billing: false, users: false, governance: false, audit: false },
  },
  {
    name: "Viewer", color: "border-border text-muted-foreground", description: "Read-only access to dashboard, reports, and campaigns.",
    permissions: { campaigns: false, channels: false, intelligence: false, approvals: false, integrations: false, reports: true, assets: false, billing: false, users: false, governance: false, audit: false },
  },
];

const PERM_LABELS: Record<string, string> = {
  campaigns: "Campaigns", channels: "Channels", intelligence: "Intelligence",
  approvals: "Approvals", integrations: "Integrations", reports: "Reports",
  assets: "Assets", billing: "Billing", users: "User Management",
  governance: "Governance", audit: "Audit Logs",
};

export default function Roles() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-roles">
          <Shield size={20} className="text-primary" /> Roles & Permissions
        </h1>
        <p className="text-muted-foreground text-sm">Role-based access control — manage what each role can do</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border">Permission</th>
              {ROLES.map(role => (
                <th key={role.name} className="px-3 py-3 text-center border-b border-border">
                  <Badge variant="outline" className={`text-xs ${role.color}`}>{role.name.split(" ")[0]}</Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(PERM_LABELS).map(perm => (
              <tr key={perm} className="border-b border-border/40 hover:bg-card/50" data-testid={`perm-row-${perm}`}>
                <td className="px-4 py-2.5 text-sm">{PERM_LABELS[perm]}</td>
                {ROLES.map(role => (
                  <td key={role.name} className="px-3 py-2.5 text-center">
                    {(role.permissions as any)[perm] ? (
                      <Check size={14} className="text-green-400 mx-auto" />
                    ) : (
                      <X size={14} className="text-muted-foreground/30 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {ROLES.map(role => (
          <Card key={role.name} className="border-border/60 bg-card" data-testid={`role-card-${role.name.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-xs ${role.color}`}>{role.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
