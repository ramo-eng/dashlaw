import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, PageTitle, statusTone } from "@/components/ui";
import { InviteUserForm } from "@/components/admin-forms";

export default async function UsersPage() {
  const { session } = await requireStaffPage();
  const users = await prisma.user.findMany({
    where: { firmId: session.firmId, deletedAt: null },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageTitle title="Users & roles" />
      <InviteUserForm />
      <table className="mt-6 rounded border border-[var(--line)] bg-white">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>MFA</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <Badge tone={statusTone(u.status)}>{u.status}</Badge>
              </td>
              <td>{u.mfaEnabled ? "on" : "off (architecture ready)"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
