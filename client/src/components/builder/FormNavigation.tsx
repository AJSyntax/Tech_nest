import { FormStep } from "@/types/portfolio";
import { Progress } from "@/components/ui/progress";

interface FormNavigationProps {
  steps: FormStep[];
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({ 
  steps, 
  currentStep, 
  onSelectStep 
}) => {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-medium">
            {currentStep + 1}
          </div>
          <div className="ml-4">
            <span className="text-sm font-medium text-primary-600">
              {steps[currentStep].title}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {steps[currentStep].description}
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="text-sm text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
        <div className="mt-4 relative">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                idx < currentStep
                  ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                  : idx === currentStep
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormNavigation;
