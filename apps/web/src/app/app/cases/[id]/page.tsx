import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/page-auth";
import { getCaseWorkspace } from "@/lib/workspace";
import { Badge, Card, Notice, statusTone } from "@/components/ui";
import { CaseActions, ItemActions, TickJobsButton, UploadForm } from "@/components/case-actions";
import { toFirmLocal } from "@/lib/domain/time";
import { prisma } from "@/lib/db";
import { GenerateSummary, ApproveSummary, DeadlineForm, TaskForm } from "@/components/workspace-forms";

const TABS = [
  "overview",
  "checklist",
  "documents",
  "intake",
  "tasks",
  "deadlines",
  "ai",
  "activity",
] as const;

export default async function CaseWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { session, firm } = await requireStaffPage();
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const ws = await getCaseWorkspace(session.firmId, id);
  if (!ws) notFound();
  const findings = ws.completeness ? JSON.parse(ws.completeness.findings) : [];
  const users = await prisma.user.findMany({ where: { firmId: session.firmId, deletedAt: null } });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-[var(--muted)]">
            <Link href="/app/cases">Cases</Link> / {ws.client.name}
          </div>
          <h1 className="text-xl font-semibold">{ws.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm">
            <Badge>{ws.caseType}</Badge>
            <Badge tone={statusTone(ws.status)}>{ws.status}</Badge>
            <span>Owner {ws.owner.name}</span>
          </div>
        </div>
        <CaseActions caseId={ws.id} status={ws.status} />
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-[var(--muted)]">Readiness</div>
            <div className="text-2xl font-semibold">{ws.readiness}%</div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)]">Next action</div>
            <div>{ws.nextAction}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)]">Alerts</div>
            {findings.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No completeness findings yet.</div>
            ) : (
              <div className="text-sm">{findings.length} recommendation(s) for staff review.</div>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--line)] pb-2 text-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/app/cases/${ws.id}?tab=${t}`}
            className={`capitalize no-underline ${tab === t ? "font-semibold" : ""}`}
          >
            {t === "ai" ? "AI summary" : t}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-3">
          <Notice>
            Completeness and AI results are recommendations for staff. They are not legal determinations.
          </Notice>
          {findings.slice(0, 8).map((f: { itemTitle: string; severity: string; message: string; recommendation: string }, i: number) => (
            <Card key={i}>
              <div className="text-sm font-medium">
                {f.itemTitle} · {f.severity}
              </div>
              <p className="text-sm">{f.message}</p>
              <p className="text-sm text-[var(--muted)]">{f.recommendation}</p>
            </Card>
          ))}
          {ws.notesInternal && (
            <Card>
              <div className="text-xs text-[var(--muted)]">Internal notes</div>
              <p className="text-sm">{ws.notesInternal}</p>
            </Card>
          )}
        </div>
      )}

      {tab === "checklist" && (
        <div className="overflow-x-auto rounded border border-[var(--line)] bg-white">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Req</th>
                <th>Status</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ws.checklistItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/app/cases/${ws.id}/checklist/${item.id}`}>{item.title}</Link>
                    <div className="text-xs text-[var(--muted)]">{item.instructions}</div>
                  </td>
                  <td>{item.required ? "Required" : "Optional"}</td>
                  <td>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td>{item.dueAt ? toFirmLocal(item.dueAt, firm.timezone) : "—"}</td>
                  <td>
                    <ItemActions itemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "documents" && (
        <div>
          <UploadForm caseId={ws.id} staffOnly />
          <p className="mb-3 text-xs text-[var(--muted)]">Staff-only upload (not visible in the client portal).</p>
          <div className="overflow-x-auto rounded border border-[var(--line)] bg-white">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Scan</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {ws.documents.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/app/cases/${ws.id}/documents/${d.id}`}>{d.originalName}</Link>
                    </td>
                    <td>{d.type}</td>
                    <td>
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    </td>
                    <td>{d.scanStatus}</td>
                    <td>v{d.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "intake" && (
        <div className="grid gap-2">
          {ws.intakeResponses.map((r) => (
            <Card key={r.id}>
              <div className="text-sm font-medium">{r.prompt}</div>
              <div className="text-sm">{r.answer || <span className="text-[var(--muted)]">No answer yet</span>}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <TaskForm caseId={ws.id} users={users.map((u) => ({ id: u.id, name: u.name }))} />
          <ul className="mt-4 grid gap-2">
            {ws.tasks.map((t) => (
              <li key={t.id} className="rounded border border-[var(--line)] bg-white p-3 text-sm">
                {t.title} · {t.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "deadlines" && (
        <div>
          <Notice>Critical operational deadlines require explicit confirmation. Do not treat inferred legal dates as authoritative.</Notice>
          <DeadlineForm caseId={ws.id} timezone={firm.timezone} />
          <ul className="mt-4 grid gap-2">
            {ws.deadlines.map((d) => (
              <li key={d.id} className="rounded border border-[var(--line)] bg-white p-3 text-sm">
                {d.title} · {d.status} · {toFirmLocal(d.dueAt, d.timezone)} · {d.source}
                {d.critical ? " · critical" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "ai" && (
        <div>
          <Notice>
            AI output is assistive. Only an approved version may be exported. Original files and extracted values are
            stored separately.
          </Notice>
          <GenerateSummary caseId={ws.id} />
          <div className="mt-4 grid gap-3">
            {ws.aiSummaries.map((s) => (
              <Card key={s.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>
                    v{s.version} · {s.status} · {s.modelVersion}
                  </span>
                  {s.status !== "approved" && <ApproveSummary id={s.id} />}
                </div>
                <pre className="whitespace-pre-wrap text-sm">{s.content}</pre>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div>
          <TickJobsButton />
          <ul className="mt-4 grid gap-2">
            {ws.activity.map((e) => (
              <li key={e.id} className="rounded border border-[var(--line)] bg-white p-3 text-sm">
                <span className="font-mono text-xs text-[var(--muted)]">{e.createdAt.toISOString()}</span>
                <div>
                  {e.action} · {e.targetType} · {e.targetId.slice(0, 8)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
