import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Education } from "@shared/schema";
import { ChevronLeft, ChevronRight, Plus, Trash2, GraduationCap, Briefcase } from "lucide-react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const EducationForm = () => {
  const { portfolio, updatePortfolio, prevStep, nextStep } = usePortfolio();
  const [education, setEducation] = useState<Education[]>(portfolio.education || []);
  const [activeTab, setActiveTab] = useState<"education" | "experience">("education");
  const [newEntry, setNewEntry] = useState<Education>({
    institution: "",
    degree: "",
    startDate: "",
    endDate: "",
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEntry = () => {
    if (!newEntry.institution.trim() || !newEntry.degree.trim()) return;
    
    setEducation(prev => [...prev, { ...newEntry }]);
    setNewEntry({
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: ""
    });
  };

  const handleRemoveEntry = (index: number) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    updatePortfolio({ education });
    nextStep();
  };

  const handleBack = () => {
    updatePortfolio({ education });
    prevStep();
  };

  // Helper to determine if we're adding education or experience
  const isEducation = activeTab === "education";
  
  // Labels based on active tab
  const labels = {
    institution: isEducation ? "School/University" : "Company/Organization",
    degree: isEducation ? "Degree/Qualification" : "Job Title",
    dateLabel: isEducation ? "Study Period" : "Employment Period"
  };

  return (
    <div className="space-y-6">
      <div>
        <Tabs defaultValue="education" value={activeTab} onValueChange={(v) => setActiveTab(v as "education" | "experience")}>
          <TabsList className="mb-4">
            <TabsTrigger value="education" className="flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" />
              Education
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Experience
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="education">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Add Your Education</h3>
          </TabsContent>
          
          <TabsContent value="experience">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Add Your Work Experience</h3>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="institution">{labels.institution}</Label>
            <Input
              id="institution"
              name="institution"
              value={newEntry.institution}
              onChange={handleChange}
              placeholder={isEducation ? "Harvard University" : "Google, Inc."}
            />
          </div>
          
          <div>
            <Label htmlFor="degree">{labels.degree}</Label>
            <Input
              id="degree"
              name="degree"
              value={newEntry.degree}
              onChange={handleChange}
              placeholder={isEducation ? "Bachelor of Science in Computer Science" : "Senior Frontend Developer"}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="text"
                value={newEntry.startDate}
                onChange={handleChange}
                placeholder="Sept 2018"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (or "Present")</Label>
              <Input
                id="endDate"
                name="endDate"
                type="text"
                value={newEntry.endDate}
                onChange={handleChange}
                placeholder="June 2022"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={newEntry.description}
              onChange={handleChange}
              placeholder={isEducation 
                ? "Graduated with honors. Focused on web development and AI." 
                : "Led a team of 5 developers. Implemented new features and improved performance."
              }
              rows={3}
            />
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleAddEntry}
          className="mt-4"
          disabled={!newEntry.institution.trim() || !newEntry.degree.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add {isEducation ? "Education" : "Experience"}
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          {education.length === 0 
            ? "No entries yet" 
            : `Your Education & Experience (${education.length})`
          }
        </h3>
        
        {education.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-300 rounded-md">
            <p className="text-slate-500">No education or experience added yet. Use the form above to add your first entry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((entry, index) => {
              const isEducationEntry = !entry.institution.includes(",") && !entry.institution.includes("Inc") && !entry.institution.includes("LLC");
              
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base font-semibold">{entry.institution}</CardTitle>
                      <CardDescription>{entry.degree}</CardDescription>
                    </div>
                    {isEducationEntry ? (
                      <GraduationCap className="h-5 w-5 text-primary-500" />
                    ) : (
                      <Briefcase className="h-5 w-5 text-secondary-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-500 mb-2">
                      {entry.startDate} {entry.endDate ? `- ${entry.endDate}` : "- Present"}
                    </div>
                    {entry.description && (
                      <p className="text-sm text-slate-600">{entry.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous: Projects
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Next: Design
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EducationForm;
