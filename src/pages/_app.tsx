// src/pages/_app.tsx
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider, AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo } from "react";
import { Analytics } from '@vercel/analytics/next';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgriInfo Portal - Agricultural Insights',
  description: 'Comprehensive agricultural information platform for farmers and traders in India'
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext is undefined. Make sure you are wrapping your component tree with AuthProvider.");
  }
  
  const { user, isLoading } = authContext;
  const publicRoutes = useMemo(() => ["/login", "/register", "/forgot-password"], []);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !publicRoutes.includes(router.pathname)) {
      router.push("/login");
    }
  }, [router, isLoading, user, router.pathname, publicRoutes]);

  if (isLoading || (!user && !publicRoutes.includes(router.pathname))) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Google AdSense Verification Meta Tag */}
        <meta name="google-adsense-account" content="ca-pub-8232236830358247" />
        <title>AgriInfo Portal - Agricultural Insights</title>
        <meta 
          name="description" 
          content="Comprehensive agricultural information platform for farmers and traders in India" 
        />
        <link rel="icon" href="/logo_rr.png" />
      </Head>
      
      {/* Google AdSense Script */}
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