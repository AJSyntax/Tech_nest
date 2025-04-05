import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PortfolioProvider } from "@/context/PortfolioContext";
import Create from "./Create";
import { PortfolioFormData } from "@/types/portfolio"; // Use PortfolioFormData instead
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Function to fetch portfolio data
const fetchPortfolio = async (id: string): Promise<PortfolioFormData> => {
  const response = await fetch(`/api/portfolios/${id}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function CreateWrapper() {
  const params = useParams();
  const portfolioId = params.id; // Get ID from URL, will be undefined for /create route

  // Fetch portfolio data only if portfolioId exists (i.e., we are on the /edit/:id route)
  const { data: initialData, isLoading, isError, error } = useQuery<PortfolioFormData, Error>({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => fetchPortfolio(portfolioId!), // Use non-null assertion as it's enabled only when portfolioId exists
    enabled: !!portfolioId, // Only run the query if portfolioId is truthy
  });

  if (isLoading && portfolioId) {
    // Show a loading state while fetching existing data
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError && portfolioId) {
    // Show an error message if fetching fails
    return (
      <div className="container mx-auto p-4 text-red-600">
        Error loading portfolio: {error?.message || "Unknown error"}
      </div>
    );
  }

  // Pass initialData to PortfolioProvider if editing, otherwise it will be undefined (for create)
  return (
    <PortfolioProvider initialData={initialData}>
      <Create portfolioId={portfolioId} /> {/* Pass portfolioId to Create component if needed */}
    </PortfolioProvider>
  );
}
