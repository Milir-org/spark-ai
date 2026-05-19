import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Plus, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INITIAL_APPROVED = ["SPARK AI", "marketing command centre", "AI-powered", "multi-channel"];
const INITIAL_BANNED = ["cheap", "guaranteed results", "100% ROI", "get rich quick", "spam"];
const INITIAL_PERSONAS = [
  "Alex, 38, Head of Marketing at a B2B SaaS company. Wants ROI, not fluff. Sceptical of AI hype but open to results.",
  "Sarah, 44, CMO at a mid-market business. Focused on brand reputation and compliant marketing.",
];

export default function Brand() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [approvedTerms, setApprovedTerms] = useState(INITIAL_APPROVED);
  const [bannedTerms, setBannedTerms] = useState(INITIAL_BANNED);
  const [personas, setPersonas] = useState(INITIAL_PERSONAS);
  const [newApproved, setNewApproved] = useState("");
  const [newBanned, setNewBanned] = useState("");
  const [newPersona, setNewPersona] = useState("");
  const [brandVoice, setBrandVoice] = useState("Professional, confident, and data-driven. We speak to marketing leaders, not interns. Avoid jargon, be direct, lead with proof.");

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast({ title: "Brand rules saved", description: "SPARK AI will apply these rules to all generated content." });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-brand">
          <Tag size={20} className="text-primary" /> Brand Rules
        </h1>
        <p className="text-muted-foreground text-sm">Define brand voice, approved terminology, and content guardrails for AI generation</p>
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Brand Voice & Tone</CardTitle></CardHeader>
        <CardContent>
          <Label className="text-xs text-muted-foreground">Describe your brand voice — SPARK AI will apply this to all generated content</Label>
          <Textarea value={brandVoice} onChange={e => setBrandVoice(e.target.value)} rows={4} className="mt-1.5" data-testid="input-brand-voice" />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm text-green-400">Approved Terms</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {approvedTerms.map(term => (
              <Badge key={term} variant="outline" className="text-xs border-green-500/30 text-green-300 gap-1">
                {term}
                <button onClick={() => setApprovedTerms(v => v.filter(t => t !== term))} className="ml-0.5 hover:text-red-400"><X size={10} /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add approved term..." value={newApproved} onChange={e => setNewApproved(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newApproved.trim()) { setApprovedTerms(v => [...v, newApproved.trim()]); setNewApproved(""); } }} className="text-sm h-8" data-testid="input-approved-term" />
            <Button size="sm" onClick={() => { if (newApproved.trim()) { setApprovedTerms(v => [...v, newApproved.trim()]); setNewApproved(""); } }} className="h-8" data-testid="btn-add-approved"><Plus size={13} /></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm text-red-400">Banned Terms & Phrases</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {bannedTerms.map(term => (
              <Badge key={term} variant="outline" className="text-xs border-red-500/30 text-red-300 gap-1">
                {term}
                <button onClick={() => setBannedTerms(v => v.filter(t => t !== term))} className="ml-0.5 hover:text-muted-foreground"><X size={10} /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add banned term..." value={newBanned} onChange={e => setNewBanned(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newBanned.trim()) { setBannedTerms(v => [...v, newBanned.trim()]); setNewBanned(""); } }} className="text-sm h-8" data-testid="input-banned-term" />
            <Button size="sm" onClick={() => { if (newBanned.trim()) { setBannedTerms(v => [...v, newBanned.trim()]); setNewBanned(""); } }} className="h-8"><Plus size={13} /></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Audience Personas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {personas.map((p, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{p}</p>
              <button onClick={() => setPersonas(v => v.filter((_, idx) => idx !== i))} className="text-muted-foreground/50 hover:text-red-400 shrink-0"><X size={12} /></button>
            </div>
          ))}
          <Textarea placeholder="Describe a target persona..." value={newPersona} onChange={e => setNewPersona(e.target.value)} rows={2} className="text-sm" data-testid="input-new-persona" />
          <Button size="sm" variant="outline" onClick={() => { if (newPersona.trim()) { setPersonas(v => [...v, newPersona.trim()]); setNewPersona(""); } }}>
            <Plus size={13} className="mr-1" /> Add Persona
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="btn-save-brand">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Brand Rules
      </Button>
    </div>
  );
}
