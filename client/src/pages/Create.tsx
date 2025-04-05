import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePortfolio } from "@/context/PortfolioContext";
import FormNavigation from "@/components/builder/FormNavigation";
import LivePreview from "@/components/builder/LivePreview";
import PersonalInfoForm from "@/components/builder/PersonalInfoForm";
import SkillsForm from "@/components/builder/SkillsForm";
import ProjectsForm from "@/components/builder/ProjectsForm";
import EducationForm from "@/components/builder/EducationForm";
import ColorSchemeForm from "@/components/builder/ColorSchemeForm"; // Import the correct component
import TemplateSelectionModal from "@/components/modals/TemplateSelectionModal";
import ExportModal from "@/components/modals/ExportModal";
import { FormStep } from "@/types/portfolio";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { useSearch } from "wouter";
// Remove unused imports related to global buttons
// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Restore this import

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

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // If a template ID is in the URL, update the portfolio (only if not editing)
  useEffect(() => {
    if (!portfolioId && templateIdParam && templates) { // Check if not editing
      const selectedTemplate = templates.find(t => t.id.toString() === templateIdParam);
      if (selectedTemplate) {
        updatePortfolio({ templateId: selectedTemplate.id.toString() });
      }
    }
  }, [portfolioId, templateIdParam, templates, updatePortfolio]);

  // Define handleSave here, to be passed ONLY to ColorSchemeForm
  const handleSave = async () => {
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
