import { useState } from "react";
import { useLocation } from "wouter";
import { useListCampaigns, useDeleteCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Wand2, MoreHorizontal, Trash2, Eye, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-border" },
  planning: { label: "Planning", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  awaiting_approval: { label: "Awaiting Approval", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  ready_to_launch: { label: "Ready to Launch", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  active: { label: "Active", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  optimising: { label: "Optimising", className: "bg-primary/20 text-primary border-primary/30" },
  paused: { label: "Paused", className: "bg-muted/50 text-muted-foreground border-border" },
  completed: { label: "Completed", className: "bg-muted/20 text-muted-foreground border-border/50" },
};

const MOCK_CAMPAIGNS = [
  { id: 1, name: "Q2 Lead Generation — Enterprise SaaS", objective: "lead_generation", status: "active", budget: 45000, channels: ["ppc", "seo", "social"], ownerName: "Alex Chen", healthScore: 87, leadsGenerated: 312, spend: 28400, startDate: "2026-04-01", endDate: "2026-06-30", createdAt: new Date().toISOString(), organizationId: 1, ownerId: 1, blueprint: null, dailyBudget: null, targetAudience: null, productDescription: null, spendStyle: null },
  { id: 2, name: "Product Launch — SPARK Pro Features", objective: "product_launch", status: "awaiting_approval", budget: 28000, channels: ["social", "email"], ownerName: "Sarah Park", healthScore: null, leadsGenerated: null, spend: null, startDate: "2026-05-15", endDate: "2026-07-15", createdAt: new Date().toISOString(), organizationId: 1, ownerId: 2, blueprint: null, dailyBudget: null, targetAudience: null, productDescription: null, spendStyle: null },
  { id: 3, name: "Competitor Reactivation — Churned Accounts", objective: "reactivation", status: "planning", budget: 12000, channels: ["email", "crm"], ownerName: "Priya Sharma", healthScore: null, leadsGenerated: 47, spend: 4200, startDate: "2026-05-01", endDate: "2026-05-31", createdAt: new Date().toISOString(), organizationId: 1, ownerId: 4, blueprint: null, dailyBudget: null, targetAudience: null, productDescription: null, spendStyle: null },
  { id: 4, name: "SME Growth — Singapore Market", objective: "awareness", status: "active", budget: 35000, channels: ["ppc", "linkedin"], ownerName: "Alex Chen", healthScore: 72, leadsGenerated: 184, spend: 19800, startDate: "2026-03-15", endDate: "2026-06-15", createdAt: new Date().toISOString(), organizationId: 1, ownerId: 1, blueprint: null, dailyBudget: null, targetAudience: null, productDescription: null, spendStyle: null },
  { id: 5, name: "Dormant Lead Reactivation", objective: "retention", status: "draft", budget: 8000, channels: ["email", "whatsapp"], ownerName: "Priya Sharma", healthScore: null, leadsGenerated: null, spend: null, startDate: "2026-06-01", endDate: "2026-06-30", createdAt: new Date().toISOString(), organizationId: 1, ownerId: 4, blueprint: null, dailyBudget: null, targetAudience: null, productDescription: null, spendStyle: null },
];

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: campaigns = MOCK_CAMPAIGNS, isLoading } = useListCampaigns(
    { status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined },
    { query: { queryKey: getListCampaignsQueryKey({ status: statusFilter !== "all" ? statusFilter : undefined }) } }
  );
  const deleteMutation = useDeleteCampaign({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }) } });

  const filtered = (campaigns.length > 0 ? campaigns : MOCK_CAMPAIGNS).filter((c) =>
    (statusFilter === "all" || c.status === statusFilter) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-campaigns">Campaigns</h1>
          <p className="text-muted-foreground text-sm">Manage and monitor all your marketing campaigns</p>
        </div>
        <Button onClick={() => setLocation("/campaigns/new")} className="gap-2" data-testid="btn-create-campaign">
          <Plus size={14} /> New Campaign
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-campaigns" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" data-testid="select-status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const sb = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;
            return (
              <Card key={campaign.id} className="border-border/60 bg-card hover:border-primary/40 transition-colors cursor-pointer" data-testid={`campaign-card-${campaign.id}`} onClick={() => setLocation(`/campaigns/${campaign.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{campaign.name}</p>
                        <Badge variant="outline" className={`text-xs shrink-0 ${sb.className}`}>{sb.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize">{campaign.objective?.replace(/_/g, " ")}</span>
                        <span>·</span>
                        <span>${(campaign.budget / 1000).toFixed(0)}k budget</span>
                        <span>·</span>
                        <span>{(campaign.channels as string[]).join(", ")}</span>
                        {campaign.ownerName && <><span>·</span><span>{campaign.ownerName}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {campaign.healthScore != null && (
                        <div className="text-center hidden md:block">
                          <p className="text-lg font-bold text-green-400">{campaign.healthScore}</p>
                          <p className="text-xs text-muted-foreground">Health</p>
                        </div>
                      )}
                      {campaign.leadsGenerated != null && (
                        <div className="text-center hidden md:block">
                          <p className="text-lg font-bold text-primary">{campaign.leadsGenerated}</p>
                          <p className="text-xs text-muted-foreground">Leads</p>
                        </div>
                      )}
                      {campaign.spend != null && (
                        <div className="text-center hidden md:block">
                          <p className="text-lg font-bold text-accent">${(campaign.spend / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-muted-foreground">Spent</p>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`btn-campaign-menu-${campaign.id}`}>
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/campaigns/${campaign.id}`); }} data-testid={`menu-view-${campaign.id}`}>
                            <Eye size={13} className="mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: campaign.id }); }} className="text-destructive focus:text-destructive" data-testid={`menu-delete-${campaign.id}`}>
                            <Trash2 size={13} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Wand2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No campaigns found</p>
              <p className="text-sm mt-1">Create your first campaign using the AI Campaign Designer</p>
              <Button className="mt-4 gap-2" onClick={() => setLocation("/campaigns/new")} data-testid="btn-empty-create">
                <Plus size={14} /> Create Campaign
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
