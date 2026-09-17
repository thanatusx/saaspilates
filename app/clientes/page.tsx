import { PageHeader } from "@/components/page-header";
import { StudioManager } from "@/components/clientes/studio-manager";

export default function ClientesPage() {
  return (
    <>
      <PageHeader
        title="Gestão de Clientes"
        subtitle="Os studios administrados pela FRANKO. Selecione um para ver a Central de Performance dele."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <StudioManager />
      </div>
    </>
  );
}
