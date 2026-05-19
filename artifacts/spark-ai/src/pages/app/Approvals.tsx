import { useState } from "react";
import { useListApprovals, useApproveRequest, useRejectRequest, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const MOCK_APPROVALS = [
  { id: 1, type: "campaign_launch", title: "Q2 Lead Gen Campaign Launch", description: "Full multi-channel campaign across PPC, SEO, Social, and Email. Total budget $45,000. Targeting enterprise SaaS decision makers in APAC.", requestedBy: 2, requestedByName: "Sarah Park", requiredRole: "marketing_manager", status: "pending", riskLevel: "medium", budgetImpact: 45000, aiReasoning: "SPARK AI has reviewed this campaign. The strategy is well-structured and the target audience is well-defined. Budget allocation across channels is within benchmarks. Historical data suggests a 22% lead conversion rate for similar campaigns. Recommend approval.", campaignId: 1, campaignName: "Q2 Lead Gen — Enterprise SaaS", dueDate: "2026-05-25", comments: [], createdAt: new Date().toISOString() },
  { id: 2, type: "budget", title: "PPC Budget Increase — +$8,000", description: "Request to increase Google Ads budget from $28,000 to $36,000 for the Brand Search campaign. ROAS is currently 6.1x — well above the 4.2x average.", requestedBy: 1, requestedByName: "Alex Chen", requiredRole: "finance_approver", status: "pending", riskLevel: "high", budgetImpact: 8000, aiReasoning: "SPARK AI supports this budget increase. The Brand Search campaign is performing at 6.1x ROAS vs 4.2x average — a 45% outperformance. Increasing spend here should maintain or improve ROAS while capturing higher search volume.", campaignId: 1, campaignName: "Q2 Lead Gen — Enterprise SaaS", dueDate: "2026-05-22", comments: [], createdAt: new Date().toISOString() },
  { id: 3, type: "ad_copy", title: "LinkedIn Ad Copy — 3 Variants", description: "Creative review of 3 LinkedIn sponsored content copy variants for the enterprise SaaS lead gen campaign. Includes A/B test framework.", requestedBy: 5, requestedByName: "David Lee", requiredRole: "creative_reviewer", status: "pending", riskLevel: "low", budgetImpact: null, aiReasoning: "All 3 copy variants follow brand guidelines. Tone is professional and value-focused. Headlines are within LinkedIn character limits. CTA buttons are clear and action-oriented. SPARK AI recommends approval of all variants with preference to test Variant B first.", campaignId: 1, campaignName: "Q2 Lead Gen — Enterprise SaaS", dueDate: "2026-05-21", comments: [], createdAt: new Date().toISOString() },
  { id: 4, type: "crm_segment", title: "Dormant Lead Segment — Mass Reactivation", description: "Request to activate a reactivation campaign to 312 dormant CRM contacts. 5-step email sequence + WhatsApp follow-up for non-openers.", requestedBy: 4, requestedByName: "Priya Sharma", requiredRole: "marketing_manager", status: "pending", riskLevel: "medium", budgetImpact: 2400, aiReasoning: "SPARK AI has analysed this segment. 312 contacts, 68% historically engaged. Reactivation sequence is permission-compliant. Estimated reactivation rate: 18–24%. Pipeline potential: $89,400. Recommend approval.", campaignId: null, campaignName: null, dueDate: "2026-05-28", comments: [], createdAt: new Date().toISOString() },
  { id: 5, type: "campaign_launch", title: "SME Singapore Market — Launch", description: "LinkedIn + Google PPC campaign targeting Singapore SME owners. $35,000 budget over 90 days.", requestedBy: 1, requestedByName: "Alex Chen", requiredRole: "owner", status: "approved", riskLevel: "medium", budgetImpact: 35000, aiReasoning: null, campaignId: 4, campaignName: "SME Growth — Singapore Market", dueDate: "2026-05-10", comments: ["Approved — good strategy. Proceed with launch."], createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 6, type: "ad_copy", title: "Meta Retargeting Ads — Q1 Creative", description: "4 creative variants for Meta retargeting campaign.", requestedBy: 5, requestedByName: "David Lee", requiredRole: "creative_reviewer", status: "rejected", riskLevel: "low", budgetImpact: null, aiReasoning: null, campaignId: null, campaignName: null, dueDate: "2026-04-20", comments: ["Rejected — brand tone not aligned. Please revise Variant 3 and resubmit."], createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  critical: "bg-red-700/30 text-red-200 border-red-700/40",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={14} className="text-amber-400" />,
  approved: <CheckCircle size={14} className="text-green-400" />,
  rejected: <XCircle size={14} className="text-red-400" />,
};

export default function Approvals() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApproval, setSelectedApproval] = useState<typeof MOCK_APPROVALS[0] | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  const { data: approvals = MOCK_APPROVALS, isLoading } = useListApprovals({ status: activeTab !== "all" ? activeTab : undefined }, { query: { queryKey: getListApprovalsQueryKey({ status: activeTab !== "all" ? activeTab : undefined }) } });
  const approveMutation = useApproveRequest({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() }); closeDialog(); } } });
  const rejectMutation = useRejectRequest({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() }); closeDialog(); } } });

  const closeDialog = () => { setSelectedApproval(null); setActionType(null); setComment(""); };

  const handleAction = () => {
    if (!selectedApproval || !actionType) return;
    if (actionType === "approve") approveMutation.mutate({ id: selectedApproval.id, data: { comment } });
    else rejectMutation.mutate({ id: selectedApproval.id, data: { comment } });
  };

  const displayApprovals = (approvals.length > 0 ? approvals : MOCK_APPROVALS).filter(
    (a) => activeTab === "all" || a.status === activeTab
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-approvals">Approval Centre</h1>
        <p className="text-muted-foreground text-sm">Review, approve, or reject campaign decisions and AI-recommended actions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({MOCK_APPROVALS.filter(a => a.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {displayApprovals.map((approval) => (
                  <Card key={approval.id} className="border-border/60 bg-card" data-testid={`approval-card-${approval.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {STATUS_ICON[approval.status]}
                            <p className="font-semibold text-sm">{approval.title}</p>
                            <Badge variant="outline" className={`text-xs ${RISK_BADGE[approval.riskLevel]}`}>{approval.riskLevel} risk</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Requested by {approval.requestedByName} · Requires {approval.requiredRole.replace(/_/g, " ")} approval{approval.campaignName ? ` · ${approval.campaignName}` : ""}{approval.dueDate ? ` · Due ${approval.dueDate}` : ""}</p>
                        </div>
                        {approval.budgetImpact && (
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-amber-400">${approval.budgetImpact.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">budget impact</p>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{approval.description}</p>

                      {approval.aiReasoning && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-3">
                          <p className="text-xs font-semibold text-primary mb-1">SPARK AI Reasoning</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">{approval.aiReasoning}</p>
                        </div>
                      )}

                      {approval.comments.length > 0 && (
                        <div className="p-3 rounded-lg bg-card/50 border border-border/60 mb-3">
                          {approval.comments.map((c, i) => <p key={i} className="text-xs text-muted-foreground">{c}</p>)}
                        </div>
                      )}

                      {approval.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { setSelectedApproval(approval); setActionType("reject"); }} data-testid={`btn-reject-${approval.id}`}>
                            <XCircle size={13} className="mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedApproval(approval); setActionType("approve"); }} data-testid={`btn-approve-${approval.id}`}>
                            <CheckCircle size={13} /> Approve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {displayApprovals.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No {tab} approvals</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedApproval && !!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
              {actionType === "approve" ? "Approve" : "Reject"}: {selectedApproval?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === "reject" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle size={14} className="text-destructive mt-0.5" />
                <p className="text-sm text-destructive/90">Please provide a reason for rejection so the requester can address the issues and resubmit.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Comment {actionType === "reject" ? "(required)" : "(optional)"}</label>
              <Textarea placeholder={actionType === "reject" ? "Explain why this is being rejected..." : "Any notes for the requester..."} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1.5" rows={3} data-testid="input-approval-comment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAction} disabled={approveMutation.isPending || rejectMutation.isPending || (actionType === "reject" && !comment)}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
              data-testid="btn-confirm-action">
              {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
