import { useState } from "react";
import {
  PortfolioFormData,
  DevicePreviewType
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/context/PortfolioContext";
import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import {
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  Lock,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

interface LivePreviewProps {
  portfolio: PortfolioFormData;
  onSelectTemplate: () => void;
  isPremiumTemplate?: boolean;
  isPurchased?: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({
  portfolio,
  onSelectTemplate,
  isPremiumTemplate: propIsPremium,
  isPurchased: propIsPurchased
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { device, setDevice, openExportModal } = usePortfolio();
  const { user } = useAuth();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const selectedTemplate = templates?.find(t => t.id.toString() === portfolio.templateId);

  // Check if user has purchased this template
  const { data: userPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/user/template-purchases"],
    enabled: !!user && !!portfolio.templateId, // Only run if user is logged in and template is selected
  });

  // Determine if the template is premium and purchased
  const isPremiumTemplate = propIsPremium || (selectedTemplate?.isPremium ?? false);
  const isPurchased = propIsPurchased || userPurchases.some(
    (p) => p.templateId === parseInt(portfolio.templateId) && p.status === "approved"
  );

  const devices: DevicePreviewType[] = [
    {
      name: "mobile",
      icon: <Smartphone className="h-5 w-5" />,
      width: "320px",
    },
    {
      name: "tablet",
      icon: <Tablet className="h-5 w-5" />,
      width: "768px",
    },
    {
      name: "desktop",
      icon: <Monitor className="h-5 w-5" />,
      width: "100%",
    },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="border-b border-slate-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-slate-900">Live Preview</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectTemplate}
            >
              Change Template
            </Button>
            <Button
              size="sm"
              onClick={openExportModal}
              disabled={isPremiumTemplate && !isPurchased}
              title={isPremiumTemplate && !isPurchased ? "Purchase this template to export" : "Export"}
            >
              {isPremiumTemplate && !isPurchased ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isPremiumTemplate && !isPurchased ? "Locked" : "Export"}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex space-x-2">
          <Button
            variant={isDarkMode ? "outline" : "default"}
            size="icon"
            onClick={toggleDarkMode}
            title="Light mode"
          >
            <Sun className="h-4 w-4" />
          </Button>
          <Button
            variant={isDarkMode ? "default" : "outline"}
            size="icon"
            onClick={toggleDarkMode}
            title="Dark mode"
          >
            <Moon className="h-4 w-4" />
          </Button>
          <div className="ml-auto flex space-x-2">
            {devices.map((d) => (
              <Button
                key={d.name}
                variant={device.name === d.name ? "default" : "outline"}
                size="icon"
                onClick={() => setDevice(d)}
                title={`${d.name.charAt(0).toUpperCase() + d.name.slice(1)} view`}
              >
                {d.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 flex justify-center">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mx-auto" style={{ maxWidth: device.width }}>
            <Skeleton className="w-full h-96" />
          </div>
        ) : (
          <div
            className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mx-auto ${isDarkMode ? 'bg-slate-900 text-white' : ''}`}
            style={{ maxWidth: device.width }}
          >
            <div style={{ height: "480px" }} className="overflow-auto">
              {!selectedTemplate ? (
                <div className="p-6 flex flex-col items-center justify-center h-full">
                  <p className="text-lg font-medium text-center mb-4">
                    Please select a template to continue
                  </p>
                  <p className="text-sm text-slate-500 text-center mb-6">
                    You need to choose a template before you can create your portfolio.
                    We have both free and premium options available.
                  </p>
                  <Button onClick={onSelectTemplate} size="lg">
                    Choose a Template
                  </Button>
                </div>
              ) : (
                <>
                  <header className={`p-6 ${isDarkMode ? 'bg-primary-900' : 'bg-primary-600'} text-white`}>
                    <div className="flex items-center">
                      {portfolio.personalInfo.profilePhotoUrl ? (
                        <img
                          src={portfolio.personalInfo.profilePhotoUrl}
                          alt={`${portfolio.personalInfo.firstName} ${portfolio.personalInfo.lastName}`}
                          className="w-20 h-20 rounded-full border-4 border-white object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-300 flex items-center justify-center text-slate-600">
                          {portfolio.personalInfo.firstName.charAt(0)}
                          {portfolio.personalInfo.lastName.charAt(0)}
                        </div>
                      )}
                      <div className="ml-4">
                        <h1 className="text-2xl font-bold">
                          {portfolio.personalInfo.firstName || 'Your'} {portfolio.personalInfo.lastName || 'Name'}
                        </h1>
                        <p className="text-primary-100">
                          {portfolio.personalInfo.headline || 'Your Professional Headline'}
                        </p>
                      </div>
                    </div>
                  </header>

                  <nav className={`${isDarkMode ? 'bg-primary-800' : 'bg-primary-700'} text-white px-6 py-2`}>
                    <ul className="flex text-sm">
                      <li className="mr-4"><a href="#about" className="text-white hover:text-primary-200">About</a></li>
                      <li className="mr-4"><a href="#skills" className="text-white hover:text-primary-200">Skills</a></li>
                      <li className="mr-4"><a href="#projects" className="text-white hover:text-primary-200">Projects</a></li>
                      <li><a href="#contact" className="text-white hover:text-primary-200">Contact</a></li>
                    </ul>
                  </nav>

                  <section id="about" className={`p-6 ${isDarkMode ? 'text-slate-300' : ''}`}>
                    <h2 className="text-xl font-semibold mb-4">About Me</h2>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      {portfolio.personalInfo.about || 'Your bio will appear here. Add some information about yourself, your skills, and what you\'re passionate about.'}
                    </p>
                  </section>

                  <section id="contact" className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <h2 className="text-xl font-semibold mb-4">Contact</h2>
                    <div className="space-y-2">
                      {portfolio.personalInfo.email && (
                        <p className="flex items-center">
                          <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                          </svg>
                          <span>{portfolio.personalInfo.email}</span>
                        </p>
                      )}
                      {portfolio.personalInfo.phone && (
                        <p className="flex items-center">
                          <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                          </svg>
                          <span>{portfolio.personalInfo.phone}</span>
                        </p>
                      )}
                      <div className="flex space-x-4 mt-4">
                        {portfolio.personalInfo.socialLinks?.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            className={`${isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-800'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>{link.platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
