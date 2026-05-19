import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, ArrowRight, Zap } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "$299/mo", campaigns: 5, credits: 100, color: "border-border" },
  { name: "Growth", price: "$799/mo", campaigns: 25, credits: 500, color: "border-primary", current: true },
  { name: "Pro", price: "$1,499/mo", campaigns: "Unlimited", credits: 2000, color: "border-border" },
  { name: "Enterprise", price: "Custom", campaigns: "Unlimited", credits: "Unlimited", color: "border-border" },
];

const USAGE = [
  { label: "AI Credits", used: 312, total: 500 },
  { label: "Campaigns", used: 7, total: 25 },
  { label: "Seats", used: 6, total: 10 },
  { label: "Asset Generations", used: 24, total: 100 },
];

export default function Billing() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-billing">
          <CreditCard size={20} className="text-primary" /> Billing & Plan
        </h1>
        <p className="text-muted-foreground text-sm">Manage your subscription and usage</p>
      </div>

      {/* Current plan */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-lg">Growth Plan</p>
                <Badge className="bg-primary text-primary-foreground text-xs">Current Plan</Badge>
              </div>
              <p className="text-muted-foreground text-sm">$799/month · Billed monthly · Renews June 1, 2026</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="btn-cancel-plan">Cancel</Button>
              <Button className="gap-1" data-testid="btn-upgrade-plan">Upgrade to Pro <ArrowRight size={14} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Monthly Usage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {USAGE.map((u) => {
            const pct = typeof u.total === "number" ? Math.round((u.used / u.total) * 100) : 0;
            return (
              <div key={u.label} data-testid={`usage-${u.label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{u.label}</span>
                  <span className="text-xs text-muted-foreground">{u.used} / {u.total}</span>
                </div>
                <Progress value={pct} className={`h-1.5 ${pct > 80 ? "[&>div]:bg-amber-400" : ""}`} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={`border ${(plan as any).current ? "border-primary" : "border-border/60"} bg-card`} data-testid={`plan-${plan.name.toLowerCase()}`}>
            <CardContent className="p-4">
              <p className="font-bold text-sm mb-1">{plan.name}</p>
              <p className="text-primary font-semibold text-sm mb-3">{plan.price}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{plan.campaigns} campaigns</p>
                <p>{plan.credits} AI credits</p>
              </div>
              {(plan as any).current ? (
                <Badge className="mt-3 text-xs bg-primary/20 text-primary border-primary/30" variant="outline"><Check size={10} className="mr-1" /> Current</Badge>
              ) : (
                <Button size="sm" variant="outline" className="mt-3 w-full text-xs h-7">Select</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment */}
      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Payment Method</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded border border-border bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground">VISA</div>
            <div>
              <p className="text-sm font-medium">Visa ending 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="outline" size="sm" data-testid="btn-update-payment">Update</Button>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="border-border/60 bg-card">
        <CardHeader><CardTitle className="text-sm">Recent Invoices</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { date: "May 1, 2026", amount: "$799.00", status: "Paid" },
            { date: "Apr 1, 2026", amount: "$799.00", status: "Paid" },
            { date: "Mar 1, 2026", amount: "$799.00", status: "Paid" },
          ].map((inv, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0" data-testid={`invoice-${i}`}>
              <span className="text-sm text-muted-foreground">{inv.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{inv.amount}</span>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">{inv.status}</Badge>
                <Button variant="ghost" size="sm" className="text-xs h-7">Download</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
