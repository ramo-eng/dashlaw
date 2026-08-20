**IMMIGRATION CASE MANAGEMENT SAAS**

Product Requirements • UX Flows • Architecture • API • Data Model • QA

**V1--V8 Product Roadmap**

Audience: Founder, Product, Design, Engineering, QA, Security, and
future implementation partners.

Document status: Build specification / working technical design.

Important: This product is administrative/legal-workflow software, not
an automated immigration-law advice system. Legal conclusions,
eligibility determinations, filing strategy, and representations about
government requirements must remain under qualified attorney control.

# 1. Executive Summary

Build a focused SaaS for immigration law firms that centralizes case
intake, document collection, client communication, readiness tracking,
deadline management, AI-assisted document understanding, and reusable
case templates. The product starts as a three-screen workflow---Cases,
Case Workspace, Client Portal---and grows through V8 into a lightweight
immigration practice operations platform.

  -----------------------------------------------------------------------
  **Capability**    **Primary user**  **Business        **Initial
                                      value**           release**
  ----------------- ----------------- ----------------- -----------------
  Case management   Attorney /        Single source of  V1
                    paralegal         truth             

  Document          Attorney / client Reduce missing    V1
  checklist                           documents         

  Client portal     Client            Structured        V2
                                      collection        

  Automated         Attorney / client Reduce chasing    V3
  reminders                                             

  Document          Attorney /        Reduce manual     V4
  extraction        paralegal         data entry        

  Completeness      Attorney /        Surface           V5
  checks            paralegal         missing/unclear   
                                      items             

  AI case summary   Attorney /        Faster review     V6
                    paralegal                           

  Deadline tracking Firm              Prevent           V7
                                      operational       
                                      misses            

  Case templates    Firm admin        Standardize       V8
                                      workflows         
  -----------------------------------------------------------------------

# 2. Product Principles

-   Administrative automation first; legal judgment stays with the
    attorney.

-   One case should have one canonical workspace.

-   Client interactions should require as little friction as possible.

-   Every automated action must be explainable and auditable.

-   AI output is assistive, never silently authoritative.

-   Do not hard-code legal requirements without a versioned
    source-of-truth process.

-   Design for firms with 1--50 staff members before enterprise
    complexity.

-   Mobile-friendly client experience; desktop-first staff experience.

-   Build APIs and events early so integrations can be added later.

# 3. Personas and Permissions

  -----------------------------------------------------------------------
  **Role**                **Core                  **Permissions**
                          responsibilities**      
  ----------------------- ----------------------- -----------------------
  Firm Owner / Admin      Billing, users,         Full firm access
                          templates, settings     

  Attorney                Review cases,           Assigned/all permitted
                          documents, tasks,       cases
                          summaries               

  Paralegal               Intake, document        Assigned/all permitted
                          collection, reminders   cases

  Case Coordinator        Client communication    Operational case access
                          and tracking            

  Client                  Provide information and Own case portal only
                          documents               

  Read-only Reviewer      Audit/review            Read-only assigned
                                                  scope
  -----------------------------------------------------------------------

# 4. Scope: V1--V8

  ------------------------------------------------------------------------
  **Version**             **Goal**                **Must-have output**
  ----------------------- ----------------------- ------------------------
  V1                      Case + checklist        Cases, case types,
                          foundation              checklist, status

  V2                      Client portal           Secure client upload and
                                                  progress

  V3                      Automated reminders     Email reminders,
                                                  schedules, activity log

  V4                      Document intelligence   OCR/extraction +
                                                  normalized metadata

  V5                      Completeness checks     Rule-based/AI-assisted
                                                  document checks

  V6                      AI case summary         Structured case summary
                                                  with citations to
                                                  uploaded docs

  V7                      Deadline tracking       Case deadlines, alerts,
                                                  calendar-like view

  V8                      Case templates          Reusable firm templates
                                                  and workflow presets
  ------------------------------------------------------------------------

# 5. End-to-End Workflow

## 5.1 Attorney creates a case

1.  User signs in.

2.  Selects New Case.

3.  Chooses client or creates a client.

4.  Selects case type/template.

5.  Enters basic case metadata.

6.  System creates the case and instantiates the selected
    checklist/template.

7.  System assigns default case owner and status.

8.  Case workspace opens.

9.  User can invite/send client portal link.

## 5.2 Client onboarding

10. Client receives a secure invitation link.

11. Client verifies identity using magic link/OTP.

12. Client sees case name, progress, requested items, and instructions.

