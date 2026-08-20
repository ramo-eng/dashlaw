import { prisma } from "@/lib/db";
import { requireStaffPage } from "@/lib/page-auth";
import { Badge, Card, PageTitle, statusTone } from "@/components/ui";
import { CheckoutButton } from "@/components/admin-forms";

export default async function BillingPage() {
  const { session } = await requireStaffPage();
  const sub = await prisma.subscription.findUnique({ where: { firmId: session.firmId } });
  return (
    <div>
      <PageTitle title="Billing" />
      <Card>
        <p>Plan: {sub?.plan}</p>
        <p>
          Status: <Badge tone={statusTone(sub?.status || "")}>{sub?.status}</Badge>
        </p>
        <p>Seats: {sub?.seats}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Stripe is abstracted. This demo checkout marks the subscription active without charging a card.
        </p>
        <div className="mt-3">
          <CheckoutButton />
        </div>
      </Card>
    </div>
  );
}
