import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Trash2, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOCK_USERS = [
  { id: 1, name: "Alex Chen", email: "alex@milir.ai", role: "owner", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
  { id: 2, name: "Sarah Park", email: "sarah@milir.ai", role: "marketing_manager", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
  { id: 3, name: "James Wong", email: "james@milir.ai", role: "finance_approver", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
  { id: 4, name: "Priya Sharma", email: "priya@milir.ai", role: "channel_specialist", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
  { id: 5, name: "David Lee", email: "david@milir.ai", role: "creative_reviewer", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
  { id: 6, name: "Nina Foster", email: "nina@milir.ai", role: "viewer", status: "active", organizationId: 1, organizationName: "Milir AI", organizationPlan: "growth", avatar: null, createdAt: new Date().toISOString() },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", marketing_manager: "Marketing Manager",
  finance_approver: "Finance Approver", channel_specialist: "Channel Specialist",
  creative_reviewer: "Creative Reviewer", viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "border-violet-500/40 text-violet-300",
  admin: "border-blue-500/40 text-blue-300",
  marketing_manager: "border-cyan-500/40 text-cyan-300",
  finance_approver: "border-amber-500/40 text-amber-300",
  channel_specialist: "border-green-500/40 text-green-300",
  creative_reviewer: "border-pink-500/40 text-pink-300",
  viewer: "border-border text-muted-foreground",
};

export default function UsersSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const { data: users = MOCK_USERS } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const createUser = useCreateUser({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); setShowInvite(false); toast({ title: "Invitation sent" }); } } });
  const deleteUser = useDeleteUser({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "User removed" }); } } });
  const updateUser = useUpdateUser({ mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Role updated" }); } } });

  const displayUsers = users.length > 0 ? users : MOCK_USERS;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings-users">
            <Users size={20} className="text-primary" /> Users & Seats
          </h1>
          <p className="text-muted-foreground text-sm">{displayUsers.length} users on your plan</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2" data-testid="btn-invite-user"><Plus size={14} /> Invite User</Button>
      </div>

      <div className="space-y-3">
        {displayUsers.map((user) => (
          <Card key={user.id} className="border-border/60 bg-card" data-testid={`user-row-${user.id}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 ${ROLE_COLORS[user.role] ?? "border-border text-muted-foreground"}`}>{ROLE_LABELS[user.role] ?? user.role}</Badge>
              <Badge variant="outline" className={`text-xs shrink-0 ${user.status === "active" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{user.status}</Badge>
              {user.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`btn-user-menu-${user.id}`}><MoreHorizontal size={14} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(ROLE_LABELS).filter(([r]) => r !== "owner").map(([role, label]) => (
                      <DropdownMenuItem key={role} onClick={() => updateUser.mutate({ id: user.id, data: { role } })} data-testid={`menu-role-${role}`}>
                        <Shield size={12} className="mr-2" /> Set as {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => deleteUser.mutate({ id: user.id })} className="text-destructive focus:text-destructive" data-testid={`menu-remove-user-${user.id}`}>
                      <Trash2 size={12} className="mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email Address</Label><Input placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="mt-1" data-testid="input-invite-email" /></div>
            <div><Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).filter(([r]) => r !== "owner").map(([role, label]) => <SelectItem key={role} value={role}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={() => createUser.mutate({ data: { name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole } })} disabled={!inviteEmail || createUser.isPending} data-testid="btn-send-invite">
              {createUser.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
