import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RefreshCw, ChevronDown, ChevronUp, FileText, Image } from "lucide-react";
import { formatCurrency, type Participant } from "@/lib/gameStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ParticipantsTabProps {
  participants: Participant[];
  onRefresh: () => Promise<void>;
}

export default function ParticipantsTab({ participants, onRefresh }: ParticipantsTabProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateWithdrawalStatus = async (p: Participant, status: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ withdrawal_status: status })
        .eq('code', p.code)
        .eq('device_id', p.deviceId);
      if (error) throw error;
      await onRefresh();
      toast({ title: `Withdrawal status updated to ${status}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteParticipant = async (p: Participant) => {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('code', p.code)
        .eq('device_id', p.deviceId);
      if (error) throw error;
      await onRefresh();
      toast({ title: "Participant removed" });
    } catch {
      toast({ title: "Failed to remove participant", variant: "destructive" });
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => prev === key ? null : key);
  };

  return (
    <div>
      <div className="mb-4">
        <Button onClick={onRefresh} size="sm" variant="outline" className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      {participants.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No participants yet</p>
      ) : (
        <div className="space-y-2">
          {participants.map((p, i) => {
            const key = `${p.code}-${p.deviceId}`;
            const isExpanded = expanded === key;
            return (
              <div key={i} className="glass-card rounded-lg px-4 py-3">
                <div className="flex items-center gap-x-3">
                  <button onClick={() => toggleExpand(key)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold text-foreground">{p.name || 'Unregistered'}</span>
                    <span className="text-muted-foreground">Code: {p.code}</span>
                    <span className="text-muted-foreground">Box: {p.boxSelected ?? '—'}</span>
                    <span className="font-display font-semibold text-primary">{formatCurrency(p.amountWon || 0)}</span>
                  </div>
                  <button onClick={() => deleteParticipant(p)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Email: <span className="text-foreground">{p.email || '—'}</span></span>
                      <span className="text-muted-foreground">Phone: <span className="text-foreground">{p.phone || '—'}</span></span>
                      <span className="text-muted-foreground">Country: <span className="text-foreground">{p.countryCode || '—'}</span></span>
                      <span className="text-muted-foreground">Address: <span className="text-foreground">{p.address || '—'}</span></span>
                      <span className="text-muted-foreground">Reward: <span className="text-foreground">{p.rewardWon || '—'}</span></span>
                      <span className="text-muted-foreground">Device: <span className="text-foreground">{p.deviceId.slice(0, 16)}…</span></span>
                      <span className="text-muted-foreground">
                        Reg: <span className={p.registrationComplete ? 'text-success' : 'text-foreground'}>{p.registrationComplete ? '✓ Complete' : '✗ Incomplete'}</span>
                      </span>
                      <span className="text-muted-foreground">
                        KYC: <span className={p.kycComplete ? 'text-success' : 'text-foreground'}>{p.kycComplete ? '✓ Complete' : '✗ Incomplete'}</span>
                      </span>
                      <span className="text-muted-foreground">Date: <span className="text-foreground">{new Date(p.dateUsed).toLocaleString()}</span></span>
                      <span className="text-muted-foreground">User ID: <span className="text-foreground">{p.userId || '—'}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Withdrawal:</span>
                      <Select value={p.withdrawalStatus} onValueChange={(v) => updateWithdrawalStatus(p, v)}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
