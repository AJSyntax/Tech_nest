import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useLocation } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { generatePortfolioZip } from "@/lib/portfolio-generator";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, Eye, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { portfolio, savePortfolio } = usePortfolio();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [portfolioName, setPortfolioName] = useState(portfolio.name || "my-portfolio");
  const [isPublished, setIsPublished] = useState(portfolio.isPublished);
  const [exportStep, setExportStep] = useState<"form" | "success" | "error">("form");

  // Get the template information
  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const selectedTemplate = templates?.find(t => t.id.toString() === portfolio.templateId);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Update the portfolio name
      const updatedPortfolio = {
        ...portfolio,
        name: portfolioName,
        isPublished: isPublished
      };
      
      // Save to the server first
      const portfolioId = await savePortfolio();
      
      // Then generate the ZIP file
      await generatePortfolioZip(updatedPortfolio, selectedTemplate?.name || 'Custom');
      
      setExportStep("success");
      
      // Wait a moment before redirecting to preview
      if (portfolioId) {
        setTimeout(() => {
          onClose();
          setLocation(`/preview/${portfolioId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Export error:", error);
      setExportStep("error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {exportStep === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Export Your Portfolio</DialogTitle>
              <DialogDescription>
                Your portfolio is ready to be exported. You can preview it or download it as a ZIP file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="portfolio-name">Portfolio Name</Label>
                  <Input
                    id="portfolio-name"
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    placeholder="my-portfolio"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This will be used for the ZIP file name and folder structure.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="publish" 
                    checked={isPublished}
                    onCheckedChange={(checked) => setIsPublished(checked as boolean)}
                  />
                  <Label htmlFor="publish" className="cursor-pointer">
                    Make this portfolio public
                  </Label>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Selected Template: {selectedTemplate?.name || 'Custom'}</h4>
                  <p className="text-xs text-slate-600 mb-2">
                    {selectedTemplate?.description || 'Your customized portfolio template'}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs mr-2 text-slate-500">
                      {selectedTemplate?.isPremium ? 'Premium Template' : 'Free Template'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button 
                type="button"
                variant="outline" 
                onClick={onClose}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center"
                  disabled={isExporting}
                  onClick={() => {
                    savePortfolio().then(id => {
                      if (id) setLocation(`/preview/${id}`);
                      onClose();
                    });
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  disabled={isExporting || !portfolioName.trim()} 
                  onClick={handleExport}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Download ZIP"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
        
        {exportStep === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-600">
                <Check className="h-5 w-5 mr-2" />
                Export Successful
              </DialogTitle>
              <DialogDescription>
                Your portfolio has been exported successfully.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-center text-slate-600">
                The ZIP file has been downloaded to your device. 
                You will be redirected to the preview page shortly.
              </p>
            </div>
          </>
        )}
        
        {exportStep === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Export Failed
              </DialogTitle>
              <DialogDescription>
                There was a problem exporting your portfolio.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-center text-slate-600">
                Please try again. If the problem persists, try saving your portfolio first.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={onClose}
              >
                Close
              </Button>
              <Button onClick={() => setExportStep("form")}>
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
