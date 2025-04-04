import { 
  users, type User, type InsertUser, 
  portfolios, type Portfolio, type InsertPortfolio,
  templates, type Template, type InsertTemplate
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  incrementTemplatePopularity(id: number): Promise<Template | undefined>;
  
  // Session store
  sessionStore: any; // Using any for SessionStore type to avoid TypeScript errors
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private templates: Map<number, Template>;
  
  private userId: number;
  private portfolioId: number;
  private templateId: number;
  sessionStore: any; // Using any for SessionStore type to avoid TypeScript errors

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.templates = new Map();
    
    this.userId = 1;
    this.portfolioId = 1;
    this.templateId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some default templates
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const defaultTemplates: InsertTemplate[] = [
      {
        name: "Minimal",
        description: "Clean, minimalist design with emphasis on content. Perfect for developers who prefer simplicity.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
        isPremium: false,
        price: 0,
        category: "Minimal",
        htmlContent: `<!DOCTYPE html><html><head><title>{{personalInfo.firstName}} {{personalInfo.lastName}} - Portfolio</title></head><body><h1>{{personalInfo.firstName}} {{personalInfo.lastName}}</h1><p>{{personalInfo.headline}}</p></body></html>`,
        cssContent: `body { font-family: Arial, sans-serif; }`,
        jsContent: null
      },
      {
        name: "Tech Stack",
        description: "Modern design highlighting your technical skills with a special focus on your development stack.",
        thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80",
        isPremium: true,
        price: 2999, // $29.99
        category: "Modern",
        htmlContent: `<!DOCTYPE html><html><head><title>{{personalInfo.firstName}} {{personalInfo.lastName}} - Tech Portfolio</title></head><body><header><h1>{{personalInfo.firstName}} {{personalInfo.lastName}}</h1><p>{{personalInfo.headline}}</p></header><section class="skills">{{#each skills}}<div class="skill">{{name}}</div>{{/each}}</section></body></html>`,
        cssContent: `body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }`,
        jsContent: `document.addEventListener('DOMContentLoaded', function() { console.log('Portfolio loaded'); });`
      },
      {
        name: "Project Showcase",
        description: "Visual portfolio with emphasis on your projects, perfect for showing off your work samples.",
        thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
        isPremium: true,
        price: 4999, // $49.99
        category: "Creative",
        htmlContent: `<!DOCTYPE html><html><head><title>{{personalInfo.firstName}} {{personalInfo.lastName}} - Projects</title></head><body><header><h1>{{personalInfo.firstName}} {{personalInfo.lastName}}</h1></header><div class="projects">{{#each projects}}<div class="project"><h3>{{title}}</h3><p>{{description}}</p></div>{{/each}}</div></body></html>`,
        cssContent: `body { font-family: 'Roboto', sans-serif; background-color: #f5f5f5; }`,
        jsContent: `document.addEventListener('DOMContentLoaded', function() { console.log('Projects loaded'); });`
      }
    ];
    
    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      // Ensure the role is set with a default value if not provided
      role: insertUser.role || "user"
    };
    this.users.set(id, user);
    return user;
  }

  // Portfolio operations
  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getPortfoliosByUserId(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      portfolio => portfolio.userId === userId
    );
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.portfolioId++;
    const now = new Date();
    const portfolio: Portfolio = { 
      ...insertPortfolio, 
      id, 
      createdAt: now, 
      updatedAt: now,
      // Ensure required properties are set with default values if not provided
      isPublished: insertPortfolio.isPublished ?? false
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolio(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) {
      return undefined;
    }
    
    const updatedPortfolio: Portfolio = {
      ...portfolio,
      ...updates,
      updatedAt: new Date()
    };
    
    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }

  async deletePortfolio(id: number): Promise<boolean> {
    return this.portfolios.delete(id);
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  async getFreeTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      template => !template.isPremium
    );
  }

  async getPremiumTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      template => template.isPremium
    );
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.templateId++;
    const now = new Date();
    const template: Template = { 
      ...insertTemplate, 
      id, 
      popularity: 0,
      // Ensure required properties are set with default values if not provided
      isPremium: insertTemplate.isPremium ?? false,
      price: insertTemplate.price ?? 0,
      htmlContent: insertTemplate.htmlContent ?? null,
      cssContent: insertTemplate.cssContent ?? null,
      jsContent: insertTemplate.jsContent ?? null,
      createdBy: insertTemplate.createdBy ?? null,
      createdAt: now
    };
    this.templates.set(id, template);
    return template;
  }

  async incrementTemplatePopularity(id: number): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) {
      return undefined;
    }
    
    const updatedTemplate: Template = {
      ...template,
      popularity: template.popularity + 1
    };
    
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }
}

export const storage = new MemStorage();
