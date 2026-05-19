import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Lock } from "lucide-react";

const PLANS = [
  {
    name: "Starter", price: "$299", period: "/mo", tag: null,
    desc: "For small teams getting started with AI-assisted campaigns.",
    features: [
      { label: "Campaign Designer (AI Blueprint)", included: true },
      { label: "SEO Workbench", included: true },
      { label: "Creative Asset Generation", included: true },
      { label: "Basic Reporting", included: true },
      { label: "5 campaigns/month", included: true },
      { label: "100 AI credits/month", included: true },
      { label: "PPC Workbench", included: false, locked: true },
      { label: "Customer Intelligence", included: false, locked: true },
      { label: "Approval Workflows", included: false },
      { label: "Multi-channel Orchestration", included: false },
      { label: "Governance & Audit Logs", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Growth", price: "$799", period: "/mo", tag: "Most Popular",
    desc: "For active marketing teams running multi-channel campaigns.",
    features: [
      { label: "Campaign Designer (AI Blueprint)", included: true },
      { label: "SEO Workbench", included: true },
      { label: "Creative Asset Generation", included: true },
      { label: "Advanced Reporting", included: true },
      { label: "25 campaigns/month", included: true },
      { label: "500 AI credits/month", included: true },
      { label: "PPC Workbench", included: true },
      { label: "Customer Intelligence", included: true },
      { label: "Approval Workflows", included: true },
      { label: "Multi-channel Orchestration", included: false, locked: true },
      { label: "Governance & Audit Logs", included: false, locked: true },
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Pro", price: "$1,499", period: "/mo", tag: null,
    desc: "For advanced teams with complex multi-channel needs.",
    features: [
      { label: "Campaign Designer (AI Blueprint)", included: true },
      { label: "SEO Workbench", included: true },
      { label: "Creative Asset Generation", included: true },
      { label: "Advanced Reporting", included: true },
      { label: "Unlimited campaigns", included: true },
      { label: "2,000 AI credits/month", included: true },
      { label: "PPC Workbench", included: true },
      { label: "Customer Intelligence", included: true },
      { label: "Approval Workflows", included: true },
      { label: "Multi-channel Orchestration", included: true },
      { label: "Governance & Audit Logs", included: false, locked: true },
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise", price: "Custom", period: "", tag: null,
    desc: "For larger organisations with governance and compliance needs.",
    features: [
      { label: "Campaign Designer (AI Blueprint)", included: true },
      { label: "SEO Workbench", included: true },
      { label: "Creative Asset Generation", included: true },
      { label: "Advanced Reporting", included: true },
      { label: "Unlimited campaigns", included: true },
      { label: "Unlimited AI credits", included: true },
      { label: "PPC Workbench", included: true },
      { label: "Customer Intelligence", included: true },
      { label: "Approval Workflows", included: true },
      { label: "Multi-channel Orchestration", included: true },
      { label: "Governance & Audit Logs", included: true },
    ],
    cta: "Contact Sales",
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg tracking-tight">SPARK <span className="text-primary">AI</span></span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} data-testid="btn-nav-login">Sign In</Button>
          <Button size="sm" onClick={() => setLocation("/login")} data-testid="btn-nav-trial">Start Free Trial</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free. Scale as you grow. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`border relative ${plan.tag ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
              data-testid={`plan-card-${plan.name.toLowerCase()}`}
            >
              {plan.tag && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground">{plan.tag}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.desc}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant={plan.tag ? "default" : "outline"}
                  onClick={() => setLocation("/login")}
                  data-testid={`btn-plan-cta-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
                <div className="space-y-2 pt-2">
                  {plan.features.map((f) => (
                    <div key={f.label} className={`flex items-center gap-2 text-xs ${f.included ? "text-foreground" : "text-muted-foreground"}`}>
                      {f.included ? (
                        <Check size={12} className="text-green-400 shrink-0" />
                      ) : (f as any).locked ? (
                        <Lock size={12} className="text-muted-foreground/50 shrink-0" />
                      ) : (
                        <X size={12} className="text-muted-foreground/50 shrink-0" />
                      )}
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
