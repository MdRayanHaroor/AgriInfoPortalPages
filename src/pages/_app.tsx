import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider, AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";
import { Analytics } from '@vercel/analytics/next';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authContext = useContext(AuthContext);

  // Define public routes consistently
  const publicRoutes = useMemo(() => [
    "/login", 
    "/register", 
    "/forgot-password", 
    "/", 
    "/states", 
    "/crops", 
    "/about", 
    "/contact",
    "/user-input"
  ], []);

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(router.pathname);

  // If no auth context, render loading or children based on route
  if (!authContext) {
    return isPublicRoute ? <>{children}</> : <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>;
  }

  const { user, isLoading } = authContext;

  // Loading state
  if (isLoading) {
    return <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>;
  }

  // Allow access to public routes or authenticated user routes
  if (isPublicRoute || user) {
    return <>{children}</>;
  }

  // Redirect to login for protected routes
  if (typeof window !== 'undefined') {
    router.push("/login");
  }

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AgriInfo Portal - Agricultural Insights</title>
        <meta 
          name="description" 
          content="Comprehensive agricultural information platform for farmers and traders in India" 
        />
        <link rel="icon" href="/logo_rr.png" />
        <meta name="google-adsense-account" content="ca-pub-8232236830358247" />
      </Head>
      
      <Script
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8232236830358247"
        crossOrigin="anonymous"
      />

      <AuthProvider>
        <AuthGuard>
          <Layout>
            <Component {...pageProps} />
            <Analytics />
          </Layout>
        </AuthGuard>
      </AuthProvider>
    </>
  );
}