// src/pages/_app.tsx
import { AppProps } from "next/app";
import "../styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider, AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext is undefined. Make sure you are wrapping your component tree with AuthProvider.");
  }
  
  const { user, isLoading } = authContext;
  const publicRoutes = useMemo(() => ["/login", "/register",  "/forgot-password"], []);
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
    <AuthProvider>
      <AuthGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </AuthProvider>
  );
}
