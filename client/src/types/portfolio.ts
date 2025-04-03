import { 
  PersonalInfo, 
  Skill, 
  Project, 
  Education, 
  ColorScheme, 
  Template
} from "@shared/schema";

export interface PortfolioFormData {
  name: string;
  templateId: string;
  personalInfo: PersonalInfo;
  skills: Skill[];
  projects: Project[];
  education: Education[];
  colorScheme: ColorScheme;
  isPublished: boolean;
}

export interface DevicePreviewType {
  name: string;
  icon: React.ReactNode;
  width: string;
}

export interface TemplateFilters {
  category: string;
  pricing: string;
  sortBy: string;
}

export interface PortfolioResponse {
  id: number;
  userId: number;
  name: string;
  templateId: string;
  personalInfo: PersonalInfo;
  skills: Skill[];
  projects: Project[];
  education: Education[];
  colorScheme: ColorScheme;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: React.ReactNode;
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export interface TemplatePreviewProps {
  template: Template;
  onSelect: (template: Template) => void;
}
