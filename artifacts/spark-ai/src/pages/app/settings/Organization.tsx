import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Organization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.organizationName ?? "Milir AI Demo Workspace",
    industry: "B2B SaaS",
    website: "https://milir.ai",
    timezone: "Asia/Singapore",
    currency: "USD",
    primaryLanguage: "en",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Organisation settings saved", description: "Your changes have been applied." });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-org">
          <Building2 size={20} className="text-primary" /> Organisation Settings
        </h1>
        <p className="text-muted-foreground text-sm">Manage your organisation profile and global preferences</p>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Organisation Profile</CardTitle>
          <Badge variant="outline" className="text-xs border-primary/40 text-primary capitalize">{user?.organizationPlan ?? "growth"} Plan</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Organisation Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" data-testid="input-org-name" /></div>
          <div><Label>Industry</Label>
            <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["B2B SaaS", "E-commerce", "Financial Services", "Healthcare", "Real Estate", "Education", "Professional Services", "Other"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="mt-1" data-testid="input-org-website" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Asia/Singapore", "Asia/Tokyo", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney"].map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD", "SGD", "EUR", "GBP", "AUD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="btn-save-org">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete Organisation</p>
              <p className="text-xs text-muted-foreground">Permanently delete this organisation and all data. This action cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm" disabled data-testid="btn-delete-org">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
