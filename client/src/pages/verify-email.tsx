import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL query parameters
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link. No token provided.");
          return;
        }

        // Call the API to verify the email
        const response = await apiRequest("GET", `/api/verify-email?token=${token}`);
        const data = await response.json();

        setStatus("success");
        setMessage(data.message || "Your email has been verified successfully!");

        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully!",
        });
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to verify your email. The link may be expired or invalid.");

        toast({
          title: "Verification Failed",
          description: "Failed to verify your email. The link may be expired or invalid.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [location, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" ? "Verifying your email address..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center font-medium">{message}</p>
              <p className="text-center text-muted-foreground">You can now log in to your account.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center font-medium">Verification Failed</p>
              <p className="text-center text-muted-foreground">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/auth">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
