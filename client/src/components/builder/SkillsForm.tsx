import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skill } from "@shared/schema";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "Frontend Development",
  "Backend Development",
  "Mobile Development",
  "DevOps",
  "Design",
  "Data Science",
  "Other"
];

const SkillsForm = () => {
  const { portfolio, updatePortfolio, prevStep, nextStep } = usePortfolio();
  const [skills, setSkills] = useState<Skill[]>(portfolio.skills || []);
  const [newSkill, setNewSkill] = useState<Skill>({
    name: "",
    proficiency: 3,
    category: "Frontend Development"
  });

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;

    setSkills(prev => [...prev, { ...newSkill }]);
    setNewSkill({
      name: "",
      proficiency: 3,
      category: newSkill.category
    });
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSkill(prev => ({
      ...prev,
      name: e.target.value
    }));
  };

  const handleProficiencyChange = (value: number[]) => {
    setNewSkill(prev => ({
      ...prev,
      proficiency: value[0]
    }));
  };

  const handleCategoryChange = (value: string) => {
    setNewSkill(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleSubmit = () => {
    updatePortfolio({ skills });
    nextStep();
  };

  const handleBack = () => {
    updatePortfolio({ skills });
    prevStep();
  };

  // Group skills by category for display
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-4">Add Your Skills</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              value={newSkill.name}
              onChange={handleSkillChange}
              placeholder="React.js"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="skill-category">Category</Label>
            <Select
              value={newSkill.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="skill-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="skill-proficiency">
            Proficiency: {newSkill.proficiency}/5
          </Label>
          <Slider
            id="skill-proficiency"
            defaultValue={[newSkill.proficiency]}
            max={5}
            min={1}
            step={1}
            onValueChange={handleProficiencyChange}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Expert</span>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleAddSkill}
          className="mt-4"
          disabled={!newSkill.name.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Your Skills</h3>
        
        {skills.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-300 rounded-md">
            <p className="text-slate-500">No skills added yet. Add your first skill using the form above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category}>
                <h4 className="font-medium text-slate-700 mb-2">{category}</h4>
                <div className="space-y-2">
                  {categorySkills.map((skill, index) => {
                    const skillIndex = skills.findIndex(s => 
                      s.name === skill.name && s.category === skill.category
                    );
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{skill.name}</div>
                          <div className="flex items-center mt-1">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-slate-500">{skill.proficiency}/5</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSkill(skillIndex)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous: Personal Info
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Next: Projects
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SkillsForm;
