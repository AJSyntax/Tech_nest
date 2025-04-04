import { pgTable, text, serial, integer, json, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // Can be "user" or "admin"
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  templateId: text("template_id").notNull(),
  personalInfo: json("personal_info").notNull(),
  skills: json("skills").notNull(),
  projects: json("projects").notNull(),
  education: json("education").notNull(),
  colorScheme: json("color_scheme").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isPublished: boolean("is_published").notNull().default(false),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  price: integer("price").default(0), // Price in cents, 0 for free templates
  category: text("category").notNull(),
  popularity: integer("popularity").notNull().default(0),
  htmlContent: text("html_content"), // HTML template content
  cssContent: text("css_content"), // CSS content for the template
  jsContent: text("js_content"), // JavaScript content for the template
  createdBy: integer("created_by").references(() => users.id), // Admin who created the template
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  headline: z.string().min(1, "Headline is required"),
  about: z.string().min(1, "About section is required"),
  profilePhotoUrl: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  socialLinks: z.array(
    z.object({
      platform: z.string(),
      url: z.string().url("Invalid URL")
    })
  ).optional()
});

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  proficiency: z.number().min(1).max(5),
  category: z.string().optional()
});

export const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  technologies: z.array(z.string()),
  imageUrl: z.string().optional(),
  liveUrl: z.string().url("Invalid URL").optional(),
  codeUrl: z.string().url("Invalid URL").optional()
});

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().optional()
});

export const colorSchemeSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string()
});

export const portfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required"),
  templateId: z.string().min(1, "Template is required"),
  personalInfo: personalInfoSchema,
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  education: z.array(educationSchema),
  colorScheme: colorSchemeSchema,
  isPublished: z.boolean().default(false)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  popularity: true,
  createdAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ColorScheme = z.infer<typeof colorSchemeSchema>;
