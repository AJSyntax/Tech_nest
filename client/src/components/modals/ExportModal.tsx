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
import { Check, Download, Eye, AlertCircle, Lock, CheckCircle, XCircle, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api-request";

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { portfolio, savePortfolio, openTemplateModal } = usePortfolio();
  const { user } = useAuth();
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

  // Check if user has purchased this template
  const { data: userPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/user/template-purchases"],
    enabled: !!user && !!selectedTemplate?.isPremium, // Only run if user is logged in and template is premium
  });

  // Determine if the template is purchased
  const isPremiumTemplate = selectedTemplate?.isPremium ?? false;
  const isPurchased = userPurchases.some(
    (p) => p.templateId === parseInt(portfolio.templateId) && p.status === "approved"
  );

  // Find the purchase record if it exists
  const purchaseRecord = userPurchases.find(
    (p) => p.templateId === parseInt(portfolio.templateId)
  );
  const purchaseStatus = purchaseRecord?.status || null;

  // Mutation for creating a template purchase request
  const purchaseMutation = useMutation({
    mutationFn: async (templateId: number) => {
      if (!user?.id) {
        throw new Error("You must be logged in to purchase templates");
      }

      console.log('Submitting purchase request:', {
        userId: user.id,
        templateId
      });

      return apiRequest('POST', '/api/template-purchases', {
        userId: user.id,
        templateId
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

  const handleExport = async () => {
    // Check if a template has been selected
    if (!portfolio.templateId || !selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a template before exporting your portfolio.",
        variant: "destructive"
      });
      onClose();
      openTemplateModal();
      return;
    }

    // Check if this is a premium template that hasn't been purchased
    if (isPremiumTemplate && !isPurchased) {
      toast({
        title: "Premium Template",
        description: "You need to purchase this template before you can export your portfolio.",
        variant: "destructive"
      });

      // If user is logged in, show purchase option
      if (user) {
        const templateId = parseInt(portfolio.templateId);
        purchaseMutation.mutate(templateId);
      } else {
        // If not logged in, redirect to login
        onClose();
        setLocation("/login");
      }
      return;
    }

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

                <div className={`p-4 rounded-md ${isPremiumTemplate && !isPurchased ? (purchaseStatus === 'pending' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200') : 'bg-slate-50'}`}>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Selected Template: {selectedTemplate?.name || 'Custom'}</h4>
                  <p className="text-xs text-slate-600 mb-2">
                    {selectedTemplate?.description || 'Your customized portfolio template'}
                  </p>
                  <div className="flex items-center">
                    {isPremiumTemplate ? (
                      <div className="flex items-center">
                        {isPurchased && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-xs mr-2 text-green-600">
                              Premium Template (Purchased)
                            </span>
                          </div>
                        )}
                        {!isPurchased && purchaseStatus === 'pending' && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-amber-600" />
                            <span className="text-xs mr-2 text-amber-600">
                              Premium Template (Purchase Pending Approval)
                            </span>
                          </div>
                        )}
                        {!isPurchased && purchaseStatus === 'rejected' && (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 mr-1 text-red-600" />
                            <span className="text-xs mr-2 text-red-600">
                              Premium Template (Purchase Rejected)
                            </span>
                          </div>
                        )}
                        {!isPurchased && !purchaseStatus && (
                          <div className="flex items-center">
                            <span className="text-xs mr-2 text-red-600">
                              Premium Template (Not Purchased)
                            </span>
                            {user && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 text-xs"
                                onClick={() => {
                                  const templateId = parseInt(portfolio.templateId);
                                  purchaseMutation.mutate(templateId);
                                }}
                                disabled={purchaseMutation.isPending}
                              >
                                {purchaseMutation.isPending ? "Processing..." : "Request Purchase"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        <span className="text-xs mr-2 text-green-600">Free Template (Available)</span>
                      </div>
                    )}
                  </div>

                  {isPremiumTemplate && !isPurchased && purchaseStatus === 'pending' && (
                    <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                      Your purchase request is pending admin approval. You can try the template in trial mode, but you won't be able to export until approved.
                    </div>
                  )}

                  {isPremiumTemplate && !isPurchased && purchaseStatus === 'rejected' && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                      Your purchase request was rejected. Please contact support or try a different template.
                    </div>
                  )}
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
                  disabled={isExporting || !portfolioName.trim() || (isPremiumTemplate && !isPurchased)}
                  onClick={handleExport}
                  className="flex items-center"
                  title={isPremiumTemplate && !isPurchased
                    ? (purchaseStatus === 'pending'
                      ? "Awaiting admin approval"
                      : purchaseStatus === 'rejected'
                        ? "Purchase request was rejected"
                        : "Purchase this template to download")
                    : "Download as ZIP file"}
                >
                  {isPremiumTemplate && !isPurchased ? (
                    purchaseStatus === 'pending' ? (
                      <Clock className="h-4 w-4 mr-2" />
                    ) : purchaseStatus === 'rejected' ? (
                      <XCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : (
                    isPremiumTemplate && !isPurchased ? (
                      purchaseStatus === 'pending' ? "Awaiting Approval" :
                      purchaseStatus === 'rejected' ? "Request Rejected" :
                      "Purchase Required"
                    ) : "Download ZIP"
                  )}
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
