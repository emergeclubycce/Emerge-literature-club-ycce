// app/providers.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
        </div>
      )}
      {children}
    </>
  );
}
