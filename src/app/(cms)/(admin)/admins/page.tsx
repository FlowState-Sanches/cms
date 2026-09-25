import type { Metadata } from "next";
import { adminApi } from "@/lib/api/admin-client";
import { getAccess, isCurator } from "@/lib/api/cached";
import { formatTimestamp } from "@/lib/labels";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { GrantAdminForm } from "@/components/grant-admin-form";
import { ResponsiveList } from "@/components/responsive-list";
import { revokeAdminAction } from "./actions";

export const metadata: Metadata = {
  title: "Admins | FlowState CMS",
};

/**
 * Gestão do papel admin (G3, substitui a D2 do CMS Trilha). "Revogar"
 * aparece também na própria linha: a API recusa com `CANNOT_TARGET_SELF`
 * e o diálogo mostra a mensagem, em vez de o botão sumir sem explicação.
 */
export default async function AdminsPage() {
  if (!(await isCurator())) {
    return null;
  }

  const [access, list] = await Promise.all([getAccess(), adminApi.admins()]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text">Admins</h1>

      <section
        aria-labelledby="conceder-admin"
        className="flex flex-col gap-3 rounded-md border border-border p-4"
      >
        <h2 id="conceder-admin" className="font-display text-base font-semibold text-text">
          Conceder acesso de admin
        </h2>
        <GrantAdminForm />
      </section>

      <section aria-labelledby="lista-admins" className="flex flex-col gap-3">
        <h2 id="lista-admins" className="font-display text-base font-semibold text-text">
          Quem é admin
        </h2>
        {list.items.length === 0 ? (
          <EmptyState title="Nenhum admin encontrado." />
        ) : (
          <ResponsiveList
            label="Lista de admins"
            caption="Admins do CMS"
            items={list.items}
            itemKey={(admin) => admin.id}
            tableMinWidth="min-w-[640px]"
            columns={[
              {
                header: "Nome",
                cell: (admin) => (
                  <span className="font-medium text-text">
                    {admin.name}
                    {admin.id === access.user.id && (
                      <span className="ml-2 text-xs font-normal text-text-muted">(você)</span>
                    )}
                  </span>
                ),
              },
              { header: "E-mail", cell: (admin) => admin.email },
              {
                header: "Admin desde",
                cell: (admin) => (admin.since ? formatTimestamp(admin.since) : "Sem registro"),
              },
              {
                header: "Ações",
                cell: (admin) => (
                  <ConfirmAction
                    triggerLabel="Revogar"
                    title="Revogar acesso de admin"
                    description={`${admin.name} deixa de acessar as áreas de gestão a partir da próxima requisição. A conta continua ativa.`}
                    confirmLabel="Confirmar revogação"
                    action={revokeAdminAction.bind(null, admin.id)}
                  />
                ),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
