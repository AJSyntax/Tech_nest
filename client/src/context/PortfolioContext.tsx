import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  PortfolioFormData,
  DevicePreviewType
} from "@/types/portfolio";
import { personalInfoSchema, skillSchema, projectSchema, educationSchema, colorSchemeSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PortfolioContextType {
  portfolio: PortfolioFormData;
  currentStep: number;
  device: DevicePreviewType;
  isTemplateModalOpen: boolean;
  isExportModalOpen: boolean;
  updatePortfolio: (data: Partial<PortfolioFormData>) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDevice: (device: DevicePreviewType) => void;
  openTemplateModal: () => void;
  closeTemplateModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  resetPortfolio: () => void;
  savePortfolio: (id?: string) => Promise<number | undefined>; // Accept optional ID
  loadPortfolio: (id: number) => Promise<void>;
}

const defaultColorScheme = {
  primary: "#3b82f6",
  secondary: "#4f46e5",
  accent: "#8b5cf6",
  background: "#ffffff",
  text: "#1e293b"
};

const defaultPortfolio: PortfolioFormData = {
  name: "My Portfolio",
  templateId: "1",
  personalInfo: {
    firstName: "",
    lastName: "",
    headline: "",
    about: "",
    email: "",
    phone: "",
    socialLinks: []
  },
  skills: [],
  projects: [],
  education: [],
  colorScheme: defaultColorScheme,
  isPublished: false
};

const defaultDevices: DevicePreviewType[] = [
  {
    name: "mobile",
    icon: <></>,
    width: "320px"
  },
  {
    name: "tablet",
    icon: <></>,
    width: "768px"
  },
  {
    name: "desktop",
    icon: <></>,
    width: "100%"
  }
];

import { deepmerge } from 'deepmerge-ts'; // Import deepmerge

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Define props for PortfolioProvider, including optional initialData
interface PortfolioProviderProps {
  children: React.ReactNode;
  initialData?: PortfolioFormData;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children, initialData }) => {
  // Initialize state: Use initialData if provided, otherwise use defaultPortfolio
  // Deep merge initialData with defaultPortfolio to ensure all fields are present
  const [portfolio, setPortfolio] = useState<PortfolioFormData>(
    initialData ? deepmerge(defaultPortfolio, initialData) : defaultPortfolio
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [device, setDevice] = useState<DevicePreviewType>(defaultDevices[2]); // Default to desktop
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { toast } = useToast();

  // Save to localStorage whenever portfolio changes (keep this)
  useEffect(() => {
    // Only save if not initializing with initialData to avoid overwriting fetched data immediately
    if (!initialData) {
       localStorage.setItem("technest_portfolio_draft", JSON.stringify(portfolio));
    }
  }, [portfolio, initialData]);

  // Effect to update state if initialData changes (e.g., navigating between edit pages)
  useEffect(() => {
    if (initialData) {
      setPortfolio(deepmerge(defaultPortfolio, initialData));
      // Optionally reset step if needed when loading new data
      // setCurrentStep(0);
    } else {
      // Reset to default if navigating from edit to create
      // Consider if loading from localStorage is desired here for create drafts
       const savedPortfolio = localStorage.getItem("technest_portfolio_draft");
       if (savedPortfolio) {
         try {
           setPortfolio(JSON.parse(savedPortfolio));
         } catch (e) {
           console.error("Failed to parse saved portfolio:", e);
           setPortfolio(defaultPortfolio); // Fallback to default if parse fails
         }
       } else {
         setPortfolio(defaultPortfolio);
       }
     }
   }, [initialData]);

  // This is the correct updatePortfolio function
  const updatePortfolio = (data: Partial<PortfolioFormData>) => {
    setPortfolio(prev => ({
      ...prev,
      // Note: The localStorage update is handled by the useEffect hook above
      ...data
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const openTemplateModal = () => setIsTemplateModalOpen(true);
  const closeTemplateModal = () => setIsTemplateModalOpen(false);
  
  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  const resetPortfolio = () => {
    setPortfolio(defaultPortfolio);
    setCurrentStep(0);
    localStorage.removeItem("technest_portfolio_draft");
  };

  const validatePortfolio = (): boolean => {
    try {
      personalInfoSchema.parse(portfolio.personalInfo);
      portfolio.skills.forEach(skill => skillSchema.parse(skill));
      portfolio.projects.forEach(project => projectSchema.parse(project));
      portfolio.education.forEach(education => educationSchema.parse(education));
      colorSchemeSchema.parse(portfolio.colorScheme);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Modify savePortfolio to accept optional ID and handle PUT requests for updates
  const savePortfolio = async (id?: string): Promise<number | undefined> => {
    if (!validatePortfolio()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before saving",
        variant: "destructive"
      });
      return;
    }

    const isUpdating = !!id;
    const url = isUpdating ? `/api/portfolios/${id}` : "/api/portfolios";
    const method = isUpdating ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portfolio)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedPortfolio = await response.json();

      toast({
        title: "Success!",
        description: `Your portfolio has been ${isUpdating ? 'updated' : 'saved'}`,
      });

      // Clear local storage draft after successful save/update
      localStorage.removeItem("technest_portfolio_draft");

      return savedPortfolio.id; // Assuming API returns the portfolio with ID
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isUpdating ? 'update' : 'save'} portfolio`,
        variant: "destructive",
      });
    }
  };

  const loadPortfolio = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/portfolios/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const loadedPortfolio = await response.json();
      setPortfolio(loadedPortfolio);
      
      toast({
        title: "Portfolio Loaded",
        description: "Successfully loaded your portfolio"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load portfolio",
        variant: "destructive"
      });
    }
  };

  return (
    <PortfolioContext.Provider value={{
      portfolio,
      currentStep,
      device,
      isTemplateModalOpen,
      isExportModalOpen,
      updatePortfolio,
      setCurrentStep,
      nextStep,
      prevStep,
      setDevice,
      openTemplateModal,
      closeTemplateModal,
      openExportModal,
      closeExportModal,
      resetPortfolio,
      savePortfolio,
      loadPortfolio
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
