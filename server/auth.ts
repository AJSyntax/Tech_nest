import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3"; // Import connect-sqlite3
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage"; // storage is now SqliteStorage, but we don't need its sessionStore anymore
import { User as SelectUser, userRegistrationSchema, passwordSchema, otpVerificationSchema } from "@shared/schema";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Initialize SQLite session store
const SQLiteStore = connectSqlite3(session);
const sessionStore = new SQLiteStore({
  db: "database.sqlite", // Use the same database file
  dir: ".", // Specify the directory for the database file
  table: "sessions" // Optional: specify table name for sessions
});

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Configure nodemailer with Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "524b707a0ae656",
    pass: process.env.MAILTRAP_PASS || "186c1e343b1195"
  }
});

// Generate a random token for email verification or password reset
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate a 6-digit OTP code
export function generateOTP(): string {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if OTP is valid and not expired
export function isOTPValid(storedOTP: string | null, storedExpiry: number | null, providedOTP: string): boolean {
  if (!storedOTP || !storedExpiry) {
    return false;
  }

  // Check if OTP has expired
  if (Date.now() > storedExpiry) {
    return false;
  }

  // Check if OTP matches
  return storedOTP === providedOTP;
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `http://localhost:5000/verify-email?token=${token}`;

  const mailOptions = {
    from: '"TechNest" <technest@example.com>',
    to: email,
    subject: 'Verify your TechNest account',
    html: `
      <h1>Welcome to TechNest!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account, you can ignore this email.</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `http://localhost:5000/reset-password?token=${token}`;

  const mailOptions = {
    from: '"TechNest" <technest@example.com>',
    to: email,
    subject: 'Reset your TechNest password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request a password reset, you can ignore this email.</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Format: <hashed>.<salt>
    const [hashed, salt] = stored.split(".");

    // If we don't have both parts, it's not in our format
    if (!hashed || !salt) {
      console.log("Invalid password format, cannot compare");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Validate password complexity
export function validatePasswordComplexity(password: string): { isValid: boolean; errors: string[] } {
  try {
    passwordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return {
        isValid: false,
        errors: validationError.details.map(detail => detail.message)
      };
    }
    return { isValid: false, errors: ['Invalid password'] };
  }
}

export function setupAuth(app: Express) {
  // Session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "technest-session-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore as session.Store, // Cast to session.Store to resolve type mismatch
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Generate OTP endpoint
  app.post("/api/generate-otp", async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate OTP
      const otpCode = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

      // Store OTP temporarily (we'll associate it with the user during registration)
      // We're using email as a key to store the OTP
      const tempUser = await storage.getUserByEmail(email);
      if (tempUser) {
        await storage.updateUser(tempUser.id, {
          otpCode,
          otpExpiry
        });
      } else {
        // Create a temporary user entry with just email and OTP
        await storage.createTempUser(email, otpCode, otpExpiry);
      }

      // Return the OTP (in a real app, you would send this via email or SMS)
      res.status(200).json({
        message: "OTP generated successfully",
        otpCode, // Only for demo purposes - in production, don't send this back to client
        expiresIn: "10 minutes"
      });
    } catch (error) {
      next(error);
    }
  });

  // Verify OTP endpoint
  app.post("/api/verify-otp", async (req, res, next) => {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      // Find temp user by email
      const tempUser = await storage.getUserByEmail(email);

      if (!tempUser) {
        return res.status(400).json({ message: "Invalid email or OTP" });
      }

      // Verify OTP
      if (!isOTPValid(tempUser.otpCode, tempUser.otpExpiry, otpCode)) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // OTP is valid
      res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request body:", JSON.stringify(req.body));

      // Validate registration data
      try {
        // Make sure otpCode is included in the request
        if (!req.body.otpCode) {
          console.log("OTP code missing in request");
          return res.status(400).json({
            message: "Validation failed",
            errors: ["OTP verification is required"]
          });
        }

        try {
          userRegistrationSchema.parse(req.body);
          console.log("Schema validation passed");
        } catch (zodError) {
          console.log("Schema validation failed:", zodError);
          throw zodError;
        }
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          console.log("Validation error details:", validationError.details);
          return res.status(400).json({
            message: "Validation failed",
            errors: validationError.details.map(detail => detail.message)
          });
        }
        throw error;
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail && existingEmail.username && existingEmail.username.indexOf('temp_') !== 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Verify OTP if provided
      if (req.body.otpCode) {
        // Check if OTP is valid
        if (!existingEmail || !isOTPValid(existingEmail.otpCode, existingEmail.otpExpiry, req.body.otpCode)) {
          return res.status(400).json({ message: "Invalid or expired OTP" });
        }
      } else {
        return res.status(400).json({ message: "OTP verification is required" });
      }

      // We don't need verification token since we're using OTP

      // Hash password and create new user
      const hashedPassword = await hashPassword(req.body.password);
      const hashedSecretAnswer = await hashPassword(req.body.secretAnswer);

      // If we have a temporary user with just email and OTP, update it
      // Otherwise create a new user
      let user;
      if (existingEmail) {
        user = await storage.updateUser(existingEmail.id, {
          username: req.body.username,
          password: hashedPassword,
          secretQuestion: req.body.secretQuestion,
          secretAnswer: hashedSecretAnswer,
          otpCode: null, // Clear OTP after successful verification
          otpExpiry: null,
          role: "user"
        });

        // Update isEmailVerified separately to avoid TypeScript errors
        await storage.updateUser(existingEmail.id, {
          isEmailVerified: true // Since we verified with OTP
        });
      } else {
        user = await storage.createUser({
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
          secretQuestion: req.body.secretQuestion,
          secretAnswer: hashedSecretAnswer,
          role: "user", // Force role to be 'user' for security
        });

        // Update isEmailVerified separately
        if (user) {
          await storage.updateUser(user.id, {
            isEmailVerified: true // Since we verified with OTP
          });
        }
      }

      // Auto-login the user after registration
      if (user) {
        req.login(user, (err) => {
          if (err) return next(err);
          // Return user without sensitive data
          const { password, secretAnswer, verificationToken, ...userWithoutSensitiveData } = user as any;
          res.status(201).json(userWithoutSensitiveData);
        });
      } else {
        return res.status(500).json({ message: "Failed to create user" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      // Find user with this token
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < Date.now()) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Mark email as verified and clear token
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });

      return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal that the email doesn't exist for security reasons
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }

      // Generate reset token
      const resetToken = generateToken();
      const tokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour from now

      // Save token to user
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry: tokenExpiry
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }

      return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
    } catch (error) {
      next(error);
    }
  });

  // Verify secret answer endpoint
  app.post("/api/verify-secret-answer", async (req, res, next) => {
    try {
      const { email, secretAnswer } = req.body;

      if (!email || !secretAnswer) {
        return res.status(400).json({ message: "Email and secret answer are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(400).json({ message: "Invalid email" });
      }

      // Compare secret answer
      const isAnswerCorrect = secretAnswer && user.secretAnswer ?
        await comparePasswords(secretAnswer, user.secretAnswer) : false;

      if (!isAnswerCorrect) {
        return res.status(400).json({ message: "Incorrect secret answer" });
      }

      // Generate reset token
      const resetToken = generateToken();
      const tokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour from now

      // Save token to user
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry: tokenExpiry
      });

      return res.status(200).json({
        message: "Secret answer verified",
        resetToken
      });
    } catch (error) {
      next(error);
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        return res.status(400).json({ message: "Token, password and confirmation are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Validate password complexity
      const { isValid, errors } = validatePasswordComplexity(password);
      if (!isValid) {
        return res.status(400).json({ message: "Password does not meet requirements", errors });
      }

      // Find user with this token
      const user = await storage.getUserByResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user password and clear token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Get security question for a user by email (for password reset)
  app.get("/api/user-question", async (req, res, next) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return only the security question, not the answer
      return res.status(200).json({
        secretQuestion: user.secretQuestion
      });
    } catch (error) {
      next(error);
    }
  });
}
