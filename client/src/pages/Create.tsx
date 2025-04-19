import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePortfolio } from "@/context/PortfolioContext";
import FormNavigation from "@/components/builder/FormNavigation";
import LivePreview from "@/components/builder/LivePreview";
import PersonalInfoForm from "@/components/builder/PersonalInfoForm";
import SkillsForm from "@/components/builder/SkillsForm";
import ProjectsForm from "@/components/builder/ProjectsForm";
import EducationForm from "@/components/builder/EducationForm";
import ColorSchemeForm from "@/components/builder/ColorSchemeForm";
import TemplateSelectionModal from "@/components/modals/TemplateSelectionModal";
import ExportModal from "@/components/modals/ExportModal";
import { FormStep } from "@/types/portfolio";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api-request";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define props for the Create component
interface CreateProps {
  portfolioId?: string; // Optional ID for edit mode
}

const Create: React.FC<CreateProps> = ({ portfolioId }) => { // Accept portfolioId prop
  const {
    portfolio,
    currentStep,
    isTemplateModalOpen,
    isExportModalOpen,
    setCurrentStep,
    openTemplateModal,
    closeTemplateModal,
    updatePortfolio,
    savePortfolio, // Keep this, it's used by handleFinish (which we might remove later)
    closeExportModal,
    // Remove context items only needed for global buttons
    // prevStep,
    // nextStep,
    // openExportModal
  } = usePortfolio();
  const { toast } = useToast(); // Add useToast back

  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const templateIdParam = searchParams.get("template");
  const trialParam = searchParams.get("trial");

  // State for premium template handling
  const [isPremiumTemplate, setIsPremiumTemplate] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const { user } = useAuth();

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // If a template ID is in the URL, update the portfolio (only if not editing)
  useEffect(() => {
    if (!portfolioId && templateIdParam && templates) { // Check if not editing
      const selectedTemplate = templates.find(t => t.id.toString() === templateIdParam);
      if (selectedTemplate) {
        updatePortfolio({ templateId: selectedTemplate.id.toString() });

        // Check if it's a premium template
        if (selectedTemplate.isPremium) {
          setIsPremiumTemplate(true);

          // Check if this is a trial
          if (trialParam === 'true') {
            setIsTrial(true);
          }
        }
      }
    }
  }, [portfolioId, templateIdParam, templates, updatePortfolio, trialParam]);

  // Check if user has purchased this template
  const { data: userPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/user/template-purchases"],
    enabled: !!user && isPremiumTemplate, // Only run if user is logged in and template is premium
  });

  // Update isPurchased state when userPurchases data changes
  useEffect(() => {
    if (userPurchases.length > 0 && templateIdParam) {
      const templateId = parseInt(templateIdParam);
      const purchase = userPurchases.find(
        (p) => p.templateId === templateId && p.status === "approved"
      );
      setIsPurchased(!!purchase);
    }
  }, [userPurchases, templateIdParam]);

  // Mutation for creating a template purchase request
  const purchaseMutation = useMutation({
    mutationFn: async (templateId: number) => {
      if (!user?.id) {
        throw new Error("You must be logged in to purchase templates");
      }

      console.log('Submitting purchase request:', {
        userId: user.id,
        templateId,
        portfolioId: portfolioId ? parseInt(portfolioId) : undefined
      });

      return apiRequest('POST', '/api/template-purchases', {
        userId: user.id,
        templateId,
        portfolioId: portfolioId ? parseInt(portfolioId) : undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Purchase Request Submitted",
        description: "Your purchase request has been submitted for admin approval."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Request Failed",
        description: error.message || "Failed to submit purchase request",
        variant: "destructive"
      });
    }
  });

  // Define handleSave here, to be passed ONLY to ColorSchemeForm
  const handleSave = async () => {
    // Check if a template has been selected
    if (!portfolio.templateId) {
      toast({
        title: "No Template Selected",
        description: "Please select a template before saving your portfolio.",
        variant: "destructive"
      });
      openTemplateModal();
      return;
    }

    const savedId = await savePortfolio(portfolioId);
    // Add toast notification here
    if (savedId) {
      toast({
        title: "Progress Saved",
        description: "Your portfolio draft has been saved.",
      });
      // Optionally update the URL if creating a new portfolio and it now has an ID
      if (!portfolioId && savedId) {
        setLocation(`/edit/${savedId}`, { replace: true });
      }
    }
  };


  const steps: FormStep[] = [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Basic info about you",
      component: <PersonalInfoForm />
    },
    {
      id: "skills",
      title: "Skills & Technologies",
      description: "Showcase your expertise",
      component: <SkillsForm />
    },
    {
      id: "projects",
      title: "Projects",
      description: "Highlight your work",
      component: <ProjectsForm />
    },
    {
      id: "education",
      title: "Education & Experience",
      description: "Your academic and work history",
      component: <EducationForm />
    },
    {
      id: "design",
      title: "Design Customization",
      description: "Make it your own",
      // Pass handleSave ONLY to ColorSchemeForm
      component: <ColorSchemeForm handleSave={handleSave} />
    }
  ];

  const currentStepData = steps[currentStep];

  // handleFinish is likely no longer needed if Export is separate
  // const handleFinish = async () => { ... };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container-custom py-8">
        <div className="mb-8">
          {/* Change title based on mode */}
          <h1 className="text-2xl font-bold text-slate-900">
            {portfolioId ? "Edit Your Portfolio" : "Create Your Portfolio"}
          </h1>
          <p className="text-slate-600">
            {portfolioId ? "Update your information below." : "Fill in your information to generate your professional portfolio"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Progress Steps */}
              <FormNavigation
                steps={steps}
                currentStep={currentStep}
                onSelectStep={setCurrentStep}
              />

              {/* Form Content */}
              <div className="p-6">
                {/* Premium Template Alert */}
                {isPremiumTemplate && !isPurchased && (
                  <Alert className="mb-4" variant={isTrial ? "default" : "destructive"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{isTrial ? "Trial Mode" : "Premium Template"}</AlertTitle>
                    <AlertDescription>
                      {isTrial ? (
                        "You are using this premium template in trial mode. You won't be able to export your portfolio until you purchase this template."
                      ) : (
                        "This is a premium template. You need to purchase it before you can use it."
                      )}
                      {user ? (
                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() => {
                            const templateId = parseInt(portfolio.templateId);
                            console.log('Purchasing template with ID:', templateId, 'Original:', portfolio.templateId);
                            purchaseMutation.mutate(templateId);
                          }}
                          disabled={purchaseMutation.isPending}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {purchaseMutation.isPending ? "Processing..." : "Purchase Template"}
                        </Button>
                      ) : (
                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() => setLocation("/login")}
                        >
                          Login to Purchase
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Render the component for the current step */}
                {currentStepData.component}
              </div>
              {/* No Global Navigation Buttons Here */}
            </div>
          </div>

          {/* Preview Section (1/3 width on large screens) */}
          <div className="hidden lg:block">
            <LivePreview
              portfolio={portfolio}
              onSelectTemplate={openTemplateModal}
              isPremiumTemplate={isPremiumTemplate}
              isPurchased={isPurchased}
            />
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <TemplateSelectionModal onClose={closeTemplateModal} />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal onClose={closeExportModal} />
      )}
    </div>
  );
};

export default Create;