13. Client uploads or replaces requested documents.

14. System virus-scans files, stores immutable original, and creates a
    processing job.

15. Processing status appears as Uploading → Processing → Ready/Needs
    Review.

16. Case progress recalculates.

17. Attorney/paralegal receives notification when configured.

## 5.3 Document collection

18. Checklist item is created from a case template.

19. Each item has required/optional status, owner, due date,
    instructions, and allowed document types.

20. Client uploads a file to the item.

21. System validates file type, size, malware status, and basic
    metadata.

22. Document is versioned rather than overwritten.

23. Checklist item becomes Submitted or Received pending review.

24. Staff reviews and marks Accepted, Needs Replacement, or Waived.

25. Progress is recalculated from business rules.

## 5.4 Reminder flow

26. A checklist item becomes overdue or approaches due date.

27. Reminder scheduler creates a notification job.

28. System sends email/notification according to firm settings.

29. Every reminder is recorded in the audit/activity log.

30. Repeated reminders stop when item is received, waived, or case is
    closed.

31. Staff can manually pause/resume reminders.

## 5.5 AI document processing

32. Uploaded document is queued.

33. Malware scan completes.

34. OCR/text extraction runs when required.

35. Document classifier identifies likely type with confidence.

36. Structured fields are extracted where supported.

37. Extraction results are stored separately from the original file.

38. Low-confidence results are flagged for human review.

39. No legal conclusion is automatically written into the case as fact.

## 5.6 AI case summary

40. Authorized staff opens Generate Summary.

41. System gathers approved case metadata, checklist state, extracted
    document facts, and selected source documents.

42. Retrieval layer identifies supporting passages.

43. LLM generates a structured draft.

44. Every material statement links back to source document/page or
    extracted field where possible.

45. Staff reviews and edits.

46. Only the reviewed version can be exported/shared.

# 6. Page / Screen Checklist

  -------------------------------------------------------------------------------
  **Page**                **Audience**            **Purpose**
  ----------------------- ----------------------- -------------------------------
  Public Landing Page     Marketing               Product positioning, pricing,
                                                  demo CTA

  Pricing                 Marketing               Plans, limits, FAQ

  Sign Up                 Auth                    Firm account creation

  Login                   Auth                    Email/password or SSO-ready

  Forgot Password         Auth                    Recovery

  Email Verification      Auth                    Verify firm user

  Onboarding              Firm Admin              Firm profile, timezone,
                                                  defaults

  Cases                   Staff                   List, filters, search, statuses

  Create Case             Staff                   Client + case type + template

  Case Workspace          Staff                   Overview, checklist, documents,
                                                  tasks, activity

  Checklist Detail        Staff                   Item instructions/status/due
                                                  date

  Document Viewer         Staff                   Preview, metadata, extraction,
                                                  review

  AI Summary              Staff                   Draft summary + sources +
                                                  review

  Client Portal           Client                  Progress + requests

  Client Upload           Client                  Upload/re-upload requested
                                                  document

  Client Intake           Client                  Structured questionnaire

  Tasks                   Staff                   Assigned work

  Deadlines               Staff                   Due dates and alerts

  Templates               Admin                   Create/edit/version case
                                                  templates

  Users & Roles           Admin                   Invite/deactivate/permissions

  Notifications           Admin                   Reminder preferences

  Billing                 Admin                   Plan, usage, invoices

  Audit Log               Admin/Reviewer          Security and activity history

  Settings                Admin                   Firm/security/integrations
  -------------------------------------------------------------------------------

## 6.1 Case Workspace layout

-   Header: client name, case type, status, owner, actions.

-   Overview card: readiness %, next action, critical alerts.

-   Checklist tab: grouped required/optional items.

-   Documents tab: files, versions, extraction status.

-   Intake tab: client answers.

-   Tasks tab: staff actions.

-   Deadlines tab: dates and reminders.

-   AI Summary tab: generated draft and source references.

-   Activity tab: immutable event timeline.

