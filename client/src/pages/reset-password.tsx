import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Password strength criteria
const passwordCriteria = [
  { id: "length", label: "At least 12 characters", regex: /.{12,}/ },
  { id: "uppercase", label: "At least one uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "At least one lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "At least one number", regex: /[0-9]/ },
  { id: "special", label: "At least one special character", regex: /[^A-Za-z0-9]/ },
];

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [meetsRequirements, setMeetsRequirements] = useState<Record<string, boolean>>({});
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    setToken(tokenFromUrl);
  }, [location]);

  // Check password strength and update UI
  useEffect(() => {
    // Check each criteria
    const newMeetsRequirements = passwordCriteria.reduce((acc, criteria) => {
      acc[criteria.id] = criteria.regex.test(password);
      return acc;
    }, {} as Record<string, boolean>);

    setMeetsRequirements(newMeetsRequirements);

    // Calculate strength percentage (20% for each criteria met)
    const metCount = Object.values(newMeetsRequirements).filter(Boolean).length;
    setPasswordStrength((metCount / passwordCriteria.length) * 100);

    // Check if passwords match
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (passwordStrength < 100 || !passwordsMatch) {
      toast({
        title: "Validation Error",
        description: !passwordsMatch
          ? "Passwords do not match"
          : "Password does not meet all requirements",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Invalid Request",
        description: "No reset token provided",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        password,
        confirmPassword,
      });

      const data = await response.json();

      setResetStatus("success");
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error: any) {
      setResetStatus("error");
      let message = "Failed to reset password";

      if (error.response && error.response.data) {
        message = error.response.data.message || message;
      } else if (error.message) {
        message = error.message;
      }

      setErrorMessage(message);

      toast({
        title: "Password Reset Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no token is provided, show an error
  if (token === null) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>
              Invalid reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-destructive">
              The password reset link is invalid or has expired.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/auth">Return to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If password reset was successful, show success message
  if (resetStatus === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been reset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 py-4">
              <Check className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Password strength: {getPasswordStrengthLabel()}</span>
                    <span className="text-xs">{Math.round(passwordStrength)}%</span>
                  </div>
                  <Progress value={passwordStrength} className={getPasswordStrengthColor()} />

                  {/* Password requirements checklist */}
                  <div className="mt-2 space-y-1">
                    {passwordCriteria.map((criteria) => (
                      <div key={criteria.id} className="flex items-center text-xs">
                        {meetsRequirements[criteria.id] ? (
                          <Check className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 mr-2 text-destructive" />
                        )}
                        <span>{criteria.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {resetStatus === "error" && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/auth">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
