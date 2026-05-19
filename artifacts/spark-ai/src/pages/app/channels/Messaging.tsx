import { useGetMessagingData, getGetMessagingDataQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CheckCircle, Clock, Plus } from "lucide-react";

const MOCK_MESSAGING = {
  templates: [
    { id: 1, name: "Lead Follow-Up — Day 1", type: "whatsapp", content: "Hi [Name], thanks for your interest in SPARK AI. I wanted to reach out personally — what's the biggest challenge your marketing team is facing right now? Happy to show you how we solve it. — Alex", status: "approved" },
    { id: 2, name: "Demo No-Show Recovery", type: "whatsapp", content: "Hi [Name], looks like we missed you on our call earlier. No worries — would [Day] at [Time] work better? We have some new AI features I'd love to walk you through.", status: "pending" },
    { id: 3, name: "Post-Trial Reactivation", type: "whatsapp", content: "Hey [Name], your SPARK AI trial ended last week. We'd love to show you what you built — and how to scale it. 15 minutes — worth it?", status: "approved" },
    { id: 4, name: "Appointment Reminder", type: "whatsapp", content: "Hi [Name], just a quick reminder — your demo call with SPARK AI is tomorrow at [Time]. Looking forward to chatting!", status: "approved" },
  ],
  flows: [
    { id: 1, name: "New Lead Follow-Up Flow", steps: 4, status: "active", trigger: "New lead created in CRM" },
    { id: 2, name: "Dormant Lead Reactivation", steps: 3, status: "draft", trigger: "Lead inactive for 90 days" },
    { id: 3, name: "Demo Scheduler Flow", steps: 2, status: "active", trigger: "Lead clicks 'Book Demo'" },
  ],
  connectionStatus: "not_connected",
};

export default function Messaging() {
  const { data: messaging = MOCK_MESSAGING } = useGetMessagingData({ query: { queryKey: getGetMessagingDataQueryKey() } });
  const templates = messaging?.templates ?? MOCK_MESSAGING.templates;
  const flows = messaging?.flows ?? MOCK_MESSAGING.flows;
  const connectionStatus = messaging?.connectionStatus ?? MOCK_MESSAGING.connectionStatus;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-messaging">
            <MessageSquare size={20} className="text-primary" /> Messaging Workbench
          </h1>
          <p className="text-muted-foreground text-sm">WhatsApp templates, message flows, and conversation management</p>
        </div>
        <Button className="gap-2" data-testid="btn-new-template"><Plus size={14} /> New Template</Button>
      </div>

      {connectionStatus === "not_connected" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-amber-300">WhatsApp Business API not connected</p>
              <p className="text-xs text-muted-foreground mt-0.5">Connect your WhatsApp Business account to activate messaging flows</p>
            </div>
            <Button size="sm" className="shrink-0 gap-1" data-testid="btn-connect-whatsapp">Connect WhatsApp</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="templates">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="templates">Message Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="flows">Automation Flows ({flows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="border-border/60 bg-card" data-testid={`template-${tmpl.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{tmpl.name}</p>
                    <Badge variant="outline" className="text-xs border-green-500/30 text-muted-foreground">{tmpl.type}</Badge>
                    {tmpl.status === "approved" ? (
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Pending</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7">Edit</Button>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/40">
                  <p className="text-sm text-foreground/90 leading-relaxed">{tmpl.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="flows" className="mt-4 space-y-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="border-border/60 bg-card" data-testid={`flow-${flow.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{flow.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{flow.steps} steps · Trigger: {flow.trigger}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${flow.status === "active" ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{flow.status}</Badge>
                  <Button size="sm" variant="outline" className="text-xs h-7">Edit Flow</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
