import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-request";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
}

const MyPurchases = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's purchase requests
  const { data: purchases = [], isLoading } = useQuery<TemplatePurchase[]>({
    queryKey: ["/api/user/template-purchases"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/template-purchases");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch templates to get names
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
    enabled: purchases.length > 0,
  });

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Helper function to get template name
  const getTemplateName = (templateId: number) => {
    const template = templates.find((t: any) => t.id === templateId);
    return template ? template.name : `Template #${templateId}`;
  };

  // Helper function to format price
  const formatPrice = (templateId: number) => {
    const template = templates.find((t: any) => t.id === templateId);
    return template ? `$${(template.price / 100).toFixed(2)}` : "N/A";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Template Purchases</h1>
        <Button asChild>
          <Link href="/templates">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Browse Templates
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            View the status of your template purchase requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>You haven't made any template purchase requests yet</p>
              <Button className="mt-4" asChild>
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell className="font-medium">
                      {getTemplateName(purchase.templateId)}
                    </TableCell>
                    <TableCell>{formatPrice(purchase.templateId)}</TableCell>
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
                      {purchase.status === "approved" && (
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/create?template=${purchase.templateId}`}>
                              Use Template
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/export?template=${purchase.templateId}`}>
                              <Download className="h-4 w-4 mr-1" />
                              Download ZIP
                            </Link>
                          </Button>
                        </div>
                      )}
                      {purchase.status === "rejected" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/templates`}>
                            Browse Templates
                          </Link>
                        </Button>
                      )}
                      {purchase.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-amber-600 font-medium">
                            Awaiting admin approval
                          </span>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/create?template=${purchase.templateId}&trial=true`}>
                              Try in Trial Mode
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPurchases;
