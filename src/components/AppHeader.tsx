import { Gift, User } from "lucide-react";
import { formatCurrency } from "@/lib/gameStore";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";

interface AppHeaderProps {
  winnerName?: string;
  balanceWon?: number;
  showDashboardLink?: boolean;
}

export default function AppHeader({ winnerName, balanceWon, showDashboardLink }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Gift className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">thethankyou-rewards</span>
        </button>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          {winnerName && balanceWon !== undefined && (
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="text-muted-foreground">{winnerName}</span>
              <span className="font-display font-bold text-primary">{formatCurrency(balanceWon)}</span>
            </div>
          )}
          {showDashboardLink && location.pathname !== '/dashboard' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
