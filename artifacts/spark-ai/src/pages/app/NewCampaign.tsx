import { useState } from "react";
import { useLocation } from "wouter";
import {
  Layers, Zap, ArrowLeft, ArrowRight, ChevronRight,
  Target, Globe, Users, BarChart2, Mail, Palette,
  Search, CheckCircle, Megaphone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "choose" | "channels" | "integrated";

// ─── Channel definitions ──────────────────────────────────────────────────────

const CHANNELS = [
  { id: "ppc",       label: "PPC",      sublabel: "Paid Search",     icon: Target,   route: "/channels/ppc?new=1",       ready: true  },
  { id: "seo",       label: "SEO",      sublabel: "Organic Search",  icon: Search,   route: "/channels/seo",             ready: true  },
  { id: "social",    label: "Social",   sublabel: "Paid & Organic",  icon: Megaphone,route: "/channels/social",          ready: true  },
  { id: "crm",       label: "CRM",      sublabel: "Email & Nurture", icon: Mail,     route: "/channels/crm",             ready: true  },
  { id: "messaging", label: "Messaging",sublabel: "SMS & Push",      icon: Globe,    route: "/channels/messaging",       ready: true  },
  { id: "creative",  label: "Creative", sublabel: "Assets & Copy",   icon: Palette,  route: "/channels/creative",        ready: true  },
];

const INTEGRATED_TYPES = [
  { value: "product_launch",    label: "Product Launch",        desc: "Coordinated across channels with shared messaging" },
  { value: "demand_generation", label: "Demand Generation",     desc: "Multi-channel pipeline building at scale" },
  { value: "regional",          label: "Regional Campaign",     desc: "Geography-specific across paid, organic, and CRM" },
  { value: "brand",             label: "Brand Campaign",        desc: "Awareness and positioning across all touchpoints" },
];

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function ChooseScreen({ onChoose }: { onChoose: (s: "channels" | "integrated") => void }) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 space-y-14">
      <div>
        <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">New Campaign</p>
        <h1 className="text-4xl font-bold leading-tight mb-4">What do you want to create?</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
          SPARK supports two campaign models. Choose the one that fits your work.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* ── Integrated Campaign ── */}
        <button
          onClick={() => onChoose("integrated")}
          className="group text-left p-10 rounded-3xl border border-white/[0.07] bg-white/[0.01] hover:border-primary/25 hover:bg-primary/[0.03] transition-all duration-200"
          data-testid="btn-integrated-campaign"
        >
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Layers size={22} className="text-primary" />
            </div>
            <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all mt-1" />
          </div>

          <h2 className="text-2xl font-bold mb-3">Integrated Campaign</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            One campaign. Multiple channels. Shared brief, budget, and approvals.
            Channel teams work from a master strategy.
          </p>

          <div className="space-y-2 mb-8">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Best for</p>
            {["Product launches", "Cross-channel demand generation", "Regional campaigns", "Brand campaigns"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/[0.05] space-y-2">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Ownership model</p>
            <div className="flex flex-wrap gap-2">
              {[
                { role: "Campaign Owner", highlight: true },
                { role: "Channel Owners", highlight: false },
                { role: "Contributors",   highlight: false },
                { role: "Approvers",      highlight: false },
              ].map(({ role, highlight }) => (
                <span key={role} className={`text-xs px-3 py-1.5 rounded-full border ${
                  highlight
                    ? "border-primary/25 bg-primary/[0.07] text-primary/80"
                    : "border-white/[0.06] text-muted-foreground/50"
                }`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </button>

        {/* ── Channel Campaign ── */}
        <button
          onClick={() => onChoose("channels")}
          className="group text-left p-10 rounded-3xl border border-white/[0.07] bg-white/[0.01] hover:border-white/[0.14] hover:bg-white/[0.025] transition-all duration-200"
          data-testid="btn-channel-campaign"
        >
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.07] transition-colors">
              <Zap size={22} className="text-foreground/60" />
            </div>
            <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all mt-1" />
          </div>

          <h2 className="text-2xl font-bold mb-3">Channel Campaign</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            Standalone execution for a single channel. Operates independently
            or links to a parent integrated campaign.
          </p>

          <div className="space-y-2 mb-8">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Best for</p>
            {["BAU paid search campaigns", "Standalone SEO projects", "CRM nurture programs", "Channel-specific execution"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/[0.05] space-y-2">
            <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Ownership model</p>
            <div className="flex flex-wrap gap-2">
              {[
                { role: "Channel Owner", highlight: true },
                { role: "Contributors",  highlight: false },
                { role: "Approvers",     highlight: false },
              ].map(({ role, highlight }) => (
                <span key={role} className={`text-xs px-3 py-1.5 rounded-full border ${
                  highlight
                    ? "border-white/[0.12] bg-white/[0.05] text-foreground/60"
                    : "border-white/[0.06] text-muted-foreground/50"
                }`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </button>
      </div>

      <p className="text-sm text-muted-foreground/40 text-center">
        Channel campaigns can be linked to an integrated campaign at any time.
      </p>
    </div>
  );
}

function ChannelPickerScreen({ onBack }: { onBack: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-3xl mx-auto px-8 py-16 space-y-12">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-8">
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">Channel Campaign</p>
        <h1 className="text-4xl font-bold leading-tight mb-4">Which channel?</h1>
        <p className="text-lg text-muted-foreground">
          SPARK will open the right studio for your chosen channel.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          return (
            <button
              key={ch.id}
              onClick={() => setLocation(ch.route)}
              className="group text-left p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
              data-testid={`btn-channel-${ch.id}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-6 group-hover:bg-white/[0.07] transition-colors">
                <Icon size={18} className="text-foreground/60" />
              </div>
              <p className="font-semibold text-base mb-1">{ch.label}</p>
              <p className="text-sm text-muted-foreground">{ch.sublabel}</p>
            </button>
          );
        })}
      </div>

      <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
        <p className="text-sm text-muted-foreground/60 leading-relaxed">
          <span className="text-foreground/50 font-medium">Linking to a parent campaign?</span>{" "}
          You can connect this channel campaign to an integrated campaign from the campaign detail page after creation.
        </p>
      </div>
    </div>
  );
}

function IntegratedBriefScreen({ onBack }: { onBack: () => void }) {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 space-y-12">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-8">
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest mb-4">Integrated Campaign</p>
        <h1 className="text-4xl font-bold leading-tight mb-4">Start your campaign brief</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Define the master brief. Channel owners will receive their briefs from this.
        </p>
      </div>

      {/* Campaign name */}
      <div>
        <p className="text-sm font-medium text-foreground/70 mb-4">Campaign name</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. APAC Product Launch Q3, Global Demand Gen"
          className="w-full bg-transparent border-0 border-b-2 border-white/[0.08] focus:border-primary/40 text-2xl font-medium text-foreground placeholder:text-white/[0.14] focus:outline-none transition-colors pb-4"
        />
      </div>

      {/* Campaign type */}
      <div>
        <p className="text-sm font-medium text-foreground/70 mb-5">Campaign type</p>
        <div className="space-y-3">
          {INTEGRATED_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`w-full text-left flex items-center gap-5 px-6 py-5 rounded-2xl border transition-all ${
                type === t.value
                  ? "border-primary/30 bg-primary/[0.06]"
                  : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.10]"
              }`}
            >
              {type === t.value
                ? <CheckCircle size={16} className="text-primary shrink-0" />
                : <div className="w-4 h-4 rounded-full border border-white/[0.15] shrink-0" />
              }
              <div>
                <p className={`font-semibold text-base mb-0.5 ${type === t.value ? "text-primary" : ""}`}>{t.label}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ownership model */}
      <div className="p-7 rounded-2xl border border-white/[0.05] bg-white/[0.01] space-y-5">
        <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Ownership</p>
        <div className="space-y-4">
          {[
            { role: "Campaign Owner",  desc: "Owns the master brief, budget, and approval sign-off", you: true  },
            { role: "Channel Owners",  desc: "Assigned per channel — own channel-level execution",   you: false },
            { role: "Contributors",    desc: "Can add content and updates within their channel",     you: false },
            { role: "Approvers",       desc: "Required sign-off at campaign or channel level",       you: false },
          ].map(({ role, desc, you }) => (
            <div key={role} className="flex items-start gap-4">
              <div className={`mt-0.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                you ? "bg-primary/10 text-primary/80 border border-primary/20" : "bg-white/[0.04] text-muted-foreground/50 border border-white/[0.06]"
              }`}>
                {you ? "You" : role}
              </div>
              <div>
                {!you && <p className="text-sm font-medium text-foreground/70 mb-0.5">{role}</p>}
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <button
          disabled={!name.trim() || !type}
          className={`w-full flex items-center justify-center gap-2.5 py-5 rounded-2xl text-base font-semibold transition-all ${
            name.trim() && type
              ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
              : "bg-white/[0.04] text-muted-foreground/40 cursor-not-allowed"
          }`}
          data-testid="btn-create-integrated"
        >
          <Layers size={17} /> Start Brief Builder
          <ArrowRight size={17} />
        </button>
        {(!name.trim() || !type) && (
          <p className="text-sm text-muted-foreground/40 text-center">
            Add a name and choose a campaign type to continue.
          </p>
        )}
        <p className="text-xs text-muted-foreground/35 text-center leading-relaxed">
          The full integrated brief builder — channels, budget allocation, and timeline — is coming soon.
          You'll be able to assign Channel Owners after creation.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewCampaign() {
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<Screen>("choose");

  return (
    <div className="min-h-full bg-[#0b0d14]">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-10 bg-[#0b0d14]/95 backdrop-blur border-b border-white/[0.05] px-7 py-4 flex items-center gap-3">
        <button
          onClick={() => screen === "choose" ? setLocation("/campaigns") : setScreen("choose")}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setScreen("choose")}
            className={`transition-colors ${screen === "choose" ? "text-foreground font-medium" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
          >
            New Campaign
          </button>
          {screen !== "choose" && (
            <>
              <ChevronRight size={13} className="text-white/[0.12]" />
              <span className="text-foreground/70 font-medium">
                {screen === "channels" ? "Channel Campaign" : "Integrated Campaign"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Screen content */}
      {screen === "choose"     && <ChooseScreen onChoose={setScreen} />}
      {screen === "channels"   && <ChannelPickerScreen onBack={() => setScreen("choose")} />}
      {screen === "integrated" && <IntegratedBriefScreen onBack={() => setScreen("choose")} />}
    </div>
  );
}
