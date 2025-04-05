import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Portfolio } from "@shared/schema";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Edit, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const MyPortfolios = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: portfolios, isLoading: portfoliosLoading, error } = useQuery<Portfolio[]>({
    queryKey: ['/api/user/portfolios'],
    enabled: !!user, // Only fetch if user is loaded and exists
  });

  const deleteMutation = useMutation({
    mutationFn: async (portfolioId: number) => {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/portfolios'] });
      toast({
        title: "Success",
        description: "Portfolio deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete portfolio.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div className="container-custom py-12">Loading user...</div>;
  }

  if (!user) {
    return <Redirect to="/auth?message=Please log in to view your portfolios" />;
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Portfolios</h1>
            <p className="text-slate-600 mt-2">Manage your created portfolios</p>
          </div>
          <Link href="/create">
            <Button>Create New Portfolio</Button>
          </Link>
        </div>

        {portfoliosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-red-600">Error loading portfolios</h3>
            <p className="mt-2 text-slate-600">Could not fetch your portfolios. Please try again later.</p>
          </div>
        ) : portfolios && portfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id}>
                <CardHeader>
                  <CardTitle>{portfolio.name}</CardTitle>
                  <CardDescription>
                    Last updated: {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Status: {portfolio.isPublished ? 'Published' : 'Draft'}
                  </p>
                  {/* Add template name or thumbnail if needed */}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {/* Wrap Preview Button in an anchor tag for new tab */}
                  <a href={`/preview/${portfolio.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" title="Preview in new tab">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </a>
                  <Link href={`/edit/${portfolio.id}`}>
                    <Button variant="outline" size="icon" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your portfolio "{portfolio.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(portfolio.id)} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-slate-800">No portfolios yet</h3>
            <p className="mt-2 text-slate-600 mb-4">Start creating your first portfolio!</p>
            <Link href="/create">
              <Button>Create Portfolio</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPortfolios;