# 7. Feature Specifications

  -----------------------------------------------------------------------
  **Feature**             **Scope**               **Rules**
  ----------------------- ----------------------- -----------------------
  V1. Case Management     Case CRUD, statuses,    Case lifecycle: Draft →
                          ownership, search,      Intake → Collecting →
                          filtering, case types,  Review → Ready →
                          activity log.           Filed/Submitted →
                                                  Closed/Archived.

  V1. Checklist           Template-instantiated   Statuses: Not Started,
                          checklist with          Requested, Submitted,
                          required/optional       Accepted, Needs
                          items, instructions,    Replacement, Waived,
                          due dates, status.      Not Applicable.

  V2. Client Portal       Secure client-specific  Client cannot see other
                          workspace with progress cases, internal notes,
                          and document requests.  staff-only tasks, or
                                                  private AI prompts.

  V3. Reminders           Configurable automated  Default cadence should
                          reminders for           be configurable by
                          missing/overdue items.  firm; every send is
                                                  auditable.

  V4. Extraction          OCR + document          Extraction confidence
                          classification +        and processing errors
                          structured extraction.  must be visible.

  V5. Completeness        Rule engine + optional  Results are
                          AI assistance checks    recommendations for
                          document presence and   staff review, not legal
                          expected fields.        determinations.

  V6. AI Summary          Generate structured     Source-backed draft,
                          case summary from       versioned,
                          selected sources.       human-approved before
                                                  export.

  V7. Deadlines           Case-level and          Critical deadlines
                          checklist-level         require explicit user
                          deadlines, alerts,      confirmation; avoid
                          timezone-aware          presenting inferred
                          scheduling.             legal deadlines as
                                                  authoritative.

  V8. Templates           Reusable case workflows Templates are
                          with checklist, intake  versioned; existing
                          questions, reminder     cases retain their
                          presets, document       instantiated version.
                          categories.             
  -----------------------------------------------------------------------

# 8. Data Model

  ---------------------------------------------------------------------------
  **Entity**              **Key fields**          **Relationships**
  ----------------------- ----------------------- ---------------------------
  Firm                    id, name, timezone,     1:N users, clients, cases
                          plan_id                 

  User                    id, firm_id, role,      N:1 firm
                          status                  

  Client                  id, firm_id, name,      1:N cases
                          email, status           

  Case                    id, firm_id, client_id, N:1 client; 1:N
                          case_type, status,      checklist/documents/tasks
                          owner_id                

  CaseTemplate            id, firm_id, version,   1:N template items
                          status                  

  ChecklistItem           id, case_id,            N:1 case
                          template_item_id,       
                          status, due_at          

  Document                id, case_id,            N:1 case
                          storage_key, type,      
                          status, version         

  DocumentExtraction      id, document_id,        1:1/multiple versions
                          schema_version,         
                          confidence, payload     

  IntakeResponse          id, case_id,            N:1 case
                          question_id, answer     

  Task                    id, case_id,            N:1 case
                          assignee_id, status,    
                          due_at                  

  Deadline                id, case_id, type,      N:1 case
                          due_at, source, status  

  Notification            id, case_id,            N:1 case
                          recipient_id, channel,  
                          status                  

  AISummary               id, case_id, version,   N:1 case
                          content, status         

  AuditEvent              id, firm_id, actor_id,  Append-only
                          action, target_type,    
                          target_id, metadata     

  Subscription            id, firm_id,            1:1 firm
                          provider_customer_id,   
                          plan, status            
  ---------------------------------------------------------------------------

## 8.1 Suggested relational schema conventions

-   Use UUID/ULID primary keys.

-   Store all timestamps in UTC; render in firm/client timezone.

-   Soft-delete business records where legally/operationally
    appropriate; retain audit events according to policy.

-   Use optimistic concurrency/version fields for documents, templates,
    and cases.

-   Never store raw uploaded files in the relational database.

-   Keep extracted AI data separate from original source documents.

# 9. Technical Architecture

Recommended architecture for a small team: modular monolith first,
event-driven background workers where asynchronous processing is
required. Do not start with dozens of microservices.

> Client Web\
> ├── Staff App (desktop-first)\
> └── Client Portal (mobile-first)\
> \|\
> v\
> API / Application Layer\
> ├── Auth & RBAC\
> ├── Case Management\
> ├── Checklist / Templates\
> ├── Client Portal\
> ├── Documents\
> ├── Notifications\
> ├── Deadlines\
> ├── AI Orchestration\
> └── Billing\
> \|\
> +\--\> PostgreSQL\
> +\--\> Object Storage (S3/Azure Blob)\
> +\--\> Queue (SQS/Service Bus/Redis)\
> +\--\> OCR / Document AI\
> +\--\> LLM Provider\
> +\--\> Email Provider\
> +\--\> Payment Provider\
> +\--\> Antivirus Scanner\
> \|\
> v\
> Observability\
> ├── Logs\
> ├── Metrics\
> ├── Traces\
> └── Audit Events

