import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PortfolioResponse } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Template } from "@shared/schema";
import { Download, ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { generatePortfolioZip } from "@/lib/portfolio-generator";
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

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery<PortfolioResponse>({
    queryKey: [`/api/portfolios/${id}`],
    enabled: !!id,
    retry: 1,
    onError: () => {
      toast({
        title: "Error",
        description: "Could not load portfolio. It may have been deleted or does not exist.",
        variant: "destructive"
      });
      setLocation("/");
    }
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: !!portfolio
  });

  const selectedTemplate = templates?.find(t => t.id.toString() === portfolio?.templateId);

  const handleExport = async () => {
    if (!portfolio) return;
    
    try {
      setIsExporting(true);
      await generatePortfolioZip(portfolio, selectedTemplate?.name || 'Custom');
      
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
                `${portfolio?.name || 'Portfolio'} Preview`
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
        ) : portfolio ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex justify-center">
            <div style={{ width: deviceSizes[device], height: "600px" }} className="border border-slate-200 rounded-lg overflow-auto">
              <iframe 
                src={`/api/preview/${id}`}
                title="Portfolio Preview"
                className="w-full h-full border-0"
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
