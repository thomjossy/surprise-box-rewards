import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getCodes,
  getBoxes,
  getParticipants,
  formatCurrency,
  addSingleCode,
  addMultipleCodes,
  toggleCodeActive,
  deleteSingleCode,
  updateBox,
  type ParticipationCode,
  type DonationBox,
  type Participant,
  type NotificationConfig,
} from "@/lib/gameStore";
import { supabase } from "@/integrations/supabase/client";
import {
  KeyRound, Gift, Users, Bell, Wallet, Plus, Trash2, Copy, Check, Shield,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ParticipantsTab from "@/components/admin/ParticipantsTab";
import WithdrawalsTab from "@/components/admin/WithdrawalsTab";
import { useToast } from "@/hooks/use-toast";
import { requireAdmin } from "@/lib/adminAuth";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [codes, setCodesState] = useState<ParticipationCode[]>([]);
  const [boxes, setBoxesState] = useState<DonationBox[]>([]);
  const [participants, setParticipantsState] = useState<Participant[]>([]);
  const [notif, setNotifState] = useState<NotificationConfig>({ enabled: false, title: "", message: "" });
  const [newCode, setNewCode] = useState("");
  const [bulkCount, setBulkCount] = useState("5");
  const [copied, setCopied] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const adminCheck = await requireAdmin();
      if (cancelled) return;
      if (!adminCheck.ok) { navigate("/admin-login"); return; }
      setCheckingAuth(false);

      try {
        const [codesData, boxesData, participantsData] = await Promise.all([
          getCodes(), getBoxes(), getParticipants(),
        ]);
        // Fetch ALL notifications (not just enabled) for admin
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        setCodesState(codesData);
        setBoxesState(boxesData);
        setParticipantsState(participantsData);
        if (notifData) {
          setNotifState({ enabled: notifData.enabled ?? false, title: notifData.title, message: notifData.message });
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast({ title: "Failed to load admin data", variant: "destructive" });
      }
    };

    load();
    return () => { cancelled = true; };
  }, [navigate, toast]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm text-muted-foreground">Checking admin access…</p>
        </main>
      </div>
    );
  }

  const refreshCodes = async () => { setCodesState(await getCodes()); };
  const refreshBoxes = async () => { setBoxesState(await getBoxes()); };
  const refreshParticipants = async () => { setParticipantsState(await getParticipants()); };

  const addCode = async () => {
    if (!newCode.trim()) return;
    try {
      await addSingleCode({ code: newCode.trim().toUpperCase(), isActive: true, dateCreated: new Date().toISOString() });
      await refreshCodes();
      setNewCode("");
      toast({ title: "Code added" });
    } catch {
      await refreshCodes();
      toast({ title: "Failed to add code", variant: "destructive" });
    }
  };

  const generateBulk = async () => {
    const count = parseInt(bulkCount) || 5;
    const newCodes: ParticipationCode[] = Array.from({ length: count }, () => ({
      code: `TYR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      isActive: true,
      dateCreated: new Date().toISOString(),
    }));
    try {
      await addMultipleCodes(newCodes);
      await refreshCodes();
      toast({ title: `${count} codes generated` });
    } catch {
      await refreshCodes();
      toast({ title: "Failed to generate codes", variant: "destructive" });
    }
  };

  const handleToggleCode = async (code: string) => {
    const current = codes.find(c => c.code === code);
    if (!current) return;
    try {
      await toggleCodeActive(code, !current.isActive);
      await refreshCodes();
    } catch {
      await refreshCodes();
      toast({ title: "Failed to update code", variant: "destructive" });
    }
  };

  const deleteCode = async (code: string) => {
    try {
      await deleteSingleCode(code);
      await refreshCodes();
      toast({ title: "Code removed" });
    } catch {
      await refreshCodes();
      toast({ title: "Failed to remove code", variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const updateBoxReward = async (id: number, field: "reward" | "amount", value: string) => {
    const updates: Partial<DonationBox> = field === "amount" ? { amount: parseInt(value) || 0 } : { reward: value };
    setBoxesState(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    try {
      await updateBox(id, updates);
    } catch {
      await refreshBoxes();
      toast({ title: "Failed to update box", variant: "destructive" });
    }
  };

  const resetBox = async (id: number) => {
    try {
      await updateBox(id, { isOpened: false, openedBy: undefined });
      await refreshBoxes();
      toast({ title: `Box ${id} reset to available` });
    } catch {
      toast({ title: "Failed to reset box", variant: "destructive" });
    }
  };

  const addBox = async () => {
    const newId = boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    try {
      const { error } = await supabase.from('reward_boxes').insert([{ id: newId, reward: `Reward ${newId}`, amount: 10000 }]);
      if (error) throw error;
      await refreshBoxes();
      toast({ title: "Box added" });
    } catch {
      toast({ title: "Failed to add box", variant: "destructive" });
    }
  };

  const removeBox = async (id: number) => {
    try {
      const { error } = await supabase.from('reward_boxes').delete().eq('id', id);
      if (error) throw error;
      await refreshBoxes();
      toast({ title: "Box removed" });
    } catch {
      toast({ title: "Failed to remove box", variant: "destructive" });
    }
  };

  const saveNotification = async () => {
    try {
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('notifications').insert([{
        enabled: notif.enabled,
        title: notif.title,
        message: notif.message,
      }]);
      if (error) throw error;
      toast({ title: "Notification updated" });
    } catch {
      toast({ title: "Failed to update notification", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="container max-w-4xl flex-1 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage codes, rewards, and participants</p>
          </div>
        </div>

        <Tabs defaultValue="codes">
          <TabsList className="mb-4 grid w-full grid-cols-5">
            <TabsTrigger value="codes" className="gap-1 text-xs"><KeyRound className="h-3.5 w-3.5" /><span className="hidden sm:inline">Codes</span></TabsTrigger>
            <TabsTrigger value="boxes" className="gap-1 text-xs"><Gift className="h-3.5 w-3.5" /><span className="hidden sm:inline">Boxes</span></TabsTrigger>
            <TabsTrigger value="participants" className="gap-1 text-xs"><Users className="h-3.5 w-3.5" /><span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 text-xs"><Bell className="h-3.5 w-3.5" /><span className="hidden sm:inline">Notify</span></TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-1 text-xs"><Wallet className="h-3.5 w-3.5" /><span className="hidden sm:inline">Payouts</span></TabsTrigger>
          </TabsList>

          {/* CODES TAB */}
          <TabsContent value="codes" className="space-y-4">
            <div className="glass-card flex flex-wrap gap-2 rounded-xl p-4">
              <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="New code" className="flex-1" />
              <Button onClick={addCode} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              <div className="flex items-center gap-2">
                <Input value={bulkCount} onChange={e => setBulkCount(e.target.value)} className="w-16" type="number" />
                <Button onClick={generateBulk} size="sm" variant="outline">Generate Bulk</Button>
              </div>
            </div>
            <div className="space-y-2">
              {codes.map(c => (
                <motion.div key={c.code} layout className="glass-card flex items-center gap-3 rounded-lg px-4 py-3">
                  <span className={`flex-1 font-mono text-sm ${c.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{c.code}</span>
                  <span className="text-xs text-muted-foreground">Active</span>
                  <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                    {copied === c.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <Switch checked={c.isActive} onCheckedChange={() => handleToggleCode(c.code)} />
                  <button onClick={() => deleteCode(c.code)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* BOXES TAB */}
          <TabsContent value="boxes" className="space-y-4">
            <Button onClick={addBox} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Box</Button>
            <div className="space-y-2">
              {boxes.map(box => (
                <div key={box.id} className="glass-card flex flex-wrap items-center gap-3 rounded-lg px-4 py-3">
                  <span className="min-w-[60px] font-display text-sm font-semibold">Box {box.id}</span>
                  <Input value={box.reward} onChange={e => updateBoxReward(box.id, 'reward', e.target.value)} className="flex-1 min-w-[120px]" placeholder="Reward name" />
                  <Input value={box.amount} onChange={e => updateBoxReward(box.id, 'amount', e.target.value)} className="w-28" type="number" placeholder="Amount" />
                  <span className={`text-xs ${box.isOpened ? 'text-reward-gold' : 'text-muted-foreground'}`}>
                    {box.isOpened ? 'Opened' : 'Available'}
                  </span>
                  {box.isOpened && (
                    <Button onClick={() => resetBox(box.id)} size="sm" variant="ghost" className="text-xs">Reset</Button>
                  )}
                  <button onClick={() => removeBox(box.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* PARTICIPANTS TAB */}
          <TabsContent value="participants">
            <ParticipantsTab participants={participants} onRefresh={refreshParticipants} />
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="glass-card space-y-4 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <Label>Enable Notification</Label>
                <Switch checked={notif.enabled} onCheckedChange={v => setNotifState({ ...notif, enabled: v })} />
              </div>
              <div><Label>Title</Label><Input value={notif.title} onChange={e => setNotifState({ ...notif, title: e.target.value })} /></div>
              <div><Label>Message</Label><textarea value={notif.message} onChange={e => setNotifState({ ...notif, message: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} /></div>
              <Button onClick={saveNotification}>Save Changes</Button>
            </div>
          </TabsContent>

          {/* WITHDRAWALS TAB */}
          <TabsContent value="withdrawals">
            <WithdrawalsTab participants={participants} onRefresh={refreshParticipants} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
