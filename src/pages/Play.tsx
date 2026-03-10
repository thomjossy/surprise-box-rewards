import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { getBoxes, getCurrentSession, setCurrentSession, updateBox, addParticipant, formatCurrency } from "@/lib/gameStore";
import DonationBoxGrid from "@/components/DonationBoxGrid";
import RewardModal from "@/components/RewardModal";
import ClaimRewardFlow from "@/components/ClaimRewardFlow";
import AppHeader from "@/components/AppHeader";

export default function Play() {
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [claimFlowOpen, setClaimFlowOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState({ reward: '', amount: 0, boxNumber: 0 });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(getCurrentSession());

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    if (session.boxSelected) {
      navigate("/dashboard");
      return;
    }
    
    const loadBoxes = async () => {
      const boxesData = await getBoxes();
      setBoxes(boxesData);
      setLoading(false);
    };
    loadBoxes();
  }, [navigate, session]);

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const handleSelectBox = async (boxId: number) => {
    if (selectedBox !== null) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpened) return;

    setSelectedBox(boxId);
    setCurrentReward({ reward: box.reward, amount: box.amount, boxNumber: box.id });

    // Update box as opened in DB
    try {
      await updateBox(boxId, { isOpened: true, openedBy: session?.code });
    } catch (err) {
      console.error('Failed to update box:', err);
    }

    // Update local session and save participant to DB
    if (session) {
      const updated: typeof session = {
        ...session,
        boxSelected: boxId,
        rewardWon: box.reward,
        amountWon: box.amount,
      };
      setCurrentSession(updated);
      setSession(updated);

      // Save participant record to DB
      try {
        await addParticipant(updated);
      } catch (err) {
        console.error('Failed to save participant:', err);
      }
    }

    setTimeout(() => {
      fireConfetti();
      setRewardModalOpen(true);
    }, 600);
  };

  const handleClaim = () => {
    setRewardModalOpen(false);
    setTimeout(() => setClaimFlowOpen(true), 300);
  };

  const handleClaimComplete = (formData: any) => {
    if (session) {
      const updated = {
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
    }
    setClaimFlowOpen(false);
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        winnerName={session?.name}
        balanceWon={session?.amountWon}
      />

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Choose Your Donation Box
          </h1>
          <p className="text-sm text-muted-foreground">
            Select one box to reveal your hidden reward
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Loading boxes...</p>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <DonationBoxGrid
              boxes={boxes}
              selectedBox={selectedBox}
              onSelectBox={handleSelectBox}
            />
          </div>
        )}

        {selectedBox && !rewardModalOpen && !claimFlowOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="mb-1 text-sm text-muted-foreground">You won</p>
            <p className="font-display text-3xl font-bold text-primary">
              {formatCurrency(currentReward.amount)}
            </p>
          </motion.div>
        )}
      </main>

      <RewardModal
        open={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        reward={currentReward.reward}
        amount={currentReward.amount}
        boxNumber={currentReward.boxNumber}
        onClaim={handleClaim}
      />

      <ClaimRewardFlow
        open={claimFlowOpen}
        onClose={() => setClaimFlowOpen(false)}
        onComplete={handleClaimComplete}
      />
    </div>
  );
}
