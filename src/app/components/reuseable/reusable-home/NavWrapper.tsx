"use client";
import { usePathname } from "next/navigation";
import Nav from "./nav";

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {pathname !== "/auth/login" && <Nav />}
      {children}
    </>
  );
}
