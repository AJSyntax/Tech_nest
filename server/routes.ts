import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { portfolioSchema, insertUserSchema, insertTemplateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, hashPassword } from "./auth";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
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
  apiRouter.get("/user/portfolios", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const portfolios = await storage.getPortfoliosByUserId(req.user.id);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user portfolios" });
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
      
      // Validate the portfolio data
      const validatedData = portfolioSchema.parse(req.body);
      
      // Create the portfolio with authenticated user's ID
      const portfolio = await storage.createPortfolio({
        ...validatedData,
        userId: req.user.id
      });
      
      // Increment the template popularity
      await storage.incrementTemplatePopularity(parseInt(portfolio.templateId));
      
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
      
      const success = await storage.deletePortfolio(id);
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
      
      // For this demo, we'll implement a simple update by deleting and recreating
      // In a real app, we would need proper update methods in the storage interface
      
      // Since we don't have an update method, we'll simulate by creating a new template
      // with the same ID. This is obviously not ideal but works for demonstration.
      // This technique should NOT be used in production!
      const updatedTemplate = await storage.createTemplate({
        ...validatedData,
        createdBy: existingTemplate.createdBy
      });
      
      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  apiRouter.get("/admin/users", isAdmin, async (req, res) => {
    try {
      // In a real app, we would add a method to storage to get all users
      // For now, we just return an empty array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Using hashPassword imported at the top of the file

  // Create admin and regular user accounts if they don't exist
  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      const hashedPassword = await hashPassword("adminpassword");
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        role: "admin"
      });
      console.log("Admin user created");
    }

    const demoUser = await storage.getUserByUsername("user");
    if (!demoUser) {
      const hashedPassword = await hashPassword("userpassword");
      await storage.createUser({
        username: "user",
        password: hashedPassword,
        role: "user"
      });
      console.log("Demo user created");
    }
  } catch (error) {
    console.error("Error creating default users:", error);
  }

  // Register all API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
