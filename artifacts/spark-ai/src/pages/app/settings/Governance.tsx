import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";

const GOVERNANCE_RULES = [
  { id: 1, name: "Budget Change Approval", description: "All campaign budget changes >$1,000 require Finance Approver sign-off", enabled: true, type: "finance" },
  { id: 2, name: "Campaign Launch Approval", description: "All new campaign launches require Marketing Manager approval", enabled: true, type: "campaign" },
  { id: 3, name: "Creative Asset Approval", description: "All ad copy and creative assets require Creative Reviewer sign-off", enabled: true, type: "creative" },
  { id: 4, name: "CRM Segment Activation", description: "Mass outreach to >100 contacts requires Manager approval", enabled: true, type: "crm" },
  { id: 5, name: "AI Autonomous Actions", description: "Any AI-initiated action requires human approval before execution", enabled: true, type: "ai" },
  { id: 6, name: "Integration Changes", description: "Connecting or disconnecting integrations requires Admin approval", enabled: false, type: "system" },
  { id: 7, name: "Data Export Controls", description: "CRM or contact data exports require Owner approval", enabled: true, type: "data" },
];

export default function Governance() {
  const { user } = useAuth();
  const isEnterprise = user?.organizationPlan === "enterprise";

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-governance">
          <Lock size={20} className="text-primary" /> Governance Controls
        </h1>
        <p className="text-muted-foreground text-sm">Platform-wide approval rules and risk management policies</p>
      </div>

      {!isEnterprise && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Lock size={14} className="text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-300">Enterprise feature</p>
                <p className="text-xs text-muted-foreground">Custom governance rules are available on the Enterprise plan. Current rules are SPARK AI defaults.</p>
              </div>
            </div>
            <Button size="sm" data-testid="btn-upgrade-governance">Upgrade</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {GOVERNANCE_RULES.map((rule) => (
          <Card key={rule.id} className="border-border/60 bg-card" data-testid={`governance-rule-${rule.id}`}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Shield size={14} className={`mt-0.5 shrink-0 ${rule.enabled ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground capitalize">{rule.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
              </div>
              <Switch checked={rule.enabled} disabled={!isEnterprise} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Risk Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { label: "Budget change approval threshold", value: "$1,000" },
            { label: "Mass outreach approval threshold", value: "100 contacts" },
            { label: "High-risk action confidence minimum", value: "85%" },
            { label: "Automatic rejection threshold (AI confidence)", value: "<40%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-primary">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
