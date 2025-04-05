import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Paintbrush, Upload, Save } from "lucide-react"; // Import Save, Upload icons
import { ColorPicker } from "@/components/ui/color-picker";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

// Define props to accept handleSave function
interface ColorSchemeFormProps {
  handleSave: () => Promise<void>; // Function to save progress
}

// Predefined color schemes
const colorPresets = [
  {
    name: "Blue Professional",
    colors: {
      primary: "#3b82f6",
      secondary: "#4f46e5",
      accent: "#8b5cf6",
      background: "#ffffff",
      text: "#1e293b"
    }
  },
  {
    name: "Green Nature",
    colors: {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#06b6d4",
      background: "#f8fafc",
      text: "#1e293b"
    }
  },
  {
    name: "Dark Mode",
    colors: {
      primary: "#6366f1",
      secondary: "#4f46e5",
      accent: "#a855f7",
      background: "#0f172a",
      text: "#f8fafc"
    }
  },
  {
    name: "Sunset",
    colors: {
      primary: "#f59e0b",
      secondary: "#d97706",
      accent: "#ef4444",
      background: "#ffffff",
      text: "#1e293b"
    }
  },
  {
    name: "Minimalist",
    colors: {
      primary: "#334155",
      secondary: "#475569",
      accent: "#64748b",
      background: "#f8fafc",
      text: "#1e293b"
    }
  },
];

const ColorSchemeForm: React.FC<ColorSchemeFormProps> = ({ handleSave }) => { // Accept handleSave prop
  const { portfolio, updatePortfolio, prevStep, openExportModal, openTemplateModal } = usePortfolio();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleColorChange = (colorKey: string, value: string) => {
    updatePortfolio({
      colorScheme: {
        ...portfolio.colorScheme,
        [colorKey]: value
      }
    });
    setSelectedPreset(null);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    updatePortfolio({
      colorScheme: preset.colors
    });
    setSelectedPreset(preset.name);
  };

  const handleBack = () => {
    // Update context before going back
    updatePortfolio({ colorScheme: portfolio.colorScheme });
    // Update context before going back
    updatePortfolio({ colorScheme: portfolio.colorScheme });
    prevStep();
  };

  // No handleSubmit needed here anymore, as Save/Export are separate actions

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Design Customization</h3>
        <p className="text-slate-600 mb-6">Customize the colors and appearance of your portfolio.</p>
        
        <div className="mb-8">
          <h4 className="text-base font-medium text-slate-800 mb-3">Template Selection</h4>
          <Button 
            type="button" 
            onClick={openTemplateModal}
            variant="outline"
            className="flex items-center"
          >
            <Paintbrush className="mr-2 h-4 w-4" />
            Change Template
          </Button>
        </div>
        
        <div className="mb-8">
          <h4 className="text-base font-medium text-slate-800 mb-3">Color Scheme</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Primary Color</Label>
              <div className="flex items-center">
                <ColorPicker
                  value={portfolio.colorScheme.primary}
                  onChange={(value) => handleColorChange("primary", value)}
                />
                <span className="ml-3 text-sm">{portfolio.colorScheme.primary}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Used for main elements like buttons and headers</p>
            </div>
            
            <div>
              <Label className="mb-2 block">Secondary Color</Label>
              <div className="flex items-center">
                <ColorPicker
                  value={portfolio.colorScheme.secondary}
                  onChange={(value) => handleColorChange("secondary", value)}
                />
                <span className="ml-3 text-sm">{portfolio.colorScheme.secondary}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Used for supporting elements</p>
            </div>
            
            <div>
              <Label className="mb-2 block">Accent Color</Label>
              <div className="flex items-center">
                <ColorPicker
                  value={portfolio.colorScheme.accent}
                  onChange={(value) => handleColorChange("accent", value)}
                />
                <span className="ml-3 text-sm">{portfolio.colorScheme.accent}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Used for highlights and special elements</p>
            </div>
            
            <div>
              <Label className="mb-2 block">Background Color</Label>
              <div className="flex items-center">
                <ColorPicker
                  value={portfolio.colorScheme.background}
                  onChange={(value) => handleColorChange("background", value)}
                />
                <span className="ml-3 text-sm">{portfolio.colorScheme.background}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Main background color of your portfolio</p>
            </div>
            
            <div>
              <Label className="mb-2 block">Text Color</Label>
              <div className="flex items-center">
                <ColorPicker
                  value={portfolio.colorScheme.text}
                  onChange={(value) => handleColorChange("text", value)}
                />
                <span className="ml-3 text-sm">{portfolio.colorScheme.text}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Main text color of your portfolio</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h4 className="text-base font-medium text-slate-800 mb-3">Preset Color Schemes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {colorPresets.map((preset) => (
              <Card
                key={preset.name}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedPreset === preset.name ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-8 mb-2 rounded-md" style={{ background: preset.colors.primary }}></div>
                    <div className="w-full flex mb-2">
                      <div className="h-4 flex-1 rounded-l-sm" style={{ background: preset.colors.secondary }}></div>
                      <div className="h-4 flex-1 rounded-r-sm" style={{ background: preset.colors.accent }}></div>
                    </div>
                    <div style={{ color: preset.colors.text, background: preset.colors.background }} className="w-full text-center text-xs rounded py-1 px-2">
                      {preset.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Restore Navigation Buttons, but modify for Save/Export */}
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous: Education
        </Button>
        <div className="flex gap-2">
          {/* Save Progress Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSave} // Call handleSave passed from Create.tsx
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
          {/* Export Button */}
          <Button
            type="button"
            onClick={openExportModal} // Directly open the export modal
            className="flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ColorSchemeForm;
