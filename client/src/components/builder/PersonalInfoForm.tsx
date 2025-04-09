import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalInfoSchema, PersonalInfo } from "@shared/schema";
import { Github, Linkedin, Twitter, Plus, Trash2, ChevronRight } from "lucide-react"; // Added ChevronRight
import { useState } from "react";

const PersonalInfoForm = () => {
  const { portfolio, updatePortfolio, nextStep } = usePortfolio();
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  const form = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: portfolio.personalInfo,
  });

  // This onSubmit will be triggered by this component's "Next" button
  const onSubmit = (data: PersonalInfo) => {
    updatePortfolio({ personalInfo: data });
    nextStep(); // Go to the next step after successful validation and update
  };

  const addSocialLink = () => {
    if (!socialPlatform || !socialUrl) return;

    try {
      // Validate URL format
      new URL(socialUrl);

      const newSocialLinks = [
        ...(form.getValues().socialLinks || []),
        { platform: socialPlatform, url: socialUrl }
      ];

      form.setValue('socialLinks', newSocialLinks);
      setSocialPlatform("");
      setSocialUrl("");
    } catch (error) {
      form.setError('socialLinks', {
        type: 'manual',
        message: 'Please enter a valid URL'
      });
    }
  };

  const removeSocialLink = (index: number) => {
    const links = form.getValues().socialLinks || [];
    const newLinks = [...links.slice(0, index), ...links.slice(index + 1)];
    form.setValue('socialLinks', newLinks);
  };

  return (
    <Form {...form}>
      {/* The ID allows Create.tsx to target this form for submission (if needed, but not used in current plan) */}
      <form id="personal-info-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ... rest of the form fields ... */}
         <div className="flex flex-col sm:flex-row gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="AJ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Villamor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Headline</FormLabel>
              <FormControl>
                <Input placeholder="Full Stack Developer | React Specialist" {...field} />
              </FormControl>
              <FormDescription>
                A brief description that appears below your name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Me</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="I'm a passionate developer with 5 years of experience..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profilePhotoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Photo</FormLabel>
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  {field.value ? (
                    <img
                      className="h-16 w-16 object-cover rounded-full"
                      src={field.value}
                      alt="Profile photo"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                      {form.getValues().firstName?.[0] || 'J'}{form.getValues().lastName?.[0] || 'D'}
                    </div>
                  )}
                </div>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/your-photo.jpg"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                Enter a URL to your profile photo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ajvillamor@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+63 (123) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <Label>Social Media Links</Label>

          <div className="flex flex-col space-y-4">
            {form.getValues().socialLinks?.map((link, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-300 rounded-md">
                  {link.platform.toLowerCase() === 'github' && <Github className="h-6 w-6" />}
                  {link.platform.toLowerCase() === 'linkedin' && <Linkedin className="h-6 w-6" />}
                  {link.platform.toLowerCase() === 'twitter' && <Twitter className="h-6 w-6" />}
                  {!['github', 'linkedin', 'twitter'].includes(link.platform.toLowerCase()) && (
                    <span className="text-sm font-medium">{link.platform.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <Input
                  value={link.url}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSocialLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-end space-x-2">
            <div className="w-1/3">
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                placeholder="GitHub"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <Button
              type="button"
              onClick={addSocialLink}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.formState.errors.socialLinks && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.socialLinks.message}</p>
          )}
        </div>

        {/* Restore Navigation Button */}
        <div className="mt-8 flex justify-end">
          {/* No Previous button on the first step */}
          <Button type="submit">
            Next: Skills
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PersonalInfoForm;
