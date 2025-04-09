import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Loader2, Eye, EyeOff, Check, X, Mail } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OTPModal from "@/components/modals/OTPModal";

// Password strength criteria
const passwordCriteria = [
  { id: "length", label: "At least 8 characters", regex: /.{8,}/ },
  { id: "uppercase", label: "At least one uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "At least one lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "At least one number", regex: /[0-9]/ },
  {
    id: "special",
    label: "At least one special character",
    regex: /[^A-Za-z0-9]/,
  },
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
    secretAnswer: "",
    otpCode: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [meetsRequirements, setMeetsRequirements] = useState<
    Record<string, boolean>
  >({});
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isEmailStep, setIsEmailStep] = useState(true);
  const [isGeneratingOTP, setIsGeneratingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [canResendOTP, setCanResendOTP] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  // Check password strength and update UI
  useEffect(() => {
    const password = registerData.password;

    // Check each criteria
    const newMeetsRequirements = passwordCriteria.reduce(
      (acc, criteria) => {
        acc[criteria.id] = criteria.regex.test(password);
        return acc;
      },
      {} as Record<string, boolean>,
    );

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

  // Check if all password criteria are met
  const isPasswordValid = () => {
    return passwordStrength === 100;
  };

  // Check if confirm password matches
  const isConfirmPasswordValid = () => {
    return registerData.confirmPassword && passwordsMatch;
  };

  // Check if security question is selected
  const isSecurityQuestionSelected = () => {
    return !!registerData.secretQuestion;
  };

  // Check if security answer is provided
  const isSecurityAnswerProvided = () => {
    return !!registerData.secretAnswer;
  };

  // Start resend countdown timer
  const startResendCountdown = () => {
    setCanResendOTP(false);
    setResendCountdown(60); // 60 seconds = 1 minute

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResendOTP(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return timer;
  };

  // Generate OTP
  const handleGenerateOTP = async () => {
    if (!registerData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingOTP(true);
    try {
      const response = await apiRequest("POST", "/api/generate-otp", {
        email: registerData.email,
      });
      const data = await response.json();

      // Set the OTP code and show the modal
      setGeneratedOTP(data.otpCode);
      setShowOTPModal(true);
      setEmailVerified(false);

      // Start the resend countdown
      const timer = startResendCountdown();

      // Clean up timer when component unmounts
      return () => clearInterval(timer);
    } catch (error: any) {
      toast({
        title: "OTP Generation Failed",
        description:
          error.message || "Failed to generate OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpInput: string) => {
    setIsVerifyingOTP(true);
    try {
      const response = await apiRequest("POST", "/api/verify-otp", {
        email: registerData.email,
        otpCode: otpInput,
      });

      await response.json();

      // Update the state
      setRegisterData((prev) => ({ ...prev, otpCode: otpInput }));
      setEmailVerified(true);
      setShowOTPModal(false);

      // Show success message
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Handle manual OTP input change
  const handleOTPInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRegisterData({ ...registerData, otpCode: value });
  };

  // Verify manually entered OTP
  const handleVerifyManualOTP = async () => {
    if (!registerData.otpCode || registerData.otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/verify-otp", {
        email: registerData.email,
        otpCode: registerData.otpCode,
      });

      await response.json();

      // Store the verified OTP code
      const verifiedOTP = registerData.otpCode;
      setEmailVerified(true);

      // Make sure the OTP code is still in the form data
      setRegisterData(prev => ({
        ...prev,
        otpCode: verifiedOTP
      }));

      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!isPasswordValid() || !isConfirmPasswordValid()) {
      toast({
        title: "Validation Error",
        description: !isConfirmPasswordValid()
          ? "Passwords do not match"
          : "Password does not meet all requirements",
        variant: "destructive",
      });
      return;
    }

    if (!emailVerified) {
      toast({
        title: "Email Verification Required",
        description:
          "Please verify your email address before creating an account.",
        variant: "destructive",
      });
      return;
    }

    // Make sure OTP code is included
    if (!registerData.otpCode || registerData.otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    // Create a copy of the data with the OTP code explicitly set
    const dataToSubmit = {
      ...registerData,
      otpCode: registerData.otpCode // Ensure OTP code is included
    };

    // Log the data being sent for debugging
    console.log("Sending registration data:", dataToSubmit);

    registerMutation.mutate(dataToSubmit);
  };

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <div className="flex min-h-screen">
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
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            username: e.target.value,
                          })
                        }
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
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
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
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
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
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Password strength meter */}
                      {registerData.password && (
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs">
                              Password strength: {getPasswordStrengthLabel()}
                            </span>
                            <span className="text-xs">
                              {Math.round(passwordStrength)}%
                            </span>
                          </div>
                          <Progress
                            value={passwordStrength}
                            className={getPasswordStrengthColor()}
                          />

                          {/* Password requirements checklist */}
                          <div className="mt-2 space-y-1">
                            {passwordCriteria.map((criteria) => (
                              <div
                                key={criteria.id}
                                className="flex items-center text-xs"
                              >
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

                    {/* Only show confirm password if password is valid */}
                    {isPasswordValid() && (
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={registerData.confirmPassword}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                confirmPassword: e.target.value,
                              })
                            }
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {registerData.confirmPassword && !passwordsMatch && (
                          <p className="text-xs text-destructive">
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}

                    {/* Only show security question if confirm password is valid */}
                    {isPasswordValid() && isConfirmPasswordValid() && (
                      <div className="space-y-2">
                        <Label htmlFor="register-secret-question">
                          Secret Question
                        </Label>
                        <Select
                          value={registerData.secretQuestion}
                          onValueChange={(value) =>
                            setRegisterData({
                              ...registerData,
                              secretQuestion: value,
                            })
                          }
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

                    {/* Only show security answer if security question is selected */}
                    {isPasswordValid() &&
                      isConfirmPasswordValid() &&
                      isSecurityQuestionSelected() && (
                        <div className="space-y-2">
                          <Label htmlFor="register-secret-answer">Answer</Label>
                          <Input
                            id="register-secret-answer"
                            type="text"
                            placeholder="Your answer"
                            value={registerData.secretAnswer}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                secretAnswer: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      )}

                    {/* Email verification section */}
                    {isPasswordValid() &&
                      isConfirmPasswordValid() &&
                      isSecurityQuestionSelected() &&
                      isSecurityAnswerProvided() && (
                        <div className="space-y-2">
                          <Label htmlFor="email-verification">
                            Email Verification
                          </Label>
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                id="email-verification"
                                type="text"
                                placeholder="Enter OTP code"
                                value={registerData.otpCode}
                                onChange={handleOTPInputChange}
                                className="flex-1"
                                disabled={emailVerified}
                                maxLength={6}
                              />
                              <Button
                                type="button"
                                onClick={handleGenerateOTP}
                                disabled={isGeneratingOTP || (!canResendOTP && !emailVerified)}
                              >
                                {isGeneratingOTP ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : !canResendOTP && !emailVerified ? (
                                  <>Resend in {resendCountdown}s</>
                                ) : emailVerified ? (
                                  <>Verified ✓</>
                                ) : (
                                  <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send OTP
                                  </>
                                )}
                              </Button>
                            </div>
                            {!emailVerified && registerData.otpCode && (
                              <Button
                                type="button"
                                onClick={handleVerifyManualOTP}
                                size="sm"
                                disabled={registerData.otpCode.length !== 6}
                              >
                                Verify OTP
                              </Button>
                            )}
                          </div>
                          {emailVerified && (
                            <p className="text-xs text-green-500">
                              Email verified successfully
                            </p>
                          )}
                        </div>
                      )}

                    {/* Registration notice */}
                    <Alert>
                      <AlertDescription>
                        {emailVerified
                          ? "Your email has been verified. You can now create your account."
                          : "Please complete all steps to create your account."}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending || !emailVerified}
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
            <p className="text-xl mb-8">
              Build beautiful portfolio websites in minutes with our easy-to-use
              platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Professional Templates</h3>
                  <p className="text-white/80">
                    Choose from a variety of beautiful, responsive templates.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Easy Customization</h3>
                  <p className="text-white/80">
                    Personalize colors, content, and layout with a few clicks.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Instant Download</h3>
                  <p className="text-white/80">
                    Get your portfolio website ready to host in minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          open={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          otpCode={generatedOTP}
          onVerify={handleVerifyOTP}
          isVerifying={isVerifyingOTP}
        />
      )}
    </>
  );
}
