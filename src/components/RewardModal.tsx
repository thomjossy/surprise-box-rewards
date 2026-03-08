import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/gameStore";

interface RewardModalProps {
  open: boolean;
  onClose: () => void;
  reward: string;
  amount: number;
  boxNumber: number;
  onClaim: () => void;
}

export default function RewardModal({ open, onClose, reward, amount, boxNumber, onClaim }: RewardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-reward-gold sm:max-w-md">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="flex flex-col items-center py-4 text-center"
            >
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-reward-gold/15 reward-glow"
              >
                <Trophy className="h-10 w-10 text-reward-gold" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-1 font-display text-2xl font-bold text-foreground"
              >
                Congratulations! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-4 text-sm text-muted-foreground"
              >
                You opened Box {boxNumber}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-2 flex items-center gap-2 rounded-lg bg-reward-gold-light px-5 py-3"
              >
                <Gift className="h-5 w-5 text-reward-gold" />
                <span className="text-sm font-medium text-foreground">{reward}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="mb-6"
              >
                <p className="text-xs text-muted-foreground">Balance Won</p>
                <p className="font-display text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full"
              >
                <Button onClick={onClaim} className="w-full text-base font-semibold" size="lg">
                  Claim Reward
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
