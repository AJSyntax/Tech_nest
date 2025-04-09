import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  otpCode: string;
  onVerify: (otpInput: string) => void;
  isVerifying: boolean;
}

const OTPModal: React.FC<OTPModalProps> = ({
  open,
  onClose,
  otpCode,
  onVerify,
  isVerifying
}) => {
  const [otpInput, setOtpInput] = useState("");
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setOtpInput("");
    }
  }, [open]);

  const handleVerify = () => {
    if (otpInput.length === 6) {
      onVerify(otpInput);
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive",
      });
    }
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
          {otpCode ? (
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Your OTP Code</p>
              <div className="text-3xl font-bold tracking-wider bg-muted p-4 rounded-md">
                {otpCode}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Please copy this code and enter it below to verify your email.
              </p>
              <Button
                onClick={() => setOtpInput(otpCode)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Auto-fill
              </Button>
            </div>
          ) : (
            <>
              <p className="text-center">
                Enter the 6-digit verification code that was shown to you.
              </p>

              <InputOTP
                maxLength={6}
                value={otpInput}
                onChange={setOtpInput}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />

              <div className="flex flex-col w-full gap-2 mt-4">
                <Button
                  onClick={handleVerify}
                  className="w-full"
                  disabled={otpInput.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPModal;
