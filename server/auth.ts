import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3"; // Import connect-sqlite3
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage"; // storage is now SqliteStorage, but we don't need its sessionStore anymore
import { User as SelectUser, userRegistrationSchema, passwordSchema } from "@shared/schema";
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
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    resave: true,
    saveUninitialized: true,
    store: sessionStore as session.Store, // Cast to session.Store to resolve type mismatch
    cookie: {
      secure: false, // Set to false for development, even in production since we're not using HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
      httpOnly: true,
      sameSite: 'lax',
      path: '/' // Ensure cookie is sent for all paths
    },
    name: 'technest.sid' // Custom name to avoid conflicts
  };

  // Log session store setup
  console.log('Session store initialized');

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

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate registration data
      try {
        userRegistrationSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
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
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate verification token
      const verificationToken = generateToken();
      const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

      // Generate OTP code
      const otpCode = generateOTP();
      const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now

      // Hash password and create new user
      const hashedPassword = await hashPassword(req.body.password);
      const hashedSecretAnswer = await hashPassword(req.body.secretAnswer);

      const user = await storage.createUser({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        secretQuestion: req.body.secretQuestion,
        secretAnswer: hashedSecretAnswer,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        role: "user", // Force role to be 'user' for security
        otpCode,
        otpExpiry
      });

      // Send verification email (keeping this for backup verification method)
      try {
        await sendVerificationEmail(req.body.email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      // Return the user data with OTP code (but without sensitive data)
      const { password, secretAnswer, verificationToken: vt, ...userWithoutSensitiveData } = user;
      res.status(201).json({
        ...userWithoutSensitiveData,
        otpCode, // Include OTP code in response
        message: "User registered successfully"
      });
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
      const isAnswerCorrect = await comparePasswords(secretAnswer, user.secretAnswer);

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
    console.log('Login attempt for username:', req.body.username);

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err: Error | null) => {
        if (err) {
          console.error('Session login error:', err);
          return next(err);
        }

        console.log('User logged in successfully. Session ID:', req.sessionID);
        console.log('Session cookie set:', !!req.session);

        // Save the session explicitly to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return next(err);
          }

          // Return user data without sensitive information
          const { password, secretAnswer, ...safeUser } = user as any;
          res.json(safeUser);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('Logout request received. Session ID:', req.sessionID);

    if (!req.isAuthenticated()) {
      console.log('User already logged out');
      return res.sendStatus(200);
    }

    const userId = req.user?.id;
    console.log('Logging out user ID:', userId);

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }

      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return next(err);
        }

        console.log('User logged out and session destroyed');
        res.clearCookie('technest.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('GET /api/user - Auth status:', req.isAuthenticated());
    console.log('Session ID:', req.sessionID);

    if (!req.isAuthenticated() || !req.user) {
      console.log('User not authenticated');
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log('Returning user data for ID:', req.user.id);

    // Return user data without sensitive information
    const { password, secretAnswer, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  // Get security question for a user by email (for password reset)
  // Generate new OTP code
  app.post("/api/generate-otp", async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new OTP code
      const otpCode = generateOTP();
      const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now

      // Update user with new OTP
      await storage.updateUser(user.id, {
        otpCode,
        otpExpiry
      });

      return res.status(200).json({
        message: "OTP generated successfully",
        otpCode
      });
    } catch (error) {
      next(error);
    }
  });

  // Verify OTP code
  app.post("/api/verify-otp", async (req, res, next) => {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({ message: "Email and OTP code are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if OTP matches
      if (user.otpCode !== otpCode) {
        return res.status(400).json({ message: "Invalid OTP code" });
      }

      // Check if OTP is expired
      if (!user.otpExpiry || user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: "OTP code has expired" });
      }

      // Mark email as verified and clear OTP
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        otpCode: null,
        otpExpiry: null
      });

      // Auto-login the user after verification
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without sensitive data
        const { password, secretAnswer, verificationToken, ...userWithoutSensitiveData } = user;
        res.status(200).json({
          message: "Email verified successfully",
          user: userWithoutSensitiveData
        });
      });
    } catch (error) {
      next(error);
    }
  });

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
