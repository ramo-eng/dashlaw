import Link from "next/link";

export default function PortalIndex() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Client portal</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Open the invitation link from your attorney. If you already verified this device, continue to your case.
      </p>
      <p className="mt-4">
        <Link href="/portal/case">Continue to my case</Link>
      </p>
    </main>
  );
}
