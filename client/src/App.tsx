import { Switch, Route } from "wouter";
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
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import CreateWrapper from "./pages/CreateWrapper";
import PreviewWrapper from "./pages/PreviewWrapper";

function Router() {
  return (
    <>
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/templates" component={Templates} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/create" component={CreateWrapper} />
        <ProtectedRoute path="/preview/:id" component={PreviewWrapper} />
        <ProtectedRoute path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
