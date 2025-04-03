import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Paintbrush, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  presetColors?: string[];
}

const defaultPresetColors = [
  "#3b82f6", // primary blue
  "#4f46e5", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#334155", // slate
  "#000000"  // black
];

export function ColorPicker({ 
  value, 
  onChange, 
  className,
  presetColors = defaultPresetColors 
}: ColorPickerProps) {
  const [color, setColor] = useState(value || "#3b82f6");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onChange(newColor);
  };

  const handlePresetClick = (presetColor: string) => {
    setColor(presetColor);
    onChange(presetColor);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-12 h-8 p-0 border-2", className)}
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">Pick color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div 
              className="w-8 h-8 rounded-md border" 
              style={{ backgroundColor: color }}
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  onChange(e.target.value);
                }}
                className="w-20 h-8 px-2 border rounded-md text-sm"
              />
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={handleChange}
                  className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
                />
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Paintbrush className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((presetColor) => (
                <Button
                  key={presetColor}
                  variant="outline"
                  className="w-8 h-8 p-0 rounded-md border-2 relative"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handlePresetClick(presetColor)}
                >
                  {color.toLowerCase() === presetColor.toLowerCase() && (
                    <Check className="h-4 w-4 absolute text-white" />
                  )}
                  <span className="sr-only">Select color {presetColor}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
