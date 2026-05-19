import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Bot, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AISettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    autonomousActions: false,
    budgetAutoOptimise: false,
    dailyInsights: true,
    anomalyAlerts: true,
    weeklyReports: true,
    blueprintGeneration: true,
    adCopyGeneration: true,
    contentCalendar: true,
    aiModel: "gpt-4o",
    creativityLevel: [60],
    language: "en",
    tone: "professional",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "AI settings saved" });
  };

  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: !(s as any)[key] }));

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-ai">
          <Bot size={20} className="text-primary" /> AI Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure SPARK AI behaviour, automation, and intelligence preferences</p>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Autonomous Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300">Autonomous actions allow SPARK AI to make optimisation decisions without human approval. Only enable this for low-risk, high-confidence actions.</p>
          </div>
          {[
            { key: "autonomousActions", label: "Enable Autonomous Optimisation", desc: "Allow SPARK AI to make approved optimisation decisions automatically" },
            { key: "budgetAutoOptimise", label: "Auto Budget Reallocation", desc: "Automatically shift budget between campaigns based on ROAS (within ±10%)" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3" data-testid={`toggle-${key}`}>
              <div>
                <Label className="text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch checked={(settings as any)[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Intelligence & Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "dailyInsights", label: "Daily AI Insights", desc: "Receive a daily AI performance summary" },
            { key: "anomalyAlerts", label: "Anomaly Detection Alerts", desc: "Alert when SPARK AI detects unusual patterns" },
            { key: "weeklyReports", label: "Weekly AI Reports", desc: "Auto-generate weekly performance reports" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3" data-testid={`toggle-${key}`}>
              <div>
                <Label className="text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch checked={(settings as any)[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Content Generation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "blueprintGeneration", label: "Campaign Blueprint Generation" },
            { key: "adCopyGeneration", label: "Ad Copy Generation" },
            { key: "contentCalendar", label: "Social Content Calendar" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3" data-testid={`toggle-${key}`}>
              <Label className="text-sm">{label}</Label>
              <Switch checked={(settings as any)[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
          <div>
            <Label className="text-sm">Brand Tone</Label>
            <Select value={settings.tone} onValueChange={v => setSettings(s => ({ ...s, tone: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["professional", "conversational", "authoritative", "friendly", "bold"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Creativity Level: {settings.creativityLevel[0]}%</Label>
            <Slider value={settings.creativityLevel} onValueChange={v => setSettings(s => ({ ...s, creativityLevel: v }))} min={10} max={100} step={10} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="btn-save-ai-settings">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save AI Settings
      </Button>
    </div>
  );
}