## 9.1 Recommended stack

  -----------------------------------------------------------------------
  **Layer**               **Recommendation**      **Reason**
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js + TypeScript    Fast SaaS development,
                                                  SSR/route handling

  UI                      Tailwind + component    Consistent product UI
                          library                 

  Backend                 Java Spring Boot        Matches backend/SaaS
                                                  strengths; mature
                                                  ecosystem

  API                     REST + OpenAPI          Simple integrations and
                                                  generated clients

  Database                PostgreSQL              Strong relational
                                                  model + JSONB

  Cache                   Redis                   Sessions, rate limits,
                                                  queues where useful

  Storage                 S3-compatible object    Documents are large and
                          storage                 immutable/versioned

  Queue                   SQS/Service Bus         Reliable async
                                                  processing

  Search                  Postgres FTS initially  Avoid premature search
                                                  infrastructure

  OCR                     Managed document OCR    Lower operational
                                                  burden

  AI                      LLM provider behind an  Swap models and enforce
                          abstraction             controls

  Auth                    Managed identity        MFA, password recovery,
                          provider                sessions

  Payments                Stripe                  Subscriptions and
                                                  invoices

  Email                   Transactional email     Reliable delivery and
                          provider                webhooks

  Monitoring              OpenTelemetry + cloud   Tracing and operational
                          monitoring              visibility

  Deployment              Docker + managed        Simple scaling and
                          container platform      portability

  CI/CD                   GitHub Actions          Automated
                                                  build/test/deploy
  -----------------------------------------------------------------------

# 10. API Design

  --------------------------------------------------------------------------------------
  **Method**              **Endpoint**                           **Purpose**
  ----------------------- -------------------------------------- -----------------------
  POST                    /api/v1/cases                          Create case

  GET                     /api/v1/cases                          List/search cases

  GET                     /api/v1/cases/{id}                     Get case workspace data

  PATCH                   /api/v1/cases/{id}                     Update case

  POST                    /api/v1/cases/{id}/invite-client       Invite client

  GET                     /api/v1/cases/{id}/checklist           Get checklist

  POST                    /api/v1/checklist-items/{id}/request   Request item

  PATCH                   /api/v1/checklist-items/{id}           Update item status

  POST                    /api/v1/documents/presign              Get upload URL

  POST                    /api/v1/documents/{id}/complete        Finalize upload

  GET                     /api/v1/documents/{id}                 Get document metadata

  POST                    /api/v1/documents/{id}/process         Start/retry processing

  POST                    /api/v1/cases/{id}/ai-summary          Generate summary

  GET                     /api/v1/cases/{id}/deadlines           List deadlines

  POST                    /api/v1/deadlines                      Create deadline

  GET                     /api/v1/templates                      List templates

  POST                    /api/v1/templates                      Create template

  PATCH                   /api/v1/templates/{id}                 Update/version template

  GET                     /api/v1/audit-events                   Audit log
  --------------------------------------------------------------------------------------

## 10.1 API security

-   Authenticate every staff API request.

-   Authorize by firm_id and role on every resource access.

-   Client tokens must be scoped to a single client/case and expire.

-   Use signed, short-lived upload URLs.

-   Rate-limit authentication, uploads, AI generation, and public
    endpoints.

-   Validate all file metadata server-side; never trust browser MIME
    type.

-   Use idempotency keys for case creation, payment webhooks, document
    finalization, and reminder sends.

# 11. Detailed User Flows

  -----------------------------------------------------------------------
  **Flow**                            **Sequence**
  ----------------------------------- -----------------------------------
  New Firm                            Landing → Sign Up → Verify → Create
                                      Firm → Choose plan/trial →
                                      Onboarding → Cases

  New Case                            Cases → New Case → Select client →
                                      Select case type → Select template
                                      → Case created → Checklist
                                      instantiated

  Client Invite                       Case → Invite Client → Verify email
                                      → Client receives link → OTP/magic
                                      link → Portal

  Client Upload                       Portal → Item → Upload → Scan →
                                      Store → Process → Item Submitted →
                                      Staff notification

  Replace Document                    Staff marks Needs Replacement →
                                      Client notification → Client
                                      uploads new version → Old version
                                      retained

  Accept Document                     Staff opens item → Viewer → Review
                                      → Accept → Checklist progress
                                      updates

  Reminder                            Scheduler → Query eligible items →
                                      Create notification → Send → Record
                                      provider response → Activity event

  AI Summary                          Case → AI Summary → Select sources
                                      → Generate → Retrieval → LLM →
                                      Draft + citations → Staff review →
                                      Approve/export

  Deadline                            Case → Deadlines → Create → Choose
                                      source/manual → Confirm timezone →
                                      Schedule alert → Reminder →
                                      Complete/waive

  Template                            Templates → New → Case type →
                                      Checklist → Intake questions →
                                      Reminder defaults → Save Draft →
                                      Publish version
  -----------------------------------------------------------------------

