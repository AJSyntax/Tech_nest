import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePortfolio } from "@/context/PortfolioContext";
import { Template } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface TemplateSelectionModalProps {
  onClose: () => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ onClose }) => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(
    portfolio.templateId ? parseInt(portfolio.templateId) : null
  );
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  useEffect(() => {
    if (portfolio.templateId) {
      setSelectedTemplate(parseInt(portfolio.templateId));
    }
  }, [portfolio.templateId]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      updatePortfolio({ templateId: selectedTemplate.toString() });
      onClose();
    }
  };

  const filteredTemplates = templates ? templates.filter(template => {
    if (activeTab === "all") return true;
    if (activeTab === "free") return !template.isPremium;
    if (activeTab === "premium") return template.isPremium;
    return template.category === activeTab;
  }) : [];

  // Extract unique categories from templates
  const categories = templates 
    ? Array.from(new Set(templates.map(t => t.category)))
    : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a template for your portfolio. You can customize it later.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {filteredTemplates.map(template => (
                  <div 
                    key={template.id}
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedTemplate === template.id 
                        ? 'ring-2 ring-primary-500 shadow-md' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="relative">
                      <img 
                        src={template.thumbnailUrl} 
                        alt={template.name}
                        className="w-full h-40 object-cover" 
                      />
                      {selectedTemplate === template.id && (
                        <div className="absolute inset-0 bg-primary-500 bg-opacity-10 flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-primary-500" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={template.isPremium ? "secondary" : "default"}>
                          {template.isPremium ? "Premium" : "Free"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                      <div className="flex mt-2">
                        <span className="text-xs text-slate-500">
                          {template.popularity} {template.popularity === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredTemplates.length === 0 && (
              <div className="text-center p-8">
                <h3 className="text-lg font-medium text-slate-800">No templates found</h3>
                <p className="mt-2 text-slate-600">Try selecting a different category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
          >
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;
