import { Sidebar } from "@/components/sidebar";
import { StudioProvider } from "@/components/studio-context";
import { DrawerProvider } from "@/components/drawer/drawer-context";
import { SidebarProvider } from "@/components/sidebar-context";

// Shell do app autenticado (studios, sidebar, drawer) — só as rotas
// protegidas passam por aqui. /login e /signup ficam fora deste grupo e não
// recebem StudioProvider (não faz sentido buscar dados de um studio antes de
// existir uma sessão).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <StudioProvider>
        <SidebarProvider>
          <DrawerProvider>
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          </DrawerProvider>
        </SidebarProvider>
      </StudioProvider>
    </div>
  );
}
