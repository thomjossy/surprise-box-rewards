import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { validateCode, useCode, setCurrentSession, getDeviceId, getCurrentSession, getNotification } from "@/lib/gameStore";
import NotificationModal from "@/components/NotificationModal";
import AppHeader from "@/components/AppHeader";

export default function Index() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has an active session
    const session = getCurrentSession();
    if (session?.boxSelected) {
      navigate("/dashboard");
      return;
    }

    // Show notification
    const notif = getNotification();
    if (notif.enabled) {
      setNotifOpen(true);
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Please enter a participation code.");
      return;
    }

    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const result = validateCode(code.trim());
      if (!result.valid) {
        setError(result.message);
        setLoading(false);
        return;
      }

      useCode(code.trim());
      setCurrentSession({
        code: code.trim().toUpperCase(),
        deviceId: getDeviceId(),
        registrationComplete: false,
        bankLinked: false,
        kycComplete: false,
        withdrawalStatus: 'none',
        dateUsed: new Date().toISOString(),
      });

      navigate("/play");
      setLoading(false);
    }, 800);
  };

  const notif = getNotification();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Gift className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Welcome!
            </h1>
            <p className="flex items-center justify-center gap-1 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-reward-gold" />
              Enter your code to reveal a hidden reward
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Participation Code
              </label>
              <Input
                value={code}
                onChange={e => { setCode(e.target.value); setError(""); }}
                placeholder="Enter your code"
                className="h-12 text-center font-display text-lg tracking-wider uppercase"
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full gap-2 text-base font-semibold">
              {loading ? "Verifying..." : "Start Participation"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            All rewards are withdrawable
          </p>
        </motion.div>
      </main>

      <NotificationModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title={notif.title}
        message={notif.message}
      />
    </div>
  );
}
