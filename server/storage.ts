import {
  users, type User, type InsertUser,
  portfolios, type Portfolio, type InsertPortfolio,
  templates, type Template, type InsertTemplate,
  templatePurchases, type TemplatePurchase, type InsertTemplatePurchase
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import session from "express-session";
// We will replace this later with connect-sqlite3
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>; // Added for admin functionality

  // Portfolio operations
  getPortfolio(id: number): Promise<Portfolio | undefined>;
  getPortfoliosByUserId(userId: number): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: number, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: number): Promise<boolean>;

  // Template operations
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  getFreeTemplates(): Promise<Template[]>;
  getPremiumTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, templateData: Partial<InsertTemplate>): Promise<Template | undefined>; // Added for admin functionality
  deleteTemplate(id: number): Promise<boolean>; // Added for admin functionality
  incrementTemplatePopularity(id: number): Promise<Template | undefined>;

  // Template purchase operations
  createTemplatePurchase(purchase: InsertTemplatePurchase): Promise<TemplatePurchase>;
  getTemplatePurchase(id: number): Promise<TemplatePurchase | undefined>;
  getTemplatePurchasesByUserId(userId: number): Promise<TemplatePurchase[]>;
  getTemplatePurchasesByStatus(status: string): Promise<TemplatePurchase[]>;
  updateTemplatePurchase(id: number, data: Partial<InsertTemplatePurchase>): Promise<TemplatePurchase | undefined>;
  hasUserPurchasedTemplate(userId: number, templateId: number): Promise<boolean>;

  // Session store
  sessionStore: any; // Using any for SessionStore type to avoid TypeScript errors
}

// --- Implementation using SQLite and Drizzle ---
export class SqliteStorage implements IStorage {
  sessionStore: any; // Placeholder, will be replaced

  constructor() {
    // Initialize session store (will be replaced with connect-sqlite3)
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.verificationToken, token)).get();
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.resetToken, token)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning().get();
    return result;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning()
      .get();
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).all();
  }

  // Portfolio operations
  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    return db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  }

  async getPortfoliosByUserId(userId: number): Promise<Portfolio[]> {
    try {
      // Use a simpler query to avoid schema issues
      const result = db.select({
        id: portfolios.id,
        userId: portfolios.userId,
        name: portfolios.name,
        templateId: portfolios.templateId,
        personalInfo: portfolios.personalInfo,
        skills: portfolios.skills,
        projects: portfolios.projects,
        education: portfolios.education,
        experience: portfolios.experience,
        colorScheme: portfolios.colorScheme,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
        isPublished: portfolios.isPublished
        // Omit the problematic fields
      })
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .all();

      return result as unknown as Portfolio[];
    } catch (error) {
      console.error('Error in getPortfoliosByUserId:', error);
      return [];
    }
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    try {
      // Drizzle handles createdAt/updatedAt defaults via SQL
      // Ensure we're not passing fields that don't exist in the database
      const { isPremiumTemplate, isPurchased, ...safeData } = insertPortfolio as any;

      console.log('Creating portfolio with data:', safeData);

      const result = db.insert(portfolios).values(safeData).returning().get();
      return result;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  }

  async updatePortfolio(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    // Update the updatedAt timestamp manually for SQLite
    const result = await db.update(portfolios)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(portfolios.id, id))
      .returning()
      .get();
    return result;
  }

  async deletePortfolio(id: number): Promise<boolean> {
    const result = await db.delete(portfolios).where(eq(portfolios.id, id)).run();
    return result.changes > 0;
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    return db.select().from(templates).where(eq(templates.id, id)).get();
  }

  async getAllTemplates(): Promise<Template[]> {
    return db.select().from(templates).orderBy(desc(templates.id)).all(); // Default sort by newest
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.category, category)).orderBy(desc(templates.id)).all();
  }

  async getFreeTemplates(): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.isPremium, false)).orderBy(desc(templates.id)).all();
  }

  async getPremiumTemplates(): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.isPremium, true)).orderBy(desc(templates.id)).all();
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    // Drizzle handles createdAt/popularity defaults via SQL
    const result = await db.insert(templates).values(insertTemplate).returning().get();
    return result;
  }

  async updateTemplate(id: number, templateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const result = await db.update(templates)
      .set(templateData)
      .where(eq(templates.id, id))
      .returning()
      .get();
    return result;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id)).run();
    return result.changes > 0;
  }

  async incrementTemplatePopularity(id: number): Promise<Template | undefined> {
    // Use SQL expression for atomic increment
    const result = await db.update(templates)
      .set({ popularity: sql`${templates.popularity} + 1` })
      .where(eq(templates.id, id))
      .returning()
      .get();
    return result;
  }

  // Template purchase methods
  async createTemplatePurchase(purchase: InsertTemplatePurchase): Promise<TemplatePurchase> {
    const result = await db.insert(templatePurchases).values(purchase).returning().get();
    return result;
  }

  async getTemplatePurchase(id: number): Promise<TemplatePurchase | undefined> {
    return db.select().from(templatePurchases).where(eq(templatePurchases.id, id)).get();
  }

  async getTemplatePurchasesByUserId(userId: number): Promise<TemplatePurchase[]> {
    return db.select().from(templatePurchases).where(eq(templatePurchases.userId, userId)).all();
  }

  async getTemplatePurchasesByStatus(status: string): Promise<TemplatePurchase[]> {
    return db.select().from(templatePurchases).where(eq(templatePurchases.status, status)).all();
  }

  async updateTemplatePurchase(id: number, data: Partial<InsertTemplatePurchase>): Promise<TemplatePurchase | undefined> {
    const result = await db.update(templatePurchases)
      .set(data)
      .where(eq(templatePurchases.id, id))
      .returning()
      .get();
    return result;
  }

  async hasUserPurchasedTemplate(userId: number, templateId: number): Promise<boolean> {
    const purchase = await db.select()
      .from(templatePurchases)
      .where(
        and(
          eq(templatePurchases.userId, userId),
          eq(templatePurchases.templateId, templateId),
          eq(templatePurchases.status, 'approved')
        )
      )
      .get();
    return !!purchase;
  }
}

// Export the SqliteStorage instance
export const storage = new SqliteStorage();
