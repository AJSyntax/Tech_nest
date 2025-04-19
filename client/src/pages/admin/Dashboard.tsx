import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, LayoutTemplate, BarChart, ShoppingCart, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/api-request";
import { TemplateForm } from "@/components/admin/TemplateForm";
import { TemplatesList } from "@/components/admin/TemplatesList";
import { Link, useLocation } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");

  // Fetch pending purchase requests for the dashboard
  const { data: pendingPurchases = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["/api/admin/template-purchases", "pending"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/admin/template-purchases?status=pending"
      );
      return response.json();
    }
  });

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="purchases">
            Purchase Requests
            {pendingPurchases.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingPurchases.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-8 mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            <TemplateForm />
            <TemplatesList />
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Purchase Requests</CardTitle>
              <CardDescription>Manage template purchase requests from users</CardDescription>
            </CardHeader>
            <CardContent>
              {isPendingLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pendingPurchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No pending purchase requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    You have {pendingPurchases.length} pending purchase {pendingPurchases.length === 1 ? 'request' : 'requests'} that need your attention.
                  </div>
                  <Button asChild>
                    <Link href="/admin/template-purchases">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View All Purchase Requests
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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