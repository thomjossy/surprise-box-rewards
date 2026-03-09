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
  setCodes,
  getBoxes,
  setBoxes,
  getParticipants,
  getNotification,
  setNotification,
  formatCurrency,
  type ParticipationCode,
  type DonationBox,
  type Participant,
  type NotificationConfig,
} from "@/lib/gameStore";
import {
  KeyRound,
  Gift,
  Users,
  Bell,
  Wallet,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { requireAdmin } from "@/lib/adminAuth";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [codes, setCodesState] = useState<ParticipationCode[]>([]);
  const [boxes, setBoxesState] = useState<DonationBox[]>([]);
  const [participants, setParticipantsState] = useState<Participant[]>([]);
  const [notif, setNotifState] = useState<NotificationConfig>({
    enabled: false,
    title: "",
    message: "",
  });
  const [newCode, setNewCode] = useState("");
  const [bulkCount, setBulkCount] = useState("5");
  const [copied, setCopied] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const adminCheck = await requireAdmin();
      if (cancelled) return;

      if (!adminCheck.ok) {
        navigate("/admin-login");
        return;
      }

      setCheckingAuth(false);

      try {
        const [codesData, boxesData, participantsData, notificationData] =
          await Promise.all([
            getCodes(),
            getBoxes(),
            getParticipants(),
            getNotification(),
          ]);

        if (cancelled) return;
        setCodesState(codesData);
        setBoxesState(boxesData);
        setParticipantsState(participantsData);
        setNotifState(notificationData);
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast({
          title: "Failed to load admin data",
          variant: "destructive",
        });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
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

  const refreshCodes = async () => {
    const codesData = await getCodes();
    setCodesState(codesData);
  };

  const addCode = async () => {
    if (!newCode.trim()) return;

    const updated = [
      ...codes,
      {
        code: newCode.trim().toUpperCase(),
        isActive: true,
        dateCreated: new Date().toISOString(),
      },
    ];

    try {
      await setCodes(updated);
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
    const updated = [...codes, ...newCodes];

    try {
      await setCodes(updated);
      await refreshCodes();
      toast({ title: `${count} codes generated` });
    } catch {
      await refreshCodes();
      toast({ title: "Failed to generate codes", variant: "destructive" });
    }
  };

  const toggleCode = async (code: string) => {
    const updated = codes.map((c) =>
      c.code === code ? { ...c, isActive: !c.isActive } : c,
    );

    try {
      await setCodes(updated);
      await refreshCodes();
    } catch {
      await refreshCodes();
      toast({ title: "Failed to update code", variant: "destructive" });
    }
  };

  const deleteCode = async (code: string) => {
    const updated = codes.filter((c) => c.code !== code);

    try {
      await setCodes(updated);
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

  const updateBoxReward = async (
    id: number,
    field: "reward" | "amount",
    value: string,
  ) => {
    const updated = boxes.map((b) =>
      b.id === id
        ? {
            ...b,
            [field]: field === "amount" ? parseInt(value) || 0 : value,
          }
        : b,
    );
    await setBoxes(updated);
    setBoxesState(updated);
  };

  const addBox = async () => {
    const newId = boxes.length > 0 ? Math.max(...boxes.map((b) => b.id)) + 1 : 1;
    const updated = [
      ...boxes,
      { id: newId, reward: `Reward ${newId}`, amount: 10000, isOpened: false },
    ];
    await setBoxes(updated);
    setBoxesState(updated);
  };

  const removeBox = async (id: number) => {
    const updated = boxes.filter((b) => b.id !== id);
    await setBoxes(updated);
    setBoxesState(updated);
  };

  const saveNotification = async () => {
    await setNotification(notif);
    toast({ title: "Notification updated" });
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
                  <Switch checked={c.isActive} onCheckedChange={() => toggleCode(c.code)} />
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
                  <Input
                    value={box.reward}
                    onChange={e => updateBoxReward(box.id, 'reward', e.target.value)}
                    className="flex-1 min-w-[120px]"
                    placeholder="Reward name"
                  />
                  <Input
                    value={box.amount}
                    onChange={e => updateBoxReward(box.id, 'amount', e.target.value)}
                    className="w-28"
                    type="number"
                    placeholder="Amount"
                  />
                  <span className={`text-xs ${box.isOpened ? 'text-reward-gold' : 'text-muted-foreground'}`}>
                    {box.isOpened ? 'Opened' : 'Available'}
                  </span>
                  <button onClick={() => removeBox(box.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* PARTICIPANTS TAB */}
          <TabsContent value="participants">
            {participants.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="glass-card rounded-lg px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-semibold text-foreground">{p.name || 'Unregistered'}</span>
                      <span className="text-muted-foreground">Code: {p.code}</span>
                      <span className="text-muted-foreground">Box: {p.boxSelected}</span>
                      <span className="font-display font-semibold text-primary">{formatCurrency(p.amountWon || 0)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Device: {p.deviceId.slice(0, 12)}…</span>
                      <span className={p.registrationComplete ? 'text-success' : ''}>
                        Reg: {p.registrationComplete ? '✓' : '✗'}
                      </span>
                      <span className={p.kycComplete ? 'text-success' : ''}>
                        KYC: {p.kycComplete ? '✓' : '✗'}
                      </span>
                    </div>
                    {p.registrationComplete && (
                      <div className="mt-2 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                        <div className="grid grid-cols-2 gap-1">
                          <span>Email: <span className="text-foreground">{p.email || '—'}</span></span>
                          <span>Phone: <span className="text-foreground">{p.phone || '—'}</span></span>
                        </div>
                        <div className="mt-1">
                          <span>Date: <span className="text-foreground">{new Date(p.dateUsed).toLocaleDateString()}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            {participants.filter(p => p.withdrawalStatus !== 'none').length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests yet</p>
            ) : (
              <div className="space-y-2">
                {participants.filter(p => p.withdrawalStatus !== 'none').map((p, i) => (
                  <div key={i} className="glass-card flex flex-wrap items-center gap-3 rounded-lg px-4 py-3">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="font-display font-semibold text-primary">{formatCurrency(p.amountWon || 0)}</span>
                    <span className={`ml-auto text-xs font-medium ${
                      p.withdrawalStatus === 'pending' ? 'text-reward-gold' :
                      p.withdrawalStatus === 'approved' ? 'text-success' : 'text-destructive'
                    }`}>
                      {p.withdrawalStatus.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