# 12. AI Architecture and Guardrails

## 12.1 AI capabilities

-   Document classification: identify likely document category.

-   Field extraction: names, dates, employers, education, document
    identifiers, etc., only for configured schemas.

-   Completeness assistance: compare expected item metadata to uploaded
    content.

-   Case summarization: synthesize staff-approved source material.

-   Client communication drafts: explain requested administrative items
    in plain language.

-   Search/Q&A over case documents may be added later, with strict
    source grounding.

## 12.2 AI pipeline

> Upload\
> -\> Malware scan\
> -\> OCR/text extraction\
> -\> Document classification\
> -\> Structured extraction\
> -\> Confidence scoring\
> -\> Human-review queue\
> -\> Persist approved facts\
> -\> Retrieval index\
> -\> AI summary generation\
> -\> Source validation\
> -\> Staff review\
> -\> Approved output

## 12.3 AI safety rules

-   Do not state that a client qualifies for a visa or immigration
    benefit unless the product is explicitly redesigned as
    attorney-controlled legal decision support and appropriately
    validated.

-   Do not fabricate facts. Missing information should be labeled
    missing.

-   Show source references for generated factual claims.

-   Preserve original documents and extracted values independently.

-   Prompt-injection defense: treat uploaded document text as untrusted
    data, never as instructions.

-   Do not send more client data to an AI provider than needed for the
    requested task.

-   Allow firms to disable AI processing.

-   Maintain model/version/prompt metadata for auditability.

# 13. Security, Privacy, and Compliance Baseline

-   TLS in transit; encryption at rest.

-   Strict tenant isolation using firm_id scoping and automated
    authorization tests.

-   MFA for staff accounts; optional/required MFA by plan.

-   Least-privilege service identities.

-   Secrets in managed secret storage, never source control.

-   Immutable audit trail for authentication, document access,
    downloads, sharing, exports, role changes, and AI generation.

-   Malware scanning on every uploaded file.

-   Signed temporary URLs for document access.

-   Configurable data retention and deletion workflows.

-   Backups with tested restore procedures.

-   Data processing/vendor inventory and contracts should be reviewed
    before production launch.

-   For US/EU operations, obtain qualified legal/privacy advice on
    applicable obligations such as GDPR, state privacy laws, breach
    notification, data residency, and attorney-client confidentiality.

# 14. QA Strategy

## 14.1 Test layers

  -----------------------------------------------------------------------
  **Layer**                           **Coverage**
  ----------------------------------- -----------------------------------
  Unit                                Domain rules, status transitions,
                                      calculations, permissions

  Integration                         DB, storage, email, queue, OCR, AI
                                      abstraction, billing webhooks

  API                                 Authentication, authorization,
                                      validation, idempotency

  E2E                                 Critical staff/client workflows

  Security                            Tenant isolation, upload security,
                                      token expiry, privilege escalation

  AI evaluation                       Extraction accuracy, hallucination
                                      checks, source grounding

  Performance                         Case list, uploads, dashboard,
                                      concurrent portal use

  Recovery                            Queue retry, failed uploads,
                                      provider outage, DB restore
  -----------------------------------------------------------------------

