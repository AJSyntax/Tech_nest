import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-request";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define the purchase request type
interface TemplatePurchase {
  id: number;
  userId: number;
  templateId: number;
  portfolioId?: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  approvedAt?: number;
  approvedBy?: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  template?: {
    id: number;
    name: string;
    price: number;
  };
}

const TemplatePurchases = () => {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch purchase requests
  const { data: purchases = [], isLoading } = useQuery<TemplatePurchase[]>({
    queryKey: ["/api/admin/template-purchases", activeTab],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/admin/template-purchases${activeTab !== "all" ? `?status=${activeTab}` : ""}`
      );
      return response.json();
    }
  });

  // Mutation for updating purchase status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/template-purchases/${id}`,
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/template-purchases"] });
      toast({
        title: "Purchase request updated",
        description: "The purchase request status has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update purchase request",
        variant: "destructive"
      });
    }
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Helper function to format price
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Template Purchase Requests</CardTitle>
          <CardDescription>
            Manage template purchase requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                {purchases.filter(p => p.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {purchases.filter(p => p.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No {activeTab !== "all" ? activeTab : ""} purchase requests found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.id}</TableCell>
                        <TableCell>
                          {purchase.user ? (
                            <div>
                              <div className="font-medium">{purchase.user.username}</div>
                              <div className="text-sm text-muted-foreground">{purchase.user.email}</div>
                            </div>
                          ) : (
                            `User ID: ${purchase.userId}`
                          )}
                        </TableCell>
                        <TableCell>
                          {purchase.template ? (
                            purchase.template.name
                          ) : (
                            `Template ID: ${purchase.templateId}`
                          )}
                        </TableCell>
                        <TableCell>
                          {purchase.template ? (
                            formatPrice(purchase.template.price)
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(purchase.requestedAt)}</TableCell>
                        <TableCell>
                          {purchase.status === "pending" && (
                            <Badge variant="outline" className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {purchase.status === "approved" && (
                            <Badge variant="success" className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {purchase.status === "rejected" && (
                            <Badge variant="destructive" className="flex items-center">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {purchase.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(purchase.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(purchase.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {purchase.status === "approved" && (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm text-green-600 font-medium">
                                Approved {purchase.approvedAt ? formatDate(purchase.approvedAt) : ""}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(purchase.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Revoke Access
                              </Button>
                            </div>
                          )}
                          {purchase.status === "rejected" && (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm text-red-600 font-medium">
                                Rejected {purchase.approvedAt ? formatDate(purchase.approvedAt) : ""}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(purchase.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve Now
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplatePurchases;
