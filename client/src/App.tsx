import { Switch, Route, useRoute } from "wouter"; // Import useRoute
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import AuthPage from "./pages/auth-page";
import AdminDashboard from "./pages/admin/Dashboard";
import MyPortfolios from "./pages/MyPortfolios"; // Import the new page
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortfolioProvider } from "./context/PortfolioContext"; // Import PortfolioProvider
import CreateWrapper from "./pages/CreateWrapper";
import PreviewWrapper from "./pages/PreviewWrapper";


function Router() {
  // Check if the current route matches the preview pattern
  const [isPreviewRoute] = useRoute("/preview/:id");

  return (
    <>
      {/* Conditionally render Header */}
      {!isPreviewRoute && <Header />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/templates" component={Templates} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/create" component={CreateWrapper} />
        <ProtectedRoute path="/edit/:id" component={CreateWrapper} /> {/* Add Edit route */}
        <ProtectedRoute path="/my-portfolios" component={MyPortfolios} />
        {/* Use regular Route for public preview */}
        <Route path="/preview/:id" component={PreviewWrapper} />
        <ProtectedRoute path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
      {/* Conditionally render Footer */}
      {!isPreviewRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortfolioProvider> {/* Wrap Router with PortfolioProvider */}
          <Router />
        </PortfolioProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
