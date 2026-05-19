import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCampaign, useGenerateBlueprint, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronLeft, Wand2, CheckCircle, Loader2 } from "lucide-react";

const STEPS = ["Objective", "Product & Service", "Audience", "Budget & Duration", "Channels", "CRM & Analytics", "AI Blueprint"];
const OBJECTIVES = [
  { value: "lead_generation", label: "Lead Generation" },
  { value: "sales", label: "Sales" },
  { value: "awareness", label: "Brand Awareness" },
  { value: "website_traffic", label: "Website Traffic" },
  { value: "retention", label: "Customer Retention" },
  { value: "reactivation", label: "Win-Back / Reactivation" },
  { value: "event_promotion", label: "Event Promotion" },
  { value: "product_launch", label: "Product Launch" },
];
const CHANNELS = ["ppc", "seo", "social", "email", "whatsapp", "creative_assets", "analytics"];
const CHANNEL_LABELS: Record<string, string> = {
  ppc: "PPC / Paid Search", seo: "SEO / Content", social: "Social Media",
  email: "Email / CRM", whatsapp: "WhatsApp / Messaging", creative_assets: "Creative Assets", analytics: "Analytics",
};

export default function NewCampaign() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    objective: "", name: "", productDescription: "", targetAudience: "",
    geography: "", industry: "", persona: "",
    budget: "", dailyBudget: "", startDate: "", endDate: "", spendStyle: "balanced",
    channels: [] as string[],
    crmNotes: "",
  });

  const createCampaign = useCreateCampaign({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }) } });
  const generateBlueprint = useGenerateBlueprint();

  const toggleChannel = (ch: string) => {
    setForm((f) => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch] }));
  };

  const handleNext = async () => {
    if (step < STEPS.length - 2) { setStep(step + 1); return; }
    if (step === STEPS.length - 2) {
      setStep(step + 1);
      setGeneratingBlueprint(true);
      try {
        const campaign = await createCampaign.mutateAsync({
          data: {
            name: form.name || `${form.objective.replace(/_/g, " ")} Campaign — ${new Date().toLocaleDateString()}`,
            objective: form.objective,
            budget: parseFloat(form.budget) || 10000,
            dailyBudget: form.dailyBudget ? parseFloat(form.dailyBudget) : null,
            startDate: form.startDate || new Date().toISOString().split("T")[0],
            endDate: form.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
            channels: form.channels,
            targetAudience: `${form.geography} ${form.industry} ${form.persona}`.trim() || form.targetAudience,
            productDescription: form.productDescription,
            spendStyle: form.spendStyle,
          },
        });
        setCreatedId(campaign.id);
        const bp = await generateBlueprint.mutateAsync({ id: campaign.id });
        setBlueprint(bp);
      } finally {
        setGeneratingBlueprint(false);
      }
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 size={20} className="text-primary" />
          <h1 className="text-2xl font-bold" data-testid="heading-new-campaign">Campaign Designer</h1>
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${i === step ? "bg-primary text-primary-foreground" : i < step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card className="border-border/60 bg-card">
        {/* Step 0: Objective */}
        {step === 0 && (
          <>
            <CardHeader><CardTitle>What is your campaign objective?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {OBJECTIVES.map((obj) => (
                  <button key={obj.value} onClick={() => setForm((f) => ({ ...f, objective: obj.value }))}
                    className={`p-4 rounded-lg border text-left transition-colors ${form.objective === obj.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                    data-testid={`btn-objective-${obj.value}`}>
                    <p className="font-medium text-sm">{obj.label}</p>
                  </button>
                ))}
              </div>
              <div>
                <Label>Campaign Name (optional)</Label>
                <Input placeholder="e.g. Q2 Lead Gen — Enterprise SaaS" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" data-testid="input-campaign-name" />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 1: Product */}
        {step === 1 && (
          <>
            <CardHeader><CardTitle>Tell us about your product or service</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What are you promoting?</Label>
                <Textarea placeholder="e.g. SPARK AI — an AI-powered campaign management platform for B2B marketing teams" value={form.productDescription} onChange={(e) => setForm((f) => ({ ...f, productDescription: e.target.value }))} className="mt-1" rows={4} data-testid="input-product-desc" />
              </div>
              <div>
                <Label>Target customer</Label>
                <Input placeholder="e.g. Marketing Managers at B2B SaaS companies with 50–500 employees" value={form.targetAudience} onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))} className="mt-1" data-testid="input-target-customer" />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <>
            <CardHeader><CardTitle>Define your audience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Geography</Label><Input placeholder="e.g. Singapore, Australia, UK" value={form.geography} onChange={(e) => setForm((f) => ({ ...f, geography: e.target.value }))} className="mt-1" data-testid="input-geography" /></div>
              <div><Label>Industry</Label><Input placeholder="e.g. B2B SaaS, Financial Services, E-commerce" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className="mt-1" data-testid="input-industry" /></div>
              <div><Label>Persona</Label><Input placeholder="e.g. Marketing Directors, CMOs, Growth Managers" value={form.persona} onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value }))} className="mt-1" data-testid="input-persona" /></div>
            </CardContent>
          </>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <>
            <CardHeader><CardTitle>Budget and duration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Total budget ($)</Label><Input type="number" placeholder="e.g. 25000" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} className="mt-1" data-testid="input-total-budget" /></div>
                <div><Label>Daily budget ($, optional)</Label><Input type="number" placeholder="e.g. 800" value={form.dailyBudget} onChange={(e) => setForm((f) => ({ ...f, dailyBudget: e.target.value }))} className="mt-1" data-testid="input-daily-budget" /></div>
                <div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="mt-1" data-testid="input-start-date" /></div>
                <div><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="mt-1" data-testid="input-end-date" /></div>
              </div>
              <div>
                <Label>Spend style</Label>
                <Select value={form.spendStyle} onValueChange={(v) => setForm((f) => ({ ...f, spendStyle: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-spend-style"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative — slow ramp up, protect budget</SelectItem>
                    <SelectItem value="balanced">Balanced — steady pacing throughout</SelectItem>
                    <SelectItem value="aggressive">Aggressive — front-load spend for fast results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Channels */}
        {step === 4 && (
          <>
            <CardHeader><CardTitle>Select your channels</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`p-4 rounded-lg border text-left flex items-center gap-3 transition-colors ${form.channels.includes(ch) ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                    data-testid={`btn-channel-${ch}`}>
                    <Checkbox checked={form.channels.includes(ch)} className="pointer-events-none" />
                    <span className="text-sm font-medium">{CHANNEL_LABELS[ch]}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 5: CRM */}
        {step === 5 && (
          <>
            <CardHeader><CardTitle>CRM and analytics context</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Share any additional context from your CRM or analytics data to help SPARK AI personalise your blueprint.</p>
              <div>
                <Label>Additional context (optional)</Label>
                <Textarea placeholder="e.g. We have 312 dormant leads from Q4 2025. Our best converting segment is Singapore SME owners. Our landing page conversion rate is 3.8%." value={form.crmNotes} onChange={(e) => setForm((f) => ({ ...f, crmNotes: e.target.value }))} rows={5} className="mt-1" data-testid="input-crm-context" />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 6: Blueprint */}
        {step === 6 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 size={18} className="text-primary" />
                {generatingBlueprint ? "SPARK AI is generating your blueprint..." : "Your Campaign Blueprint"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatingBlueprint ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Analysing your campaign requirements...</span>
                  </div>
                  {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : blueprint ? (
                <div className="space-y-4">
                  {[
                    { label: "Strategy Summary", value: blueprint.strategySummary },
                    { label: "Audience Strategy", value: blueprint.audienceStrategy },
                    { label: "Budget Plan", value: blueprint.budgetPlan },
                    { label: "Channel Plan", value: blueprint.channelPlan },
                    { label: "Creative Plan", value: blueprint.creativePlan },
                    { label: "Measurement Plan", value: blueprint.measurementPlan },
                  ].map((section) => (
                    <div key={section.label} className="p-4 rounded-lg border border-border/60 bg-card/50">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{section.label}</p>
                      <p className="text-sm text-foreground leading-relaxed">{section.value}</p>
                    </div>
                  ))}
                  {blueprint.executionChecklist?.length > 0 && (
                    <div className="p-4 rounded-lg border border-border/60 bg-card/50">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Execution Checklist</p>
                      <div className="space-y-2">
                        {blueprint.executionChecklist.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    {createdId && (
                      <Button onClick={() => setLocation(`/campaigns/${createdId}`)} className="gap-2" data-testid="btn-view-campaign">
                        View Campaign <ChevronRight size={14} />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setLocation("/campaigns")} data-testid="btn-back-campaigns">Back to Campaigns</Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Ready to generate your blueprint.</p>
              )}
            </CardContent>
          </>
        )}

        {step < STEPS.length - 1 && (
          <div className="flex justify-between p-6 pt-0">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} data-testid="btn-prev-step">
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
            <Button onClick={handleNext} disabled={step === 0 && !form.objective || createCampaign.isPending} data-testid="btn-next-step">
              {step === STEPS.length - 2 ? (
                <><Wand2 size={14} className="mr-1" /> Generate Blueprint</>
              ) : (
                <>Next <ChevronRight size={14} className="ml-1" /></>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
