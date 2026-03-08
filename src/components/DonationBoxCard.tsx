import { motion } from "framer-motion";
import { Gift, Lock } from "lucide-react";

interface DonationBoxCardProps {
  boxNumber: number;
  isOpened: boolean;
  isDisabled: boolean;
  onClick: () => void;
  delay?: number;
}

export default function DonationBoxCard({ boxNumber, isOpened, isDisabled, onClick, delay = 0 }: DonationBoxCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      whileHover={!isDisabled && !isOpened ? { scale: 1.05, y: -4 } : {}}
      whileTap={!isDisabled && !isOpened ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={isDisabled || isOpened}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 transition-all duration-300
        ${isOpened
          ? 'border-reward-gold bg-reward-gold-light reward-glow cursor-default'
          : isDisabled
            ? 'border-border bg-muted cursor-not-allowed opacity-50'
            : 'border-border bg-card box-shadow-soft hover:box-shadow-hover hover:border-primary/40 cursor-pointer'
        }`}
    >
      {isDisabled && !isOpened && (
        <Lock className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
      )}
      <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${
        isOpened ? 'bg-reward-gold/20' : 'bg-primary/10'
      }`}>
        <Gift className={`h-7 w-7 ${isOpened ? 'text-reward-gold' : 'text-primary'}`} />
      </div>
      <span className="font-display text-sm font-semibold text-foreground">
        Box {boxNumber}
      </span>
      {isOpened && (
        <span className="text-xs font-medium text-reward-gold">Opened!</span>
      )}
    </motion.button>
  );
}
