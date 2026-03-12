import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, type Participant } from "@/lib/gameStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WithdrawalsTabProps {
  participants: Participant[];
  onRefresh: () => Promise<void>;
}

export default function WithdrawalsTab({ participants, onRefresh }: WithdrawalsTabProps) {
  const { toast } = useToast();
  const withdrawals = participants.filter(p => p.withdrawalStatus !== 'none');

  const updateStatus = async (p: Participant, status: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ withdrawal_status: status })
        .eq('code', p.code)
        .eq('device_id', p.deviceId);
      if (error) throw error;
      await onRefresh();
      toast({ title: `Status updated to ${status}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  if (withdrawals.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests yet</p>;
  }

  return (
    <div className="space-y-2">
      {withdrawals.map((p, i) => (
        <div key={i} className="glass-card flex flex-wrap items-center gap-3 rounded-lg px-4 py-3">
          <span className="font-semibold text-foreground">{p.name || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">{p.email || '—'}</span>
          <span className="font-display font-semibold text-primary">{formatCurrency(p.amountWon || 0)}</span>
          <div className="ml-auto flex items-center gap-2">
            <Select value={p.withdrawalStatus} onValueChange={(v) => updateStatus(p, v)}>
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
      ))}
    </div>
  );
}
