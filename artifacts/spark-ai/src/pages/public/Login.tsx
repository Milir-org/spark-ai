import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const DEMO_USERS = [
  { id: 1, name: "Alex Chen", email: "alex@milir.ai", password: "demo123", role: "owner", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
  { id: 2, name: "Sarah Park", email: "sarah@milir.ai", password: "demo123", role: "marketing_manager", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
  { id: 3, name: "James Wong", email: "james@milir.ai", password: "demo123", role: "finance_approver", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
  { id: 4, name: "Priya Sharma", email: "priya@milir.ai", password: "demo123", role: "channel_specialist", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
  { id: 5, name: "David Lee", email: "david@milir.ai", password: "demo123", role: "creative_reviewer", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
  { id: 6, name: "Nina Foster", email: "nina@milir.ai", password: "demo123", role: "viewer", organizationId: 1, organizationName: "Milir AI Demo Workspace", organizationPlan: "growth", avatar: null, status: "active" },
];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  marketing_manager: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  channel_specialist: "bg-green-500/20 text-green-300 border-green-500/30",
  creative_reviewer: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  finance_approver: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  viewer: "bg-muted/50 text-muted-foreground border-border",
};

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (!found) { setError("Invalid credentials. Use a demo account below."); return; }
    login(found as any);
    setLocation("/dashboard");
  };

  const handleDemoLogin = (user: typeof DEMO_USERS[0]) => {
    login(user as any);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-card border-r border-border p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">SPARK <span className="text-primary">AI</span></span>
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight mb-6">
            Your AI<br />Marketing<br />Command Centre
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Plan campaigns, activate channels, approve decisions, and report results — all in one intelligent platform.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { stat: "3.2x", label: "More qualified leads" },
            { stat: "70%", label: "Less campaign planning time" },
            { stat: "4.2x", label: "Average ROAS" },
          ].map((s) => (
            <div key={s.stat} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">{s.stat}</span>
              <span className="text-muted-foreground text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-6 lg:hidden justify-center">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg">SPARK <span className="text-primary">AI</span></span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
            <p className="text-muted-foreground text-sm mt-1">Access your marketing command centre</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                data-testid="input-password"
              />
            </div>
            {error && <p className="text-destructive text-sm" data-testid="text-login-error">{error}</p>}
            <Button type="submit" className="w-full" data-testid="button-submit-login">Sign In</Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">or use a demo account</span>
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">DEMO ACCOUNTS — click to log in instantly</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleDemoLogin(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-card transition-colors text-left"
                  data-testid={`btn-demo-login-${u.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border shrink-0 capitalize ${ROLE_COLORS[u.role]}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
