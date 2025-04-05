import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { X } from "lucide-react";

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({ template, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{template.name} Preview</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <Badge variant={template.isPremium ? "secondary" : "default"}>
              {template.isPremium ? "Premium" : "Free"}
            </Badge>
            <span className="ml-2 text-sm text-slate-500">Category: {template.category}</span>
          </div>
          <div className="aspect-w-16 aspect-h-9 bg-slate-100 rounded overflow-hidden border border-slate-200">
            <img
              src={template.thumbnailUrl}
              alt={`${template.name} template preview`}
              className="w-full h-full object-cover"
            />
          </div>
          {/* In a real application, you might render a more interactive preview here, 
              perhaps using an iframe or rendering the actual template structure */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Link href={`/create?template=${template.id}`}>
            <Button>Use Template</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;
