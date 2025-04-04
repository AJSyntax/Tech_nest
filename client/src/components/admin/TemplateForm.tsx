import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTemplate, Template } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Create a schema for template creation/editing
const templateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  thumbnailUrl: z.string().url("Please enter a valid URL"),
  category: z.string().min(1, "Category is required"),
  isPremium: z.boolean().default(false),
  price: z.number().min(0, "Price cannot be negative").optional(),
  htmlContent: z.string().min(50, "HTML content must be at least 50 characters").optional(),
  cssContent: z.string().optional(),
  jsContent: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export function TemplateForm({ template }: { template?: Template }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!template;

  // Initialize the form with template data if editing
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: isEditing ? {
      name: template.name,
      description: template.description,
      thumbnailUrl: template.thumbnailUrl,
      category: template.category,
      isPremium: template.isPremium,
      price: template.price || 0,
      htmlContent: template.htmlContent || "",
      cssContent: template.cssContent || "",
      jsContent: template.jsContent || "",
    } : {
      name: "",
      description: "",
      thumbnailUrl: "",
      category: "",
      isPremium: false,
      price: 0,
      htmlContent: "",
      cssContent: "",
      jsContent: "",
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest("POST", "/api/admin/templates", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues & { id: number }) => {
      const response = await apiRequest("PUT", `/api/admin/templates/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update template");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TemplateFormValues) => {
    if (isEditing && template) {
      updateTemplateMutation.mutate({ ...data, id: template.id });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const isPending = createTemplateMutation.isPending || updateTemplateMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Template" : "Create New Template"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update an existing portfolio template"
            : "Add a new portfolio template to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Modern Portfolio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A modern portfolio template with a clean design..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a URL to an image that represents this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Minimal, Modern, Creative..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="isPremium"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Premium Template</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("isPremium") && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (in cents)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2999 (for $29.99)"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter price in cents (e.g., 2999 for $29.99)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<!DOCTYPE html><html>..."
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include placeholders for dynamic content using special syntax
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cssContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSS Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="body { ... }"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jsContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JavaScript Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="document.addEventListener('DOMContentLoaded', function() { ... });"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}