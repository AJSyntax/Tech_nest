import { useEffect, useState } from 'react';
import { Template } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TemplateFilters } from '@/types/portfolio';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateFilter from '@/components/templates/TemplateFilter';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import TemplatePreviewModal from '@/components/modals/TemplatePreviewModal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api-request';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertCircle } from 'lucide-react';

const TEMPLATES_PER_PAGE = 6;

const Templates = () => {
  const [filters, setFilters] = useState<TemplateFilters>({
    category: 'all',
    pricing: 'all',
    sortBy: 'newest'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<Template | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedTemplateForCheckout, setSelectedTemplateForCheckout] = useState<Template | null>(null);
  const [, ] = useLocation(); // We don't need setLocation for now
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const { data: templates, isLoading, error } = useQuery<Template[]>({
    queryKey: [`/api/templates?category=${filters.category}&pricing=${filters.pricing}&sortBy=${filters.sortBy}`],
  });

  const handleFilterChange = (newFilters: Partial<TemplateFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleOpenPreviewModal = (template: Template) => {
    setSelectedTemplateForPreview(template);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedTemplateForPreview(null);
  };

  const handleOpenCheckoutModal = (template: Template) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase premium templates",
        variant: "destructive"
      });
      return;
    }

    setSelectedTemplateForCheckout(template);
    setIsCheckoutModalOpen(true);
  };

  const handleCloseCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setSelectedTemplateForCheckout(null);
  };

  // Mutation for creating a template purchase request
  const purchaseMutation = useMutation({
    mutationFn: async (templateId: number) => {
      if (!user?.id) {
        throw new Error("You must be logged in to purchase templates");
      }

      console.log('Submitting purchase request from Templates page:', {
        userId: user.id,
        templateId
      });

      return apiRequest('POST', '/api/template-purchases', {
        userId: user.id,
        templateId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/template-purchases'] });
      toast({
        title: "Purchase Request Submitted",
        description: "Your purchase request has been submitted for admin approval."
      });
      handleCloseCheckoutModal();
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Request Failed",
        description: error.message || "Failed to submit purchase request",
        variant: "destructive"
      });
    }
  });

  const paginatedTemplates = templates ? templates.slice(
    (currentPage - 1) * TEMPLATES_PER_PAGE,
    currentPage * TEMPLATES_PER_PAGE
  ) : [];

  const totalPages = templates ? Math.ceil(templates.length / TEMPLATES_PER_PAGE) : 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Portfolio Templates</h1>
          <p className="text-slate-600 mt-2">Choose from our professionally designed templates to showcase your skills</p>
        </div>

        <TemplateFilter filters={filters} onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-md border border-slate-200">
                <Skeleton className="w-full h-60" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-white rounded-lg shadow mt-8">
            <h3 className="text-lg font-medium text-red-600">Error loading templates</h3>
            <p className="mt-2 text-slate-600">Please try again later</p>
          </div>
        ) : (
          <>
            {templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {paginatedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handleOpenPreviewModal}
                    onCheckout={handleOpenCheckoutModal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-lg shadow mt-8">
                <h3 className="text-lg font-medium text-slate-800">No templates found</h3>
                <p className="mt-2 text-slate-600">Try changing your filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedTemplateForPreview && (
        <TemplatePreviewModal
          template={selectedTemplateForPreview}
          onClose={handleClosePreviewModal}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && selectedTemplateForCheckout && (
        <Dialog open={isCheckoutModalOpen} onOpenChange={handleCloseCheckoutModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase Template</DialogTitle>
              <DialogDescription>
                You are about to request the purchase of a premium template.
              </DialogDescription>
            </DialogHeader>

            <div className="my-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedTemplateForCheckout.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplateForCheckout.description}</p>
                </div>
                <div className="text-lg font-bold">
                  ${((selectedTemplateForCheckout.price || 0) / 100).toFixed(2)}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">This is a demo</p>
                  <p className="text-amber-700">In a real application, this would connect to a payment processor. For this demo, the purchase will be submitted for admin approval.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCheckoutModal}>Cancel</Button>
              <Button
                onClick={() => purchaseMutation.mutate(selectedTemplateForCheckout.id)}
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Submit Purchase Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Templates;
