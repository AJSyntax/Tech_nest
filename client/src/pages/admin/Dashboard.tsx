import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { TemplateForm } from "@/components/admin/TemplateForm";
import { TemplatesList } from "@/components/admin/TemplatesList";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  
  // Redirect if not an admin
  if (user && user.role !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
        <p>You do not have permission to access the admin dashboard.</p>
        <Button className="mt-4" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="templates" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-8 mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            <TemplateForm />
            <TemplatesList />
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management functionality will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}