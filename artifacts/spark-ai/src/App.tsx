import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/lib/auth";

// Public Pages
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Pricing from "@/pages/public/Pricing";

// App Layout
import AppLayout from "@/components/layout/AppLayout";

// App Pages
import Dashboard from "@/pages/app/Dashboard";
import Campaigns from "@/pages/app/Campaigns";
import NewCampaign from "@/pages/app/NewCampaign";
import CampaignDetail from "@/pages/app/CampaignDetail";
import Intelligence from "@/pages/app/Intelligence";
import Integrations from "@/pages/app/Integrations";
import Approvals from "@/pages/app/Approvals";
import Reports from "@/pages/app/Reports";
import ReportDetail from "@/pages/app/ReportDetail";
import Assets from "@/pages/app/Assets";

// Channel Pages
import PPC from "@/pages/app/channels/PPC";
import SEO from "@/pages/app/channels/SEO";
import Social from "@/pages/app/channels/Social";
import Creative from "@/pages/app/channels/Creative";
import CRM from "@/pages/app/channels/CRM";
import Messaging from "@/pages/app/channels/Messaging";
import Analytics from "@/pages/app/channels/Analytics";

// Settings Pages
import Organization from "@/pages/app/settings/Organization";
import UsersSettings from "@/pages/app/settings/Users";
import Roles from "@/pages/app/settings/Roles";
import Billing from "@/pages/app/settings/Billing";
import AISettings from "@/pages/app/settings/AI";
import Governance from "@/pages/app/settings/Governance";
import Brand from "@/pages/app/settings/Brand";
import Audit from "@/pages/app/settings/Audit";
import ApiConnections from "@/pages/app/settings/ApiConnections";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center"><div className="text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-muted-foreground">Loading SPARK AI...</p></div></div>;
  if (!user) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />

      {/* Dashboard */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>

      {/* Campaigns */}
      <Route path="/campaigns/new"><ProtectedRoute component={NewCampaign} /></Route>
      <Route path="/campaigns/:id"><ProtectedRoute component={CampaignDetail} /></Route>
      <Route path="/campaigns"><ProtectedRoute component={Campaigns} /></Route>

      {/* Intelligence */}
      <Route path="/intelligence"><ProtectedRoute component={Intelligence} /></Route>

      {/* Channels */}
      <Route path="/channels/ppc"><ProtectedRoute component={PPC} /></Route>
      <Route path="/channels/seo"><ProtectedRoute component={SEO} /></Route>
      <Route path="/channels/social"><ProtectedRoute component={Social} /></Route>
      <Route path="/channels/creative"><ProtectedRoute component={Creative} /></Route>
      <Route path="/channels/crm"><ProtectedRoute component={CRM} /></Route>
      <Route path="/channels/messaging"><ProtectedRoute component={Messaging} /></Route>
      <Route path="/channels/analytics"><ProtectedRoute component={Analytics} /></Route>

      {/* Platform */}
      <Route path="/integrations"><ProtectedRoute component={Integrations} /></Route>
      <Route path="/approvals"><ProtectedRoute component={Approvals} /></Route>
      <Route path="/reports/:id"><ProtectedRoute component={ReportDetail} /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
      <Route path="/assets"><ProtectedRoute component={Assets} /></Route>

      {/* Settings */}
      <Route path="/settings/organization"><ProtectedRoute component={Organization} /></Route>
      <Route path="/settings/users"><ProtectedRoute component={UsersSettings} /></Route>
      <Route path="/settings/roles"><ProtectedRoute component={Roles} /></Route>
      <Route path="/settings/billing"><ProtectedRoute component={Billing} /></Route>
      <Route path="/settings/ai"><ProtectedRoute component={AISettings} /></Route>
      <Route path="/settings/governance"><ProtectedRoute component={Governance} /></Route>
      <Route path="/settings/brand"><ProtectedRoute component={Brand} /></Route>
      <Route path="/settings/audit"><ProtectedRoute component={Audit} /></Route>
      <Route path="/settings/api-connections"><ProtectedRoute component={ApiConnections} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
