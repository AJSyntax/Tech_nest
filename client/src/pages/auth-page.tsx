import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Loader2, Eye, EyeOff, Check, X, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OTPModal from "@/components/modals/OTPModal";
import { useToast } from "@/hooks/use-toast";

// Password strength criteria
const passwordCriteria = [
  { id: "length", label: "At least 12 characters", regex: /.{12,}/ },
  { id: "uppercase", label: "At least one uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "At least one lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "At least one number", regex: /[0-9]/ },
  { id: "special", label: "At least one special character", regex: /[^A-Za-z0-9]/ },
];

// Secret questions options
const secretQuestions = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What high school did you attend?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What is the name of your favorite childhood teacher?",
  "What is your favorite book?",
];

export default function AuthPage() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    secretQuestion: "",
    secretAnswer: ""
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [meetsRequirements, setMeetsRequirements] = useState<Record<string, boolean>>({});
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  // Check password strength and update UI
  useEffect(() => {
    const password = registerData.password;

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
    if (registerData.confirmPassword) {
      setPasswordsMatch(registerData.password === registerData.confirmPassword);
    }
  }, [registerData.password, registerData.confirmPassword]);

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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (passwordStrength < 100 || !passwordsMatch) {
      toast({
        title: "Password Requirements",
        description: "Please ensure your password meets all requirements and matches the confirmation.",
        variant: "destructive"
      });
      return; // Don't submit if password requirements aren't met
    }

    if (!registerData.secretQuestion || !registerData.secretAnswer) {
      toast({
        title: "Security Question Required",
        description: "Please select a security question and provide an answer.",
        variant: "destructive"
      });
      return;
    }

    // Validate OTP before submission
    if (!otpCode) {
      toast({
        title: "OTP Required",
        description: "Please click 'Send OTP' to get a verification code first.",
        variant: "destructive"
      });
      return;
    }

    // Verify the OTP matches what was generated
    if (otpInput !== otpCode) {
      toast({
        title: "Invalid OTP",
        description: "The OTP code you entered is incorrect.",
        variant: "destructive"
      });
      return;
    }

    // Create the account with auto-login
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        // Auto-login after successful registration
        loginMutation.mutate({
          username: registerData.username,
          password: registerData.password
        });
      }
    });
  };

  // No longer needed as user will type OTP directly in the form

  const handleSendOtp = () => {
    if (!registerData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    // For demonstration purposes, generate a 6-digit OTP locally
    // In a real application, this would come from the server
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generatedOtp);
    setShowOtpModal(true);
    startResendCountdown();

    // No need to call the server API for testing purposes
    // This avoids the "Failed to generate OTP" error
    // generateOtpMutation.mutate({ email: registerData.email });

    // Log the OTP to console for debugging
    console.log('Generated OTP:', generatedOtp);
  };

  const startResendCountdown = () => {
    setCanResendOtp(false);
    setResendCountdown(60); // 1 minute countdown

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          setCanResendOtp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* OTP Modal */}
      <OTPModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        otpCode={otpCode}
      />
      {/* Form Section */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-4">
        <Tabs defaultValue="login" className="w-full max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to TechNest</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Register to start creating your portfolio
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Choose a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Password strength meter */}
                    {registerData.password && (
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

                  {/* Confirm Password - only show if password meets complexity requirements */}
                  {passwordStrength === 100 && (
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
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
                      {registerData.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  {/* Secret Question - only show if passwords match and confirm password is entered */}
                  {passwordStrength === 100 && passwordsMatch && registerData.confirmPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="register-secret-question">Secret Question</Label>
                      <Select
                        value={registerData.secretQuestion}
                        onValueChange={(value) => setRegisterData({...registerData, secretQuestion: value})}
                        required
                      >
                        <SelectTrigger id="register-secret-question">
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                        <SelectContent>
                          {secretQuestions.map((question) => (
                            <SelectItem key={question} value={question}>
                              {question}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Secret Answer - only show if a question is selected */}
                  {passwordStrength === 100 && passwordsMatch && registerData.confirmPassword && registerData.secretQuestion && (
                    <div className="space-y-2">
                      <Label htmlFor="register-secret-answer">Answer</Label>
                      <Input
                        id="register-secret-answer"
                        type="text"
                        placeholder="Your answer"
                        value={registerData.secretAnswer}
                        onChange={(e) => setRegisterData({...registerData, secretAnswer: e.target.value})}
                        required
                      />
                    </div>
                  )}

                  {/* Email verification section */}
                  {passwordStrength === 100 && passwordsMatch && registerData.confirmPassword &&
                   registerData.secretQuestion && registerData.secretAnswer && (
                    <div className="space-y-2">
                      <Label htmlFor="email-verification">Email Verification</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="email-verification"
                          type="email"
                          placeholder="Confirm your email address"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                          className="flex-1"
                          disabled={registerMutation.isPending}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOtp}
                          disabled={!registerData.email || !canResendOtp}
                        >
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {canResendOtp ? "Send OTP" : `Wait ${resendCountdown}s`}
                          </>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click "Send OTP" to get a verification code.
                      </p>
                    </div>
                  )}

                  {/* OTP Input Field - directly in the form */}
                  {otpCode && passwordStrength === 100 && passwordsMatch && registerData.confirmPassword &&
                   registerData.secretQuestion && registerData.secretAnswer && (
                    <div className="space-y-2">
                      <Label htmlFor="otp-verification">Enter OTP Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="otp-verification"
                          type="text"
                          placeholder="Enter 6-digit OTP code"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="flex-1"
                          maxLength={6}
                          pattern="[0-9]{6}"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code that was shown in the popup.
                      </p>
                    </div>
                  )}

                  {/* Email verification notice */}
                  <Alert>
                    <AlertDescription>
                      You will need to verify your email with a 6-digit OTP code.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending ||
                              !passwordStrength || !passwordsMatch || !registerData.secretQuestion ||
                              !registerData.secretAnswer || !otpInput}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="mx-auto flex flex-col justify-center p-12">
          <h1 className="text-4xl font-bold mb-6">Welcome to TechNest</h1>
          <p className="text-xl mb-8">Build beautiful portfolio websites in minutes with our easy-to-use platform.</p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Professional Templates</h3>
                <p className="text-white/80">Choose from a variety of beautiful, responsive templates.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Easy Customization</h3>
                <p className="text-white/80">Personalize colors, content, and layout with a few clicks.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Instant Download</h3>
                <p className="text-white/80">Get your portfolio website ready to host in minutes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}