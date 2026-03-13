import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getCurrentSession, setCurrentSession, clearCurrentSession, formatCurrency, logoutUser, registerUser, updateParticipant } from "@/lib/gameStore";
import { Gift, Wallet, Box, ShieldCheck, MessageCircle, LogOut } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ClaimRewardFlow from "@/components/ClaimRewardFlow";
import type { Participant } from "@/lib/gameStore";

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Participant | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    const s = getCurrentSession();
    if (!s || !s.boxSelected) {
      navigate("/");
      return;
    }
    setSession(s);
  }, [navigate]);

  if (!session) return null;

  const statusColor = {
    none: 'text-muted-foreground',
    pending: 'text-reward-gold',
    approved: 'text-success',
    rejected: 'text-destructive',
  };

  const statusLabel = {
    none: 'Not Requested',
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const cards = [
    { icon: Wallet, label: "Balance Won", value: formatCurrency(session.amountWon || 0), accent: true },
    { icon: Box, label: "Box Selected", value: `Box ${session.boxSelected}` },
    { icon: Gift, label: "Reward", value: session.rewardWon || '—' },
    { icon: ShieldCheck, label: "Withdrawal Status", value: statusLabel[session.withdrawalStatus], className: statusColor[session.withdrawalStatus] },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader winnerName={session.name} balanceWon={session.amountWon} />

      <main className="container max-w-lg flex-1 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl bg-primary p-5 text-center text-primary-foreground sm:hidden"
        >
          <p className="text-sm opacity-80">Balance Won</p>
          <p className="font-display text-3xl font-bold">{formatCurrency(session.amountWon || 0)}</p>
          {session.name && <p className="mt-1 text-sm opacity-80">{session.name}</p>}
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-4 ${card.accent ? 'border-primary/20' : ''}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className={`font-display text-lg font-bold ${card.className || 'text-foreground'}`}>
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {!session.registrationComplete && (
            <Button onClick={() => setClaimOpen(true)} className="w-full gap-2" size="lg">
              <Gift className="h-4 w-4" /> Claim Your Reward
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open('https://wa.me/1234567890', '_blank')}
          >
            <MessageCircle className="h-4 w-4" /> Contact Support
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={async () => {
              await logoutUser();
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </main>

      <ClaimRewardFlow
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onComplete={async (formData) => {
          const updated: Participant = {
            ...session,
            name: formData.fullName,
            email: formData.email,
            phone: `${formData.countryCode}${formData.phone}`,
            countryCode: formData.countryCode,
            address: formData.address,
            registrationComplete: true,
            bankLinked: false,
            kycComplete: true,
            withdrawalStatus: 'pending' as const,
          };
          setCurrentSession(updated);
          setSession(updated);

          // Register user in auth + update participant in DB
          try {
            await registerUser({
              email: formData.email,
              password: formData.password,
              fullName: formData.fullName,
              phone: formData.phone,
              countryCode: formData.countryCode,
              address: formData.address,
              participantCode: session.code,
              deviceId: session.deviceId,
              boxSelected: session.boxSelected,
              rewardWon: session.rewardWon,
              amountWon: session.amountWon,
              registrationComplete: true,
              kycComplete: true,
              withdrawalStatus: 'pending',
              dateRegistered: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Registration error:', err);
          }

          setClaimOpen(false);
        }}
      />
    </div>
  );
}
