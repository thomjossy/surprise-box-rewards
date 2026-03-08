import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck, MessageCircle, ArrowRight, ArrowLeft, Upload, FileText, Image, X } from "lucide-react";

const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+60", country: "MY", flag: "🇲🇾" },
  { code: "+63", country: "PH", flag: "🇵🇭" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+62", country: "ID", flag: "🇮🇩" },
  { code: "+90", country: "TR", flag: "🇹🇷" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+20", country: "EG", flag: "🇪🇬" },
  { code: "+233", country: "GH", flag: "🇬🇭" },
  { code: "+255", country: "TZ", flag: "🇹🇿" },
  { code: "+256", country: "UG", flag: "🇺🇬" },
  { code: "+251", country: "ET", flag: "🇪🇹" },
  { code: "+237", country: "CM", flag: "🇨🇲" },
];

interface ClaimRewardFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const steps = [
  { title: "Create Account", icon: User, description: "Set up your account to claim your reward" },
  { title: "KYC Verification", icon: ShieldCheck, description: "Verify your identity" },
  { title: "Final Step", icon: MessageCircle, description: "Contact support to finalize" },
];

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export default function ClaimRewardFlow({ open, onClose, onComplete }: ClaimRewardFlowProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '', email: '', countryCode: '+1', phone: '', password: '',
    address: '',
  });
  const [idFile, setIdFile] = useState<UploadedFile | null>(null);
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: UploadedFile | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.fullName && formData.email && formData.phone && formData.password;
      case 1: return idFile && selfieFile && formData.address;
      default: return true;
    }
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      onComplete({ ...formData, idFile, selfieFile });
    }
  };

  const StepIcon = steps[step].icon;

  const FileUploadArea = ({
    label,
    file,
    onRemove,
    inputRef,
    onChange,
    accept,
  }: {
    label: string;
    file: UploadedFile | null;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept: string;
  }) => (
    <div>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      {file ? (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2.5">
          {file.type.startsWith('image/') ? (
            <Image className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <button onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40"
        >
          <Upload className="h-4 w-4" />
          Click to upload (Image or PDF)
        </button>
      )}
    </div>
  );

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
                <div>
                  <Label>Phone Number</Label>
                  <div className="mt-1 flex gap-2">
                    <Select value={formData.countryCode} onValueChange={v => updateField('countryCode', v)}>
                      <SelectTrigger className="w-[120px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countryCodes.map(c => (
                          <SelectItem key={c.code + c.country} value={c.code}>
                            {c.flag} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Phone number" className="flex-1" />
                  </div>
                </div>
                <div><Label>Password</Label><Input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Create a password" /></div>
              </>
            )}

            {step === 1 && (
              <>
                <FileUploadArea
                  label="Government ID"
                  file={idFile}
                  onRemove={() => setIdFile(null)}
                  inputRef={idInputRef as React.RefObject<HTMLInputElement>}
                  onChange={(e) => handleFileUpload(e, setIdFile)}
                  accept="image/*,.pdf"
                />
                <FileUploadArea
                  label="Selfie Verification"
                  file={selfieFile}
                  onRemove={() => setSelfieFile(null)}
                  inputRef={selfieInputRef as React.RefObject<HTMLInputElement>}
                  onChange={(e) => handleFileUpload(e, setSelfieFile)}
                  accept="image/*,.pdf"
                />
                <div><Label>Address</Label><Input value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="Your residential address" /></div>
              </>
            )}

            {step === 2 && (
              <div className="rounded-xl border border-border bg-secondary/50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <ShieldCheck className="h-6 w-6 text-success" />
                </div>
                <p className="mb-2 font-display text-base font-semibold text-foreground">
                  Verification Complete!
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Your registration and verification have been completed successfully. To finalize your reward payment and link your bank details, please contact Live Support.
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
            {step === 2 ? 'Finish' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