## 14.2 Master feature test cases

  ----------------------------------------------------------------------------
  **ID**            **Feature**       **Scenario**      **Expected**
  ----------------- ----------------- ----------------- ----------------------
  AUTH-001          Sign up           Create firm with  Firm and admin user
                                      valid data        created; verification
                                                        sent

  AUTH-002          Sign up           Duplicate email   Creation rejected with
                                                        safe error

  AUTH-003          Login             Valid credentials Session issued

  AUTH-004          Authorization     User accesses     403/404; no data
                                      another firm\'s   leakage
                                      case              

  AUTH-005          Client token      Expired portal    Access denied; re-auth
                                      token             required

  CASE-001          Create case       Valid client +    Case and checklist
                                      template          created

  CASE-002          Create case       Missing required  Validation prevents
                                      field             creation

  CASE-003          Case search       Search client     Correct cases returned
                                      name              within tenant

  CASE-004          Status            Invalid status    Rejected and audited
                                      transition        

  CHK-001           Checklist         Create case from  Expected items
                                      template          instantiated

  CHK-002           Checklist         Mark item         Progress recalculates
                                      accepted          

  CHK-003           Checklist         Waive required    Reason required; audit
                                      item              event recorded

  DOC-001           Upload            Valid PDF         Upload succeeds and
                                                        processing starts

  DOC-002           Upload            Oversized file    Rejected before
                                                        storage

  DOC-003           Upload            Malicious file    Quarantined/rejected

  DOC-004           Versioning        Replace document  New version created;
                                                        old version retained

  DOC-005           Access            Client opens      Denied
                                      staff-only        
                                      document          

  DOC-006           Processing        OCR provider      Retry/backoff and
                                      failure           visible error

  REM-001           Reminder          Due item          Reminder
                                                        scheduled/sent

  REM-002           Reminder          Item accepted     Reminder cancelled
                                      before reminder   

  REM-003           Reminder          Repeated overdue  No duplicate send
                                      item              beyond policy

  AI-001            Extraction        Known document    Expected fields
                                      sample            extracted within
                                                        acceptance threshold

  AI-002            Extraction        Low-confidence    Flagged for review
                                      field             

  AI-003            Summary           Selected source   Draft generated with
                                      documents         source references

  AI-004            Summary           Prompt injection  Document instructions
                                      in document       ignored

  AI-005            Summary           Missing fact      Model says
                                                        unknown/missing rather
                                                        than inventing

  DL-001            Deadline          Create            Correct stored UTC
                                      timezone-aware    instant and displayed
                                      deadline          local time

  DL-002            Deadline          Complete deadline Future alerts
                                                        cancelled

  TPL-001           Template          Create draft      Draft saved
                                      template          

  TPL-002           Template          Publish template  New version immutable

  TPL-003           Template          Edit published    New version created;
                                      template          existing cases
                                                        unchanged

  PORT-001          Portal            Client sees case  Only their case is
                                                        visible

  PORT-002          Portal            Client uploads    Correct checklist item
                                      requested item    updated

  BILL-001          Billing           Successful        Subscription active
                                      checkout          

  BILL-002          Billing           Payment failure   Subscription status
                                      webhook           updated

  AUD-001           Audit             Download document Audit event recorded

  AUD-002           Audit             Role change       Old/new role recorded
  ----------------------------------------------------------------------------

## 14.3 Additional security test cases

  -----------------------------------------------------------------------
  **ID**            **Scenario**      **Action**        **Expected**
  ----------------- ----------------- ----------------- -----------------
  SEC-001           Tenant ID         Replace firm_id   Request denied
                    tampering         in API request    

  SEC-002           Object ID         Access random     No unauthorized
                    guessing          document UUID     data

  SEC-003           Client escalation Modify client     Denied
                                      token to another  
                                      case              

  SEC-004           Role escalation   Paralegal calls   Denied
                                      admin endpoint    

  SEC-005           Signed URL        Reuse expired URL Download denied

  SEC-006           XSS               Upload/submit     Rendered safely
                                      HTML in client    
                                      name              

  SEC-007           Injection         SQL-like input in No SQL injection
                                      search            

  SEC-008           Prompt injection  Uploaded document LLM treats as
                                      contains          untrusted content
                                      instructions      

  SEC-009           PII logs          Trigger           Logs do not
                                      extraction        expose raw
                                      failure           sensitive
                                                        document contents

  SEC-010           Webhook spoofing  Fake billing      Rejected without
                                      webhook           valid signature
  -----------------------------------------------------------------------

# 15. Definition of Done

-   Feature works through UI and API.

-   Happy-path and negative-path tests exist.

-   Authorization tests cover every new resource.

-   Audit events exist for sensitive operations.

-   Errors are user-readable and developer-diagnosable.

-   Loading, empty, error, and retry states are designed.

-   Mobile client portal is usable.

-   Analytics/events are emitted for important product actions.

-   Documentation and OpenAPI are updated.

-   Database migrations are reversible or have a documented recovery
    strategy.

-   Production monitoring and alerting exist before launch.

