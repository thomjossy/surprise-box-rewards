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
  const [boxes, setBoxes] = useState(getBoxes());
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [claimFlowOpen, setClaimFlowOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState({ reward: '', amount: 0, boxNumber: 0 });

  useEffect(() => {
    const session = getCurrentSession();
    if (!session) {
      navigate("/");
      return;
    }
    if (session.boxSelected) {
      navigate("/dashboard");
    }
  }, [navigate]);

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

  const handleSelectBox = (boxId: number) => {
    if (selectedBox !== null) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    setSelectedBox(boxId);
    setCurrentReward({ reward: box.reward, amount: box.amount, boxNumber: box.id });

    // Update box as opened
    updateBox(boxId, { isOpened: true, openedBy: getCurrentSession()?.code });

    // Update session
    const session = getCurrentSession();
    if (session) {
      const updated = {
        ...session,
        boxSelected: boxId,
        rewardWon: box.reward,
        amountWon: box.amount,
      };
      setCurrentSession(updated);
      addParticipant(updated);
    }

    // Delay modal + confetti
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
    const session = getCurrentSession();
    if (session) {
      setCurrentSession({
        ...session,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        registrationComplete: true,
        bankLinked: false,
        kycComplete: true,
        withdrawalStatus: 'pending',
      });
    }
    setClaimFlowOpen(false);
    navigate("/dashboard");
  };

  const session = getCurrentSession();

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

        <div className="w-full max-w-xl">
          <DonationBoxGrid
            boxes={boxes}
            selectedBox={selectedBox}
            onSelectBox={handleSelectBox}
          />
        </div>

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
