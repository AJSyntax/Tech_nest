import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PortfolioResponse, PortfolioFormData } from "@/types/portfolio"; // Correct import path
import { Button } from "@/components/ui/button";
import { Template } from "@shared/schema"; // Keep Template from shared
import { Download, ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { generatePortfolioZip, generateCss, generateJs } from "@/lib/portfolio-generator";
import { generateHtml } from "@/utils/htmlGenerator";
import { Skeleton } from "@/components/ui/skeleton";

const deviceSizes = {
  mobile: "320px",
  tablet: "768px",
  desktop: "100%"
};

const Preview = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [isExporting, setIsExporting] = useState(false);
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string | null>(null);

  // Use PortfolioResponse for the query result type
  const {
    data: portfolio,
    isLoading: isLoadingPortfolio,
    isError: isPortfolioError
  } = useQuery<PortfolioResponse>({
    queryKey: [`/api/portfolios/${id}`],
    enabled: !!id,
    retry: 1,
    // Remove onError, handle with isError below
  });

  // Handle portfolio loading error
  useEffect(() => {
    if (isPortfolioError) {
      toast({
        title: "Error",
        description: "Could not load portfolio. It may have been deleted or does not exist.",
        variant: "destructive"
      });
      setLocation("/");
    }
  }, [isPortfolioError, setLocation, toast]);


  const { data: templates, isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: !!portfolio // Fetch templates only after portfolio data is loaded
  });

  const selectedTemplate = useMemo(() => {
    if (!portfolio || !templates) return undefined;
    // portfolio.templateId is already a string, t.id is likely a number
    return templates.find(t => t.id.toString() === portfolio.templateId);
  }, [portfolio, templates]);

  // Generate preview content when portfolio and template data are ready
  useEffect(() => {
    // Ensure we have portfolio data (type PortfolioResponse) and the selected template
    if (portfolio && selectedTemplate && !isLoadingPortfolio && !isLoadingTemplates) {
      // Construct the PortfolioFormData object needed by the generator functions
      const portfolioDataForGeneration: PortfolioFormData = {
        name: portfolio.name,
        templateId: portfolio.templateId,
        personalInfo: portfolio.personalInfo,
        skills: portfolio.skills,
        projects: portfolio.projects,
        education: portfolio.education,
        colorScheme: portfolio.colorScheme,
        isPublished: portfolio.isPublished, // Include isPublished if needed by generators, otherwise optional
      };

      try {
        const htmlContent = generateHtml(portfolioDataForGeneration, selectedTemplate.name || 'Custom');
        const cssContent = generateCss(portfolioDataForGeneration);
        const jsContent = generateJs(); // Assuming generateJs doesn't need portfolio data

        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${portfolioDataForGeneration.name || 'Portfolio'} Preview</title>
            <style>${cssContent}</style>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          </head>
          <body>
            ${htmlContent}
            <script>${jsContent}</script>
          </body>
          </html>
        `;
        setPreviewSrcDoc(fullHtml);
      } catch (error) {
        console.error("Error generating preview:", error);
        toast({
          title: "Preview Error",
          description: "Could not generate portfolio preview.",
          variant: "destructive"
        });
        setPreviewSrcDoc('<p>Error generating preview.</p>');
      }
    } else if (!isLoadingPortfolio && !isLoadingTemplates && portfolio && !selectedTemplate) {
       // Handle case where template might not be found (e.g., deleted template)
       console.warn("Selected template not found for portfolio:", portfolio.templateId);
       toast({
         title: "Template Not Found",
         description: "The template associated with this portfolio could not be found. Preview might be incomplete.",
         // Removed variant: "warning"
       });
       // Optionally generate with a default/fallback or show an error
       setPreviewSrcDoc('<p>Error: Template not found.</p>');
    } else {
      // Reset srcDoc while loading or if data is missing
      setPreviewSrcDoc(null);
    }
  }, [portfolio, selectedTemplate, isLoadingPortfolio, isLoadingTemplates, toast]);


  const handleExport = async () => {
    // Use the full portfolio response data for export
    if (!portfolio) return;

    // Construct PortfolioFormData for the zip generator
     const portfolioDataForExport: PortfolioFormData = {
        name: portfolio.name,
        templateId: portfolio.templateId,
        personalInfo: portfolio.personalInfo,
        skills: portfolio.skills,
        projects: portfolio.projects,
        education: portfolio.education,
        colorScheme: portfolio.colorScheme,
        isPublished: portfolio.isPublished,
      };

    try {
      setIsExporting(true);
      // Pass the correctly typed data to the zip generator
      await generatePortfolioZip(portfolioDataForExport, selectedTemplate?.name || 'Custom');

      toast({
        title: "Success!",
        description: "Your portfolio has been downloaded."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your portfolio.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/create")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              {isLoadingPortfolio ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                `${portfolio?.name || 'Portfolio'} Preview` // Access name directly from portfolio response
              )}
            </h1>
          </div>

          <div className="flex mt-4 md:mt-0">
            <div className="flex bg-white border rounded-md p-1 mr-4">
              {(['mobile', 'tablet', 'desktop'] as const).map((d) => (
                <Button
                  key={d}
                  variant={device === d ? "default" : "ghost"}
                  size="sm"
                  className="px-3"
                  onClick={() => setDevice(d)}
                >
                  {getDeviceIcon(d)}
                  <span className="ml-2 hidden sm:inline-block capitalize">{d}</span>
                </Button>
              ))}
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || !portfolio}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Portfolio"}
            </Button>
          </div>
        </div>

        {isLoadingPortfolio ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex justify-center">
          <Skeleton className="w-full max-w-3xl h-[600px]" />
        </div>
      ) : portfolio && previewSrcDoc ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex justify-center">
          <div style={{ width: deviceSizes[device], height: "600px" }} className="border border-slate-200 rounded-lg overflow-auto">
            <iframe
              srcDoc={previewSrcDoc}
              title="Portfolio Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin" // Added sandbox for security, allow scripts for JS
            />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-slate-900 mb-2">Portfolio Not Found</h2>
            <p className="text-slate-600 mb-4">
              The portfolio you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => setLocation("/create")}>Create New Portfolio</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;