# 16. Product Analytics

  -----------------------------------------------------------------------
  **Event**                           **Why measure it**
  ----------------------------------- -----------------------------------
  firm_created                        Activation funnel

  case_created                        Core adoption

  client_invited                      Portal adoption

  client_portal_opened                Invitation effectiveness

  document_uploaded                   Collection activity

  document_accepted                   Operational completion

  reminder_sent                       Automation usage

  reminder_resolved                   Reminder effectiveness

  ai_summary_generated                AI adoption

  ai_summary_approved                 AI usefulness

  deadline_created                    Deadline feature usage

  template_published                  Standardization

  subscription_started                Revenue conversion

  subscription_cancelled              Retention
  -----------------------------------------------------------------------

# 17. Engineering Roadmap

  -----------------------------------------------------------------------
  **Sprint**              **Focus**               **Deliverables**
  ----------------------- ----------------------- -----------------------
  Sprint 0                Architecture + design   Repo, CI/CD,
                          system + auth skeleton  environments, DB, auth,
                                                  UI shell

  Sprint 1                V1 Cases                Firm, users, clients,
                                                  cases, statuses, audit

  Sprint 2                V1 Checklist/Templates  Case types, checklist,
                          foundation              template instantiation

  Sprint 3                V2 Client portal        Invite, auth, portal,
                                                  upload

  Sprint 4                V2 Document lifecycle   Versioning, review,
                                                  replace, download

  Sprint 5                V3 Reminders            Scheduler, templates,
                                                  email, preferences

  Sprint 6                V4 Processing           OCR, classification,
                                                  extraction queue

  Sprint 7                V5 Completeness         Rules engine,
                                                  confidence, review UI

  Sprint 8                V6 AI summaries         Retrieval, prompts,
                                                  source citations,
                                                  approval

  Sprint 9                V7 Deadlines            Deadline model,
                                                  reminders, timezone
                                                  handling

  Sprint 10               V8 Templates            Template builder,
                                                  versioning, publishing

  Sprint 11               Hardening               Security, performance,
                                                  billing, backups,
                                                  observability

  Sprint 12               Beta                    Pilot firms, bug fixes,
                                                  onboarding, analytics
  -----------------------------------------------------------------------

# 18. Repository Structure

> /apps\
> /web\
> /staff\
> /portal\
> /api\
> /packages\
> /ui\
> /types\
> /api-client\
> /config\
> /services\
> /document-worker\
> /notification-worker\
> /ai-worker\
> /infrastructure\
> /terraform-or-bicep\
> /docs\
> /api\
> /architecture\
> /runbooks\
> /tests\
> /unit\
> /integration\
> /e2e\
> /security\
> /ai-evals

# 19. Background Jobs and Events

  -----------------------------------------------------------------------
  **Job/Event**           **Trigger**             **Retry strategy**
  ----------------------- ----------------------- -----------------------
  document.scan           Upload finalized        Exponential backoff;
                                                  dead-letter after limit

  document.extract        Scan passed             Retry provider failures

  document.classify       Text extracted          Retry model/provider
                                                  failures

  document.completeness   Extraction completed    Idempotent recompute

  notification.send       Reminder due            Provider retry +
                                                  idempotency

  deadline.remind         Scheduled deadline      Idempotent
                          window                  

  ai.summary.generate     User request            Short retry;
                                                  user-visible failure

  billing.sync            Payment webhook         Signature
                                                  verification +
                                                  idempotency
  -----------------------------------------------------------------------

# 20. Observability and Operations

-   Track request latency, error rate, queue depth, failed jobs, upload
    failures, email failures, AI failures, and storage failures.

-   Correlate API request ID → audit event → background job ID.

-   Alert on repeated tenant-isolation errors, authentication anomalies,
    queue backlog, failed backups, and provider outages.

-   Create runbooks for: DB outage, object storage outage, email outage,
    OCR outage, LLM outage, billing webhook outage, and compromised
    account.

-   Do not place document contents or unnecessary PII in application
    logs.

# 21. Master Build Checklist

-   [ ] Define firm/client/user permission matrix

-   [ ] Create database schema and migrations

-   [ ] Implement authentication and MFA-ready architecture

-   [ ] Implement tenant isolation middleware

-   [ ] Implement firm onboarding

-   [ ] Implement client CRUD

-   [ ] Implement case CRUD

-   [ ] Implement case status state machine

-   [ ] Implement checklist templates

-   [ ] Implement checklist item lifecycle

-   [ ] Implement staff case workspace

-   [ ] Implement client invitation

-   [ ] Implement client portal

-   [ ] Implement secure file upload

-   [ ] Implement object storage versioning

-   [ ] Implement malware scanning

-   [ ] Implement document viewer/download permissions

