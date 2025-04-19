import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [secretEmail, setSecretEmail] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [secretQuestion, setSecretQuestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSecretSubmitting, setIsSecretSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/forgot-password", { email });

      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "If your email is registered, you will receive a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await apiRequest("GET", `/api/user-question?email=${encodeURIComponent(secretEmail)}`);
      const data = await response.json();

      if (data.secretQuestion) {
        setSecretQuestion(data.secretQuestion);
        toast({
          title: "Email Found",
          description: "Please answer your security question to reset your password.",
        });
      } else {
        toast({
          title: "Email Not Found",
          description: "No account found with this email address.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSecretSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/verify-secret-answer", {
        email: secretEmail,
        secretAnswer
      });

      const data = await response.json();

      if (data.resetToken) {
        setResetToken(data.resetToken);
        toast({
          title: "Answer Verified",
          description: "Your security answer has been verified. You can now reset your password.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSecretSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Reset your password using email or security question
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Reset</TabsTrigger>
            <TabsTrigger value="security">Security Question</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            {!emailSent ? (
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/auth">Back to Login</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h3 className="text-lg font-medium">Email Sent</h3>
                  <p className="text-center text-muted-foreground">
                    If your email is registered, you will receive a password reset link shortly.
                    Please check your inbox and spam folder.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/auth">Return to Login</Link>
                  </Button>
                </div>
              </CardContent>
            )}
          </TabsContent>

          <TabsContent value="security">
            {resetToken ? (
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h3 className="text-lg font-medium">Security Answer Verified</h3>
                  <p className="text-center text-muted-foreground">
                    Your security answer has been verified. You can now reset your password.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={`/reset-password?token=${resetToken}`}>Reset Password</Link>
                  </Button>
                </div>
              </CardContent>
            ) : secretQuestion ? (
              <form onSubmit={handleSecretSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Security Question</Label>
                    <p className="text-sm border p-3 rounded-md bg-muted">{secretQuestion}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret-answer">Your Answer</Label>
                    <Input
                      id="secret-answer"
                      type="text"
                      placeholder="Enter your answer"
                      value={secretAnswer}
                      onChange={(e) => setSecretAnswer(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSecretQuestion(null)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSecretSubmitting}>
                    {isSecretSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Answer"
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleCheckEmail}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="secret-email">Email Address</Label>
                    <Input
                      id="secret-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={secretEmail}
                      onChange={(e) => setSecretEmail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/auth">Back to Login</Link>
                  </Button>
                  <Button type="submit">
                    Continue
                  </Button>
                </CardFooter>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
