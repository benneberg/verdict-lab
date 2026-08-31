# Security Policy: Verdict Lab 🛡️

Verdict Lab is committed to maintaining the confidentiality, integrity, and availability of experimental prompt data and model evaluation infrastructure. This document outlines our security architecture, policy invariants, and vulnerability reporting process.

---

## 1. Supported Versions

| Version | Supported |
|---|---|
| Latest / `main` branch | ✅ Yes |
| Historical branches / snapshots | ❌ No |

---

## 2. Core Security Architecture & Invariants

Verdict Lab enforces defense-in-depth protections across its frontend, backend API gateway, and cloud persistence layers.

### 2.1 Server-Side API Key Isolation
- **Secret Isolation**: `GEMINI_API_KEY` is loaded exclusively inside the server-side Node.js environment (`server.ts`). It is strictly forbidden to expose or bundle this credential into the client-side JavaScript distribution.
- **Client Model Proxy**: The browser client communicates exclusively through authenticated HTTP proxy endpoints (`/api/evaluate` and `/api/inference`), ensuring private keys are never exposed in browser developer tools or network captures.

### 2.2 Broken Object Level Authorization (BOLA) Prevention
- **Cryptographic UID Verification**: Firestore security rules (`firestore.rules`) enforce strict ownership checks using `request.auth.uid`:
  ```javascript
  function isOwner(userId) {
    return isAuthenticated() && request.auth.uid == userId;
  }
  ```
- **Public Read Restrictions**: Only test cards explicitly marked `isPublic == true` may be read without document ownership. Private test cards and all historical versions are strictly restricted to the authenticated document owner.
- **Strict Private Experiments**: Evaluation records in the `experiments` collection are accessible only by the creator whose `request.auth.uid` matches the document's `ownerId`.

### 2.3 Rate Limiting & Resource Exhaustion Defense
- **Global API Rate Limiter**: All endpoints under `/api/` are throttled using `express-rate-limit` to a ceiling of 120 requests per minute per IP address.
- **AI Inference Rate Limiter**: Cost-intensive endpoints (`/api/evaluate` and `/api/inference`) enforce a stricter rate limit of 30 requests per minute per IP to prevent accidental quota exhaustion or denial-of-wallet attacks.

### 2.4 Input Schema Validation & Boundaries
- **Strict Payload Ceilings**: JSON request bodies are capped at 1MB via `express.json({ limit: "1mb" })`.
- **Character Ceilings**: Evaluated prompt variants are capped at 50,000 characters each; hypotheses are capped at 5,000 characters; system instructions are capped at 15,000 characters.
- **Model Array Caps**: The evaluation engine accepts a maximum of 3 concurrent judge models per request to prevent unbounded concurrent model invocations.
- **Rubric Structure Limits**: Evaluation rubrics are limited to a maximum of 15 metrics, with strict type validation on weights and maximum score fields.

### 2.5 Regular Expression Denial of Service (ReDoS) Resilience
- Template variable interpolation escapes all regex metacharacters (`.*+?^${}()|[]\`) before dynamic regular expression compilation:
  ```typescript
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  renderedPrompt.replace(new RegExp(`\\{${escapeRegex(key)}\\}`, 'g'), val);
  ```
- Unit test specifications in `src/tests/JDay.test.ts` continuously verify ReDoS resilience against nested and catastrophic regex input patterns.

### 2.6 Defensive HTTP Headers
- The Express server registers `helmet` to enforce security headers, including `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and cross-origin resource isolation.

### 2.7 Unbounded Query Protection
- The server-side leaderboard endpoint (`/api/leaderboard`) enforces a hard Firestore query limit of 200 documents (`limit(200)`) to protect against memory exhaustion and runaway database read costs.

### 2.8 Sanitized Error Handling
- Upstream error messages from database and AI model SDKs are sanitized before being returned to API callers, preventing internal stack traces or configuration leaks while maintaining structured logs internally.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability in Verdict Lab, please follow responsible disclosure guidelines:

1. **Do NOT open a public GitHub issue** describing the vulnerability.
2. Email details of the vulnerability to the project maintainers or report via the private repository vulnerability reporting channel.
3. Include:
   - Description of the issue and potential impact
   - Minimal steps to reproduce or proof of concept
   - Relevant source file and line references
4. Maintainers will acknowledge receipt within 48 hours and coordinate remediation before public disclosure.
