import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, ShieldCheck, MessageCircle, ArrowRight, ArrowLeft, Upload } from "lucide-react";

interface ClaimRewardFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const steps = [
  { title: "Create Account", icon: User, description: "Set up your account to claim your reward" },
  { title: "Link Bank Account", icon: Building2, description: "Add your bank details for payout" },
  { title: "KYC Verification", icon: ShieldCheck, description: "Verify your identity" },
  { title: "Final Step", icon: MessageCircle, description: "Contact support to finalize" },
];

export default function ClaimRewardFlow({ open, onClose, onComplete }: ClaimRewardFlowProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '',
    bankName: '', accountNumber: '', accountName: '',
    idUploaded: false, selfieUploaded: false, address: '',
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.fullName && formData.email && formData.phone && formData.password;
      case 1: return formData.bankName && formData.accountNumber && formData.accountName;
      case 2: return formData.idUploaded && formData.selfieUploaded && formData.address;
      default: return true;
    }
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete(formData);
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            </div>
          ))}
        </div>

        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center font-display">{steps[step].title}</DialogTitle>
          <DialogDescription className="text-center">{steps[step].description}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-4"
          >
            {step === 0 && (
              <>
                <div><Label>Full Name</Label><Input value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="John Doe" /></div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="john@example.com" /></div>
                <div><Label>Phone Number</Label><Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+234..." /></div>
                <div><Label>Password</Label><Input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Create a password" /></div>
              </>
            )}

            {step === 1 && (
              <>
                <div><Label>Bank Name</Label><Input value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} placeholder="e.g. GTBank" /></div>
                <div><Label>Account Number</Label><Input value={formData.accountNumber} onChange={e => updateField('accountNumber', e.target.value)} placeholder="0123456789" /></div>
                <div><Label>Account Name</Label><Input value={formData.accountName} onChange={e => updateField('accountName', e.target.value)} placeholder="John Doe" /></div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>Government ID</Label>
                  <button
                    onClick={() => updateField('idUploaded', true)}
                    className={`mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-colors
                      ${formData.idUploaded ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    <Upload className="h-4 w-4" />
                    {formData.idUploaded ? 'ID Uploaded ✓' : 'Click to upload ID'}
                  </button>
                </div>
                <div>
                  <Label>Selfie Verification</Label>
                  <button
                    onClick={() => updateField('selfieUploaded', true)}
                    className={`mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-colors
                      ${formData.selfieUploaded ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    <Upload className="h-4 w-4" />
                    {formData.selfieUploaded ? 'Selfie Uploaded ✓' : 'Click to upload selfie'}
                  </button>
                </div>
                <div><Label>Address</Label><Input value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="Your residential address" /></div>
              </>
            )}

            {step === 3 && (
              <div className="rounded-xl border border-border bg-secondary/50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <ShieldCheck className="h-6 w-6 text-success" />
                </div>
                <p className="mb-2 font-display text-base font-semibold text-foreground">
                  Verification Complete!
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Your registration and verification have been completed successfully. To finalize your reward payment, please contact Live Support so your account details can be confirmed and linked for payout.
                </p>
                <Button
                  onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Live Support
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Button onClick={next} disabled={!canProceed()} className="ml-auto gap-1">
            {step === 3 ? 'Finish' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
