import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { Route, Switch } from "wouter";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Profile from "./pages/profile";
import Register from "./pages/register";
import Stories from "./pages/stories";
import { ThemeProvider } from "./components/theme-provider";
import Navbar from "./components/navbar"; // ✅ Changed to default import
import NotFound from "./pages/not-found";
import Messages from "./pages/messages";
import Professionals from "./pages/professionals";
import SubmitStory from "./pages/submit-story";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar /> {/* This will now work correctly */}
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/login" component={Login} />
                <Route path="/signup" component={Signup} />
                <Route path="/register" component={Register} />
                <Route path="/profile" component={Profile} />
                <Route path="/stories" component={Stories} />
                <Route path="/submit-story" component={SubmitStory} />
                <Route path="/messages" component={Messages} />
                <Route path="/professionals" component={Professionals} />
                <Route path="/not-found" component={NotFound} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;