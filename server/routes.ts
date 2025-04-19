import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db"; // Import db
import { eq } from "drizzle-orm"; // Import eq
import { ZodError } from "zod";
import { portfolioSchema, insertUserSchema, insertTemplateSchema, insertTemplatePurchaseSchema, users, templatePurchases, templates } from "@shared/schema"; // Import schema
import { fromZodError } from "zod-validation-error";
import { setupAuth, hashPassword } from "./auth";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  console.log('isAuthenticated middleware - Auth status:', req.isAuthenticated());
  console.log('Session ID:', req.sessionID);
  console.log('User in session:', req.user ? 'Yes' : 'No');

  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }

  res.status(403).json({ message: "Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  const apiRouter = express.Router();

  // User routes
  // Direct route without middleware for debugging
  apiRouter.get("/user/portfolios", async (req, res) => {
    try {
      console.log('GET /user/portfolios - Auth status:', req.isAuthenticated());
      console.log('Session ID:', req.sessionID);
      console.log('User in session:', req.user ? 'Yes' : 'No');

      if (!req.isAuthenticated() || !req.user) {
        console.log('No authenticated user found in request');
        return res.status(401).json({ message: "Unauthorized - Please log in again" });
      }

      console.log('Fetching portfolios for user ID:', req.user.id);

      try {
        const portfolios = await storage.getPortfoliosByUserId(req.user.id);
        console.log('Found portfolios:', portfolios.length);
        return res.json(portfolios);
      } catch (dbError: any) {
        console.error('Database error fetching portfolios:', dbError);
        return res.status(500).json({ message: "Database error: " + (dbError.message || 'Unknown error') });
      }
    } catch (error: any) {
      console.error('Error fetching user portfolios:', error);
      res.status(500).json({ message: "Failed to fetch user portfolios: " + (error.message || 'Unknown error') });
    }
  });

  // Templates routes
  apiRouter.get("/templates", async (req, res) => {
    try {
      let templates;

      const category = req.query.category as string;
      const pricing = req.query.pricing as string;
      const sortBy = req.query.sortBy as string;

      // Filter by category
      if (category && category !== "all") {
        templates = await storage.getTemplatesByCategory(category);
      } else {
        templates = await storage.getAllTemplates();
      }

      // Filter by pricing
      if (pricing === "free") {
        templates = templates.filter(t => !t.isPremium);
      } else if (pricing === "premium") {
        templates = templates.filter(t => t.isPremium);
      }

      // Sort templates
      if (sortBy === "popular") {
        templates = templates.sort((a, b) => b.popularity - a.popularity);
      } else if (sortBy === "name") {
        templates = templates.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // Default to sorting by newest (id, since higher id = newer in our implementation)
        templates = templates.sort((a, b) => b.id - a.id);
      }

      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  apiRouter.get("/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Portfolio routes
  apiRouter.post("/portfolios", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('Creating portfolio with data:', req.body);

      // Validate the portfolio data
      const validatedData = portfolioSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      // Check if the template is premium
      let templateId: number;
      try {
        templateId = parseInt(validatedData.templateId);
        console.log('Parsed templateId:', templateId, 'Original:', validatedData.templateId);

        if (isNaN(templateId)) {
          return res.status(400).json({ message: "Invalid template ID" });
        }
      } catch (error) {
        console.error('Error parsing templateId:', error);
        return res.status(400).json({ message: "Invalid template ID format" });
      }

      const template = await storage.getTemplate(templateId);
      console.log('Found template:', template ? 'Yes' : 'No');

      if (!template) {
        return res.status(404).json({
          message: "Template not found",
          details: "The selected template could not be found. Please select a different template and try again."
        });
      }

      // Set isPremiumTemplate based on the template
      const isPremiumTemplate = template.isPremium;

      // Check if the user has purchased this template if it's premium
      let isPurchased = false;
      if (isPremiumTemplate) {
        isPurchased = await storage.hasUserPurchasedTemplate(req.user.id, templateId);
      }

      // Create the portfolio with authenticated user's ID
      const portfolio = await storage.createPortfolio({
        ...validatedData,
        userId: req.user.id,
        isPremiumTemplate,
        isPurchased
      });

      // Increment the template popularity
      await storage.incrementTemplatePopularity(templateId);

      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create portfolio" });
    }
  });

  apiRouter.get("/portfolios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid portfolio ID" });
      }

      const portfolio = await storage.getPortfolio(id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // If portfolio is not published, only the owner can view it
      if (!portfolio.isPublished && (!req.isAuthenticated() || (req.user && req.user.id !== portfolio.userId))) {
        return res.status(403).json({ message: "You don't have permission to view this portfolio" });
      }

      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  apiRouter.put("/portfolios/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid portfolio ID" });
      }

      // Check if portfolio exists
      const existingPortfolio = await storage.getPortfolio(id);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user is the owner of this portfolio
      if (existingPortfolio.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this portfolio" });
      }

      // Validate the portfolio data
      const validatedData = portfolioSchema.parse(req.body);

      // Update the portfolio
      const updatedPortfolio = await storage.updatePortfolio(id, validatedData);

      res.json(updatedPortfolio);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update portfolio" });
    }
  });

  apiRouter.delete("/portfolios/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid portfolio ID" });
      }

      // Check if portfolio exists
      const existingPortfolio = await storage.getPortfolio(id);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user is the owner of this portfolio
      if (existingPortfolio.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this portfolio" });
      }

      await storage.deletePortfolio(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio" });
    }
  });

  // Admin routes
  apiRouter.post("/admin/templates", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate the template data
      const validatedData = insertTemplateSchema.parse(req.body);

      // Create the template with the admin's ID
      const template = await storage.createTemplate({
        ...validatedData,
        createdBy: req.user.id
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  apiRouter.put("/admin/templates/:id", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      // Check if template exists
      const existingTemplate = await storage.getTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Validate the template data
      const validatedData = insertTemplateSchema.parse(req.body);

      // Update the template using the new storage method
      const updatedTemplate = await storage.updateTemplate(id, validatedData);

      if (!updatedTemplate) {
        // This case might happen if the update fails for some reason,
        // though Drizzle's .returning() should handle non-existent IDs.
        return res.status(404).json({ message: "Template not found after update attempt" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  apiRouter.delete("/admin/templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      // Check if template exists before attempting delete (optional but good practice)
      const existingTemplate = await storage.getTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      const success = await storage.deleteTemplate(id);
      if (success) {
        res.status(204).send(); // No Content
      } else {
        // This might happen if the template was deleted between the check and the delete call
        res.status(404).json({ message: "Template not found or could not be deleted" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  apiRouter.get("/admin/users", isAdmin, async (_req, res) => {
    try {
      // Fetch all users using the new storage method
      const allUsers = await storage.getAllUsers();
      // Optionally filter out sensitive data like passwords before sending
      const safeUsers = allUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Using hashPassword imported at the top of the file

  // Ensure default admin and user accounts exist and are configured
  try {
    const adminUsername = "admin";
    const adminPassword = "adminpassword";
    const demoUsername = "user";
    const demoPassword = "userpassword";

    let adminUser = await storage.getUserByUsername(adminUsername);
    const hashedAdminPassword = await hashPassword(adminPassword);

    if (!adminUser) {
      // Create admin user if they don't exist
      adminUser = await storage.createUser({
        username: adminUsername,
        email: "admin@example.com", // Add required email field
        password: hashedAdminPassword,
        role: "admin"
      });
      console.log("Admin user created");
    } else {
      // If admin user exists, ensure role is admin and update password
      // This handles cases where the user might exist but with wrong role or password
      console.log("Admin user found, ensuring role and password are correct.");
      await db.update(users)
        .set({ role: "admin", password: hashedAdminPassword })
        .where(eq(users.id, adminUser.id))
        .run();
    }

    // Ensure demo user exists
    let demoUser = await storage.getUserByUsername(demoUsername);
    if (!demoUser) {
      const hashedDemoPassword = await hashPassword(demoPassword);
      await storage.createUser({
        username: demoUsername,
        email: "user@example.com", // Add required email field
        password: hashedDemoPassword,
        role: "user"
      });
      console.log("Demo user created");
    }
    // Optionally, update demo user password if needed (similar to admin)
    // else {
    //   const hashedDemoPassword = await hashPassword(demoPassword);
    //   await db.update(users).set({ password: hashedDemoPassword }).where(eq(users.id, demoUser.id)).run();
    // }

  } catch (error) {
    console.error("Error creating default users:", error);
  }

  // Template purchase routes
  apiRouter.post("/template-purchases", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('Template purchase request received:', req.body);

      // Validate the purchase data
      let validatedData;
      try {
        validatedData = insertTemplatePurchaseSchema.parse(req.body);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        if (validationError instanceof ZodError) {
          const formattedError = fromZodError(validationError);
          return res.status(400).json({ message: formattedError.message });
        }
        return res.status(400).json({ message: "Invalid purchase data" });
      }

      // Ensure the user is requesting for themselves
      if (validatedData.userId !== req.user.id) {
        console.error('User ID mismatch:', { requestedId: validatedData.userId, actualId: req.user.id });
        return res.status(403).json({ message: "You can only request purchases for yourself" });
      }

      // Check if the template exists and is premium
      const template = await storage.getTemplate(validatedData.templateId);
      if (!template) {
        console.error('Template not found:', validatedData.templateId);
        return res.status(404).json({ message: "Template not found" });
      }

      if (!template.isPremium) {
        console.error('Template is not premium:', template.id, template.name);
        return res.status(400).json({ message: "This template is free and does not require purchase" });
      }

      // Check if there's already a pending or approved purchase
      const userPurchases = await storage.getTemplatePurchasesByUserId(req.user.id);
      const existingPurchase = userPurchases.find(p =>
        p.templateId === validatedData.templateId &&
        (p.status === "pending" || p.status === "approved")
      );

      if (existingPurchase) {
        if (existingPurchase.status === "approved") {
          console.log('User already purchased this template:', existingPurchase);
          return res.status(400).json({ message: "You have already purchased this template" });
        } else {
          console.log('User already has a pending request:', existingPurchase);
          return res.status(400).json({ message: "You already have a pending purchase request for this template" });
        }
      }

      // Create the purchase request
      console.log('Creating purchase request:', validatedData);
      const purchase = await storage.createTemplatePurchase({
        ...validatedData,
        status: "pending"
      });

      console.log('Purchase request created successfully:', purchase);
      res.status(201).json(purchase);
    } catch (error) {
      console.error('Error creating purchase request:', error);
      res.status(500).json({ message: "Failed to create purchase request: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  // Get all purchase requests (admin only)
  apiRouter.get("/admin/template-purchases", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      let purchases;

      if (status) {
        purchases = await storage.getTemplatePurchasesByStatus(status);
      } else {
        // Get all purchases
        purchases = db.select()
          .from(templatePurchases)
          .all();
      }

      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase requests" });
    }
  });

  // Approve or reject a purchase request (admin only)
  apiRouter.patch("/admin/template-purchases/:id", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }

      const { status } = req.body;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      // Get the purchase request
      const purchase = await storage.getTemplatePurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      if (purchase.status !== "pending") {
        return res.status(400).json({ message: "This purchase request has already been processed" });
      }

      // Update the purchase status
      const updatedPurchase = await storage.updateTemplatePurchase(id, {
        status
      });

      // We'll handle approvedBy and approvedAt in a separate database update
      // since they're not part of the InsertTemplatePurchase type
      await db.update(templatePurchases)
        .set({
          approvedBy: req.user.id,
          approvedAt: Date.now()
        })
        .where(eq(templatePurchases.id, id))
        .run();

      // If approved, update any portfolios using this template to mark them as purchased
      if (status === "approved") {
        // If there's a specific portfolio ID in the purchase request
        if (purchase.portfolioId) {
          await storage.updatePortfolio(purchase.portfolioId, {
            isPurchased: true
          });
          console.log(`Portfolio ${purchase.portfolioId} marked as purchased`);
        }

        // Also find any other portfolios by this user with this template and mark them as purchased
        try {
          const userPortfolios = await storage.getPortfoliosByUserId(purchase.userId);
          for (const portfolio of userPortfolios) {
            if (portfolio.templateId === purchase.templateId.toString() && !portfolio.isPurchased) {
              await storage.updatePortfolio(portfolio.id, {
                isPurchased: true
              });
              console.log(`Additional portfolio ${portfolio.id} marked as purchased`);
            }
          }
        } catch (error) {
          console.error('Error updating user portfolios:', error);
        }
      }

      res.json(updatedPurchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to update purchase request" });
    }
  });

  // Get user's purchase requests
  apiRouter.get("/user/template-purchases", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const purchases = await storage.getTemplatePurchasesByUserId(req.user.id);
        res.json(purchases);
      } catch (dbError) {
        console.error('Database error fetching template purchases:', dbError);
        // Return empty array instead of error to avoid breaking the UI
        res.json([]);
      }
    } catch (error) {
      console.error('Error in template purchases route:', error);
      // Return empty array instead of error to avoid breaking the UI
      res.json([]);
    }
  });

  // Test endpoint for debugging
  apiRouter.get("/test", (req, res) => {
    res.json({
      message: "API is working",
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      timestamp: new Date().toISOString()
    });
  });

  // Test endpoint to create a portfolio for the current user
  apiRouter.post("/test/create-portfolio", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Please log in first" });
      }

      // Create a simple test portfolio
      const testPortfolio = {
        userId: req.user.id,
        templateId: "1", // Use the free template
        name: "Test Portfolio", // Required field
        personalInfo: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          headline: "Test Headline",
          about: "This is a test about section"
        }),
        skills: JSON.stringify([{ name: "Test Skill" }]),
        projects: JSON.stringify([{ title: "Test Project", description: "Test project description" }]),
        education: JSON.stringify([{ institution: "Test University", degree: "Test Degree", startDate: "2020", endDate: "2024" }]),
        experience: JSON.stringify([{ company: "Test Company", position: "Test Position", startDate: "2020", endDate: "Present", description: "Test job description" }]),
        colorScheme: JSON.stringify({ primary: "#333333", secondary: "#666666", accent: "#999999", background: "#ffffff", text: "#000000" }),
        isPublished: false
        // Removed isPremiumTemplate and isPurchased as they might not exist in the database
      };

      const portfolio = await storage.createPortfolio(testPortfolio);

      res.status(201).json({
        message: "Test portfolio created successfully",
        portfolio
      });
    } catch (error: any) {
      console.error('Error creating test portfolio:', error);
      res.status(500).json({ message: "Failed to create test portfolio: " + (error.message || 'Unknown error') });
    }
  });

  // Register all API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
