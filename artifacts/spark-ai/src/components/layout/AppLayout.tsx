import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wand2, Megaphone, Brain, MonitorPlay, Search, Share2, Palette,
  Mail, MessageSquare, BarChart3, Plug, CheckSquare, FileText, FolderOpen,
  Settings, Building2, Users, Shield, CreditCard, Bot, Lock, Tag, ScrollText,
  ChevronDown, ChevronRight, Bell, LogOut, ChevronLeft, KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: number;
  locked?: boolean;
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = item.href ? location === item.href || location.startsWith(item.href + "/") : false;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
          data-testid={`nav-group-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children!.map((child) => (
              <NavLink key={child.label} item={child} collapsed={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <Link href={item.href!}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}
        data-testid={`nav-link-${item.label.toLowerCase().replace(/\s/g, "-")}`}
      >
        <span className="shrink-0 relative">
          {item.icon}
          {item.locked && <Lock size={8} className="absolute -top-0.5 -right-0.5 text-muted-foreground" />}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <Badge className="text-xs h-5 px-1.5 bg-destructive text-destructive-foreground">{item.badge}</Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function NavSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-1 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">{title}</p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.label} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { data: summary } = useGetDashboardSummary();

  const pendingApprovals = summary?.pendingApprovals ?? 8;
  const plan = user?.organizationPlan ?? "growth";

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
      ],
    },
    {
      title: "Campaigns",
      items: [
        { label: "Campaign Designer", href: "/campaigns/new", icon: <Wand2 size={16} /> },
        { label: "Campaigns", href: "/campaigns", icon: <Megaphone size={16} /> },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { label: "Customer Intelligence", href: "/intelligence", icon: <Brain size={16} /> },
      ],
    },
    {
      title: "Channels",
      items: [
        { label: "PPC", href: "/channels/ppc", icon: <MonitorPlay size={16} />, locked: plan === "starter" },
        { label: "SEO", href: "/channels/seo", icon: <Search size={16} /> },
        { label: "Social", href: "/channels/social", icon: <Share2 size={16} /> },
        { label: "Creative Assets", href: "/channels/creative", icon: <Palette size={16} /> },
        { label: "CRM & Email", href: "/channels/crm", icon: <Mail size={16} /> },
        { label: "Messaging", href: "/channels/messaging", icon: <MessageSquare size={16} /> },
        { label: "Analytics", href: "/channels/analytics", icon: <BarChart3 size={16} /> },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Integrations", href: "/integrations", icon: <Plug size={16} /> },
        { label: "Approval Centre", href: "/approvals", icon: <CheckSquare size={16} />, badge: pendingApprovals },
        { label: "Reports", href: "/reports", icon: <FileText size={16} /> },
        { label: "Asset Library", href: "/assets", icon: <FolderOpen size={16} /> },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Organization", href: "/settings/organization", icon: <Building2 size={16} /> },
        { label: "Users", href: "/settings/users", icon: <Users size={16} /> },
        { label: "Roles & Permissions", href: "/settings/roles", icon: <Shield size={16} /> },
        { label: "Billing & Plan", href: "/settings/billing", icon: <CreditCard size={16} /> },
        { label: "AI Settings", href: "/settings/ai", icon: <Bot size={16} /> },
        { label: "Governance", href: "/settings/governance", icon: <Lock size={16} />, locked: plan === "starter" || plan === "growth" },
        { label: "Brand Rules", href: "/settings/brand", icon: <Tag size={16} /> },
        { label: "API Connections", href: "/settings/api-connections", icon: <KeyRound size={16} /> },
        { label: "Audit Logs", href: "/settings/audit", icon: <ScrollText size={16} />, locked: plan === "starter" || plan === "growth" },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
          collapsed ? "w-14" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center px-4 h-14 border-b border-sidebar-border shrink-0", collapsed && "px-2 justify-center")}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">S</span>
              </div>
              <div>
                <span className="font-bold text-sm text-sidebar-foreground tracking-tight">SPARK</span>
                <span className="text-primary font-bold text-sm tracking-tight"> AI</span>
              </div>
              <Badge variant="outline" className="text-xs ml-1 border-primary/40 text-primary capitalize">{plan}</Badge>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {navSections.map((section) => (
            <NavSection key={section.title} title={section.title} items={section.items} collapsed={collapsed} />
          ))}
        </div>

        {/* Collapse button */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
            data-testid="btn-collapse-sidebar"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{user?.organizationName ?? "SPARK AI"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" data-testid="btn-notifications">
              <Bell size={16} />
              {pendingApprovals > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingApprovals}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" data-testid="btn-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "AI"}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-medium leading-none">{user?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, " ")}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/settings/organization")} data-testid="menu-item-settings">
                  <Settings size={14} className="mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { logout(); setLocation("/login"); }}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-item-logout"
                >
                  <LogOut size={14} className="mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
