import type { Metadata } from "next";
import { Saira, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { StudioProvider } from "@/components/studio-context";
import { ThemeInit } from "@/components/theme-init";
import { DrawerProvider } from "@/components/drawer/drawer-context";
import { SidebarProvider } from "@/components/sidebar-context";
import "./globals.css";

const saira = Saira({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilates Pro · FRANKO Inteligência Comercial",
  description: "Painel C.O.N.T.R.O.L — B.I. do método FK para studios de Pilates.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${saira.variable} ${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen bg-(--ground)">
        <ThemeInit />
        <StudioProvider>
          <SidebarProvider>
            <DrawerProvider>
              <Sidebar />
              <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            </DrawerProvider>
          </SidebarProvider>
        </StudioProvider>
      </body>
    </html>
  );
}
