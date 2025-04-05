import { Link } from "wouter";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void; // Add onPreview prop
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPreview }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className="group relative rounded-lg overflow-hidden shadow-md border border-slate-200 hover:shadow-lg transition"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="aspect-w-16 aspect-h-9 bg-slate-100">
        <img
          src={template.thumbnailUrl}
          alt={`${template.name} template`}
          className="w-full h-60 object-cover"
        />
        <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
          <Button 
            variant="secondary" 
            className="opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            size="sm"
            onClick={() => onPreview(template)} // Add onClick handler
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
          <Badge variant={template.isPremium ? "secondary" : "default"}>
            {template.isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
        <p className="text-slate-500 mb-4">{template.description}</p>
        <div className="flex items-center text-sm text-slate-600">
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Updated recently
          </span>
          <span className="flex items-center ml-4">
            <Users className="h-4 w-4 mr-1" />
            {template.popularity} users
          </span>
        </div>
        <div className="mt-4">
          <Link href={`/create?template=${template.id}`}>
            <Button className="w-full">Use Template</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
