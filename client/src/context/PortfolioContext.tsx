import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Re-add React Query hooks
import {
  PortfolioFormData,
  DevicePreviewType
} from "@/types/portfolio";
import { personalInfoSchema, skillSchema, projectSchema, educationSchema, colorSchemeSchema, Portfolio } from "@shared/schema"; // Re-add Portfolio type import
import { useToast } from "@/hooks/use-toast";
import { ZodError } from "zod"; // Import ZodError
import { fromZodError } from "zod-validation-error"; // Import formatter
import { apiRequest } from "@/lib/api-request"; // Import apiRequest helper

// Define structure for validation result
interface ValidationResult {
  success: boolean;
  stepIndex?: number;
  stepName?: string;
  error?: ZodError;
}

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
  const queryClient = useQueryClient(); // Re-add query client instance

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

  // Enhanced validation function
  const validatePortfolio = (): ValidationResult => {
    // Map step names to their validation logic and index
    const validationSteps = [
      { name: "Personal Info", schema: personalInfoSchema, data: portfolio.personalInfo, index: 0 },
      { name: "Skills", schema: skillSchema, data: portfolio.skills, index: 1, isArray: true },
      { name: "Projects", schema: projectSchema, data: portfolio.projects, index: 2, isArray: true },
      { name: "Education", schema: educationSchema, data: portfolio.education, index: 3, isArray: true },
      { name: "Design", schema: colorSchemeSchema, data: portfolio.colorScheme, index: 4 },
    ];

    for (const step of validationSteps) {
      if (step.isArray) {
        // Validate each item in the array
        for (const item of step.data as any[]) {
           const result = step.schema.safeParse(item);
           if (!result.success) {
             return { success: false, stepIndex: step.index, stepName: step.name, error: result.error };
           }
        }
      } else {
         // Validate single object
         const result = step.schema.safeParse(step.data);
         if (!result.success) {
           return { success: false, stepIndex: step.index, stepName: step.name, error: result.error };
         }
      }
    }

    return { success: true }; // All validations passed
  };

  // Define the mutation for saving/updating portfolio (Re-introducing)
  const savePortfolioMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: PortfolioFormData }): Promise<Portfolio> => {
      const isUpdating = !!id;
      const url = isUpdating ? `/api/portfolios/${id}` : "/api/portfolios";
      const method = isUpdating ? "PUT" : "POST";

      console.log(`${method} request to ${url} with data:`, data);
      console.log('templateId type:', typeof data.templateId, 'value:', data.templateId);

      // Use apiRequest which handles non-OK responses by throwing an error
      const response = await apiRequest(method, url, data);
      const result = await response.json();
      console.log('Response:', result);
      return result;
    },
    onSuccess: (_, { id }) => {
      const isUpdating = !!id;
      toast({
        title: "Success!",
        description: `Your portfolio has been ${isUpdating ? 'updated' : 'saved'}`,
      });
      // Invalidate the user's portfolio list query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/portfolios'] });
      // Optionally invalidate the specific portfolio query if editing
      if (isUpdating) {
        queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${id}`] });
      }
      // DO NOT clear local storage draft here - allow users to save progress
      // localStorage.removeItem("technest_portfolio_draft");
    },
    onError: (error: any, { id }) => {
      const isUpdating = !!id;

      // Check if this is a template not found error
      if (error.status === 404 && error.data?.message === "Template not found") {
        toast({
          title: "Template Not Found",
          description: error.data?.details || "Please select a valid template before saving your portfolio.",
          variant: "destructive",
        });
        // Open template selection modal to help user fix the issue
        openTemplateModal();
      } else {
        toast({
          title: "Error",
          description: `Failed to ${isUpdating ? 'update' : 'save'} portfolio: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    },
  });

  // Modify savePortfolio function to use the mutation (Re-introducing)
  const savePortfolio = async (id?: string): Promise<number | undefined> => {
    // --- VALIDATION DISABLED FOR TESTING ---
    /*
    const validationResult = validatePortfolio(); // Validation is ACTIVE

    if (!validationResult.success) { // Check if validation failed
      const { stepIndex, stepName, error } = validationResult;
      const formattedError = error ? fromZodError(error) : { message: "Unknown validation error" };

      toast({
        title: `Validation Error on Step ${stepIndex! + 1}: ${stepName}`,
        description: formattedError.message, // Use formatted Zod error message
        variant: "destructive",
      });
      // Navigate user to the step with the error
      if (stepIndex !== undefined) {
        setCurrentStep(stepIndex);
      }
      return; // Stop the save process
    }
    */
    // --- END VALIDATION DISABLED ---

    // Call the mutation (Re-introducing)
    try {
      // Create a copy of the portfolio data to ensure we don't modify the original state
      const portfolioData = { ...portfolio };

      // Ensure templateId is a string (server expects string)
      if (portfolioData.templateId) {
        portfolioData.templateId = String(portfolioData.templateId);
      }

      console.log('Saving portfolio with data:', portfolioData);

      const savedPortfolio = await savePortfolioMutation.mutateAsync({ id, data: portfolioData });
      return savedPortfolio.id; // Return the ID from the mutation result
    } catch (error) {
      // Error handling is done within the mutation's onError callback
      console.error("Save portfolio mutation failed:", error);
      return undefined; // Indicate failure
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
