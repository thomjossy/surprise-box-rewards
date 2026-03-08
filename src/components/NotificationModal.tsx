import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function NotificationModal({ open, onClose, title, message }: NotificationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-display">{title}</DialogTitle>
          <DialogDescription className="text-center">{message}</DialogDescription>
        </DialogHeader>
        <Button onClick={onClose} className="mt-2 w-full">Got it</Button>
      </DialogContent>
    </Dialog>
  );
}
