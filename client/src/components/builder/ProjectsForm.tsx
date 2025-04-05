import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Github
} from "lucide-react";

const ProjectsForm = () => {
  const { portfolio, updatePortfolio, prevStep, nextStep } = usePortfolio();
  const [projects, setProjects] = useState<Project[]>(portfolio.projects || []);
  const [newProject, setNewProject] = useState<Project>({
    title: "",
    description: "",
    technologies: [],
    imageUrl: "",
    liveUrl: "",
    codeUrl: ""
  });
  const [techInput, setTechInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTech = () => {
    if (!techInput.trim()) return;

    setNewProject(prev => ({
      ...prev,
      technologies: [...prev.technologies, techInput.trim()]
    }));
    setTechInput("");
  };

  const handleRemoveTech = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  const handleAddProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) return;

    setProjects(prev => [...prev, { ...newProject }]);
    setNewProject({
      title: "",
      description: "",
      technologies: [],
      imageUrl: "",
      liveUrl: "",
      codeUrl: ""
    });
  };

  const handleRemoveProject = (index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  // Called on "Next"
  const handleSubmit = () => {
    updatePortfolio({ projects });
    nextStep();
  };

  // Called on "Previous"
  const handleBack = () => {
    updatePortfolio({ projects });
    prevStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-4">Add Your Projects</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              name="title"
              value={newProject.title}
              onChange={handleChange}
              placeholder="Portfolio Website"
            />
          </div>

          <div>
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              value={newProject.description}
              onChange={handleChange}
              placeholder="A personal portfolio website built with React and Tailwind CSS"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="project-image">Project Image URL</Label>
            <Input
              id="project-image"
              name="imageUrl"
              value={newProject.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/project-image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-live">Live Demo URL</Label>
              <Input
                id="project-live"
                name="liveUrl"
                value={newProject.liveUrl}
                onChange={handleChange}
                placeholder="https://your-project.example.com"
              />
            </div>
            <div>
              <Label htmlFor="project-code">Code Repository URL</Label>
              <Input
                id="project-code"
                name="codeUrl"
                value={newProject.codeUrl}
                onChange={handleChange}
                placeholder="https://github.com/yourusername/project"
              />
            </div>
          </div>

          <div>
            <Label>Technologies Used</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newProject.technologies.map((tech, index) => (
                <div
                  key={index}
                  className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm flex items-center"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(index)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="React.js"
                className="mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddTech}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddProject}
          className="mt-4"
          disabled={!newProject.title.trim() || !newProject.description.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Your Projects</h3>

        {projects.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-300 rounded-md">
            <p className="text-slate-500">No projects added yet. Add your first project using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <Card key={index} className="overflow-hidden">
                {project.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{project.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Live Demo
                      </a>
                    )}
                    {project.codeUrl && (
                      <a
                        href={project.codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        <Github className="h-3 w-3 mr-1" />
                        Code
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProject(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Restore Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous: Skills
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Next: Education
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectsForm;