-   [ ] Implement reminder engine

-   [ ] Implement email templates

-   [ ] Implement notification preferences

-   [ ] Implement document OCR pipeline

-   [ ] Implement document classification

-   [ ] Implement structured extraction

-   [ ] Implement extraction review UI

-   [ ] Implement completeness rule engine

-   [ ] Implement AI summary pipeline

-   [ ] Implement source citations in AI output

-   [ ] Implement AI approval workflow

-   [ ] Implement deadline model

-   [ ] Implement timezone-aware reminders

-   [ ] Implement template builder

-   [ ] Implement template versioning

-   [ ] Implement audit log

-   [ ] Implement billing/subscriptions

-   [ ] Implement product analytics

-   [ ] Implement automated unit tests

-   [ ] Implement API integration tests

-   [ ] Implement E2E tests

-   [ ] Implement security tests

-   [ ] Implement AI evaluation suite

-   [ ] Implement backups and restore test

-   [ ] Implement monitoring and alerts

-   [ ] Write production runbooks

-   [ ] Pilot with 3--5 firms before broad launch

# 22. Major Risks and Mitigations

  -----------------------------------------------------------------------
  **Risk**                **Impact**              **Mitigation**
  ----------------------- ----------------------- -----------------------
  Incorrect legal         Critical                Keep product
  guidance                                        administrative;
                                                  attorney review;
                                                  source-backed AI;
                                                  disclaimers

  Data breach             Critical                Encryption, MFA,
                                                  isolation, least
                                                  privilege, audit,
                                                  security testing

  AI hallucination        High                    Grounding, citations,
                                                  confidence, human
                                                  approval

  Incorrect document      Medium                  Human review and
  classification                                  correction feedback

  Reminder spam           Medium                  Firm-configurable
                                                  cadence and stop
                                                  conditions

  Complex legal rule      High                    Versioned
  changes                                         templates/rules with
                                                  explicit ownership and
                                                  review

  Vendor outage           Medium                  Retries, queues,
                                                  graceful degradation

  Overbuilding            High                    Keep first product
                                                  centered on case →
                                                  checklist → client
                                                  upload
  -----------------------------------------------------------------------

# 23. Recommended MVP Boundary

For the first paid beta, build only the smallest coherent loop: Firm →
Case → Checklist → Client Portal → Upload → Staff Review → Reminder. Do
not delay launch for AI. AI extraction and summaries should be layered
onto a proven document workflow.

-   The product is already sellable when a firm can create a case, send
    a client a secure link, collect documents, see missing items, and
    automatically chase outstanding items.

-   V4--V6 increase productivity after the workflow has real data and
    users.

-   V7--V8 turn the product into a repeatable firm operating system.

# 24. Final Target Workflow

> FIRM\
> \|\
> +\--\> CREATE CASE\
> \|\
> +\--\> SELECT CASE TYPE / TEMPLATE\
> \|\
> +\--\> CHECKLIST CREATED\
> \|\
> +\--\> INVITE CLIENT\
> \|\
> v\
> CLIENT\
> \|\
> +\--\> COMPLETE INTAKE\
> \|\
> +\--\> UPLOAD DOCUMENTS\
> \|\
> v\
> DOCUMENT PIPELINE\
> Scan -\> OCR -\> Classify -\> Extract\
> \|\
> v\
> STAFF REVIEW\
> Accept / Replace / Waive\
> \|\
> +\--\> REMIND IF MISSING\
> \|\
> +\--\> TRACK DEADLINES\
> \|\
> +\--\> GENERATE AI SUMMARY\
> \|\
> v\
> ATTORNEY REVIEW\
> \|\
> v\
> APPROVED OUTPUT\
> \|\
> v\
> CLOSED CASE

# 25. Suggested Launch Metrics

  -----------------------------------------------------------------------
  **Metric**                          **Initial target to validate
                                      product**
  ----------------------------------- -----------------------------------
  Time to create first case           \< 3 minutes

  Client portal activation            \> 70% of invited clients

  Document collection completion      Meaningful improvement vs. firm\'s
                                      current process

  Reminder resolution rate            \> 30% within defined reminder
                                      window

  AI summary approval rate            \> 70% of generated drafts
                                      edited/approved

  Weekly active firms                 Growing week over week

  Trial-to-paid                       Validate against real pilot cohort
                                      rather than arbitrary benchmark

  Monthly churn                       Track by firm size and use case
  -----------------------------------------------------------------------

**End of document**
