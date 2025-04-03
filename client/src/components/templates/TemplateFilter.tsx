import { TemplateFilters } from "@/types/portfolio";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemplateFilterProps {
  filters: TemplateFilters;
  onFilterChange: (filters: Partial<TemplateFilters>) => void;
}

const TemplateFilter: React.FC<TemplateFilterProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-0">
        <div className="w-full sm:w-auto">
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange({ category: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Minimal">Minimal</SelectItem>
              <SelectItem value="Modern">Modern</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select
            value={filters.pricing}
            onValueChange={(value) => onFilterChange({ pricing: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pricing</SelectItem>
              <SelectItem value="free">Free Templates</SelectItem>
              <SelectItem value="premium">Premium Templates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center">
        <span className="mr-3 text-sm text-slate-600">Sort by:</span>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value })}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TemplateFilter;
