import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { signInAdmin } from "@/lib/adminAuth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await signInAdmin(email, password);
      if (result.ok === false) {
        setError(result.message);
        return;
      }

      navigate("/admin");
    } catch {
      setError("Sign in failed. Please try again.");
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
              <Shield className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
              Admin Access
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage rewards and participants
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <Label>Admin Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="Enter admin email"
                  className="h-12"
                />
              </div>
              <div>
                <Label>Password</Label>
                <PasswordInput
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter admin password"
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
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
