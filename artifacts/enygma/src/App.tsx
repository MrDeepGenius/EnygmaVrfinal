import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileProvider } from "@/lib/profile-context";
import { SplashScreen } from "@/components/splash-screen";
import { TvModeProvider } from "@/lib/tv-mode";
import { TvRemoteNavigation } from "@/components/tv-remote-navigation";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

const Profiles = lazy(() => import("@/pages/profiles"));
const ProfileUser = lazy(() => import("@/pages/profile-user"));
const Home = lazy(() => import("@/pages/home"));
const Movies = lazy(() => import("@/pages/movies"));
const Series = lazy(() => import("@/pages/series"));
const Anime = lazy(() => import("@/pages/anime"));
const Search = lazy(() => import("@/pages/search"));
const Watch = lazy(() => import("@/pages/watch"));
const MovieDetail = lazy(() => import("@/pages/detail-movie"));
const SeriesDetail = lazy(() => import("@/pages/detail-series"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminSearch = lazy(() => import("@/pages/admin-search"));
const MyList = lazy(() => import("@/pages/mylist"));
const Premium = lazy(() => import("@/pages/premium"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="w-full h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function Router() {
  // Scroll to top on route change
  useScrollToTop();

  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Profiles} />
        <Route path="/profiles" component={Profiles} />
        <Route path="/profile" component={ProfileUser} />
        <Route path="/home" component={Home} />
        <Route path="/movies" component={Movies} />
        <Route path="/series" component={Series} />
        <Route path="/anime" component={Anime} />
        <Route path="/search" component={Search} />
        <Route path="/detail/movie/:id" component={MovieDetail} />
        <Route path="/detail/:type/:id" component={SeriesDetail} />
        <Route path="/watch/:category/:id" component={Watch} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/search" component={AdminSearch} />
        <Route path="/mylist" component={MyList} />
        <Route path="/premium" component={Premium} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem("splash_shown") === "1"; } catch { return false; }
  });

  const handleSplashDone = useCallback(() => {
    try { sessionStorage.setItem("splash_shown", "1"); } catch {}
    setSplashDone(true);
  }, []);

  // Track geolocation on app load
  useEffect(() => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${BASE}/api/geo/track`).catch(() => {
      // Silently fail - don't disrupt user experience
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TvModeProvider>
          <ProfileProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <TvRemoteNavigation />
              <Router />
            </WouterRouter>
          </ProfileProvider>
        </TvModeProvider>
        <Toaster />
      </TooltipProvider>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
    </QueryClientProvider>
  );
}

export default App;
