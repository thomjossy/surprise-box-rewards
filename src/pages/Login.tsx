import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { LogIn, ArrowRight, Gift } from "lucide-react";
import { loginUser, setCurrentSession, getDeviceId } from "@/lib/gameStore";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { getParticipantByUserId } from "@/lib/gameStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in via Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const participant = await getParticipantByUserId(session.user.id);
        if (participant && participant.boxSelected) {
          setCurrentSession(participant);
          navigate("/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email.trim(), password);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      const participant = result.user?.participant;
      if (participant) {
        setCurrentSession(participant);
        navigate("/dashboard");
      } else {
        setError("No reward data found for this account.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              <LogIn className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground">
              Log in to view your reward balance
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="Enter your email"
                  className="h-12"
                />
              </div>
              <div>
                <Label>Password</Label>
                <PasswordInput
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  className="h-12"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full gap-2 text-base font-semibold">
              {loading ? "Logging in..." : "Log In"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?
            </p>
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <Gift className="h-4 w-4" /> Enter participation code to play
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
