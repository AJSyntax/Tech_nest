import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  otpCode: string;
}

const OTPModal: React.FC<OTPModalProps> = ({
  open,
  onClose,
  otpCode
}) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTimeLeft(300); // Reset timer to 5 minutes

      // Start countdown timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear timer when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [open]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Verification</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Your OTP Code</p>
            <div className="relative text-3xl font-bold tracking-wider bg-muted p-6 rounded-md mb-4">
              {otpCode}
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2"
                onClick={() => {
                  navigator.clipboard.writeText(otpCode);
                  setCopied(true);
                  toast({
                    title: "Copied to clipboard",
                    description: "OTP code copied to clipboard"
                  });
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span>Time remaining:</span>
                <span className={timeLeft < 60 ? "text-destructive font-semibold" : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Progress value={(timeLeft / 300) * 100} className={timeLeft < 60 ? "bg-destructive" : "bg-primary"} />
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Please enter this code in the registration form to verify your email.
            </p>

            <Button
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPModal;
