# Repository Security Assessment: Verdict Lab 🧪

**Generated Date**: 2026-08-26  
**Auditor**: Senior Application Security Auditor  
**Repository Target**: Verdict Lab (Full-Stack React + Express + Firebase + Google GenAI)  
**Assessment Mode**: Evidence-Based Static & Architectural Code Audit  

---

## Executive Summary

A comprehensive security audit of the **Verdict Lab** codebase was performed across twelve core security domains: **Authentication**, **Authorization**, **Secrets Management**, **Dependencies**, **Input Validation**, **Data Handling**, **Encryption**, **Logging**, **Error Handling**, **API Security**, and **Infrastructure**.

The assessment identified **14 distinct findings**, categorizing confirmed vulnerabilities, positive defensive patterns, and suspected risks based strictly on observable repository evidence. 

### Key Highlights
- **Critical & High Priority Flaws**: 
  1. **Broken Object Level Authorization (BOLA)** in `firestore.rules`, where the `isOwner` helper only checks if `ownerId` is a non-empty string rather than validating against `request.auth.uid`.
  2. **Unrestricted Public Reads** across all Firestore collections (`test_cards`, `test_card_versions`, `experiments`), exposing private research data.
  3. **Unauthenticated Expensive API Endpoints** on backend routes (`/api/evaluate` and `/api/inference`), lacking rate limiting and token verification.
- **Positive Security Implementations**:
  1. **Server-Side API Key Isolation**: `GEMINI_API_KEY` is strictly isolated to the Express backend and not bundled into client-side code.
  2. **Modern Dependency Stack**: Modern, actively maintained packages (`express` 4.21.2, `react` 19.0.1, `@google/genai` 1.29.0) with no legacy or deprecated runtime components.
  3. **Container Ingress Compliance**: Server binds to port 3000 on host `0.0.0.0` with separation of static assets and API routes.

---

## Findings Matrix

| ID | Title | Category | Severity | Confidence |
|---|---|---|---|---|
| `SEC-001` | Broken Object Level Authorization (BOLA) in Firestore Rules | Authorization | **CRITICAL** | **CONFIRMED** |
| `SEC-002` | Unrestricted Public Read Access to All Firestore Collections | Authorization | **HIGH** | **CONFIRMED** |
| `SEC-003` | Unauthenticated Server-Side Gemini API Proxy Routes | Authentication / API Security | **HIGH** | **CONFIRMED** |
| `SEC-004` | Missing Rate Limiting on Cost-Intensive AI Generation Endpoints | API Security | **HIGH** | **CONFIRMED** |
| `SEC-005` | Lack of Input Schema Validation and Unbounded Model Invocations | Input Validation | **HIGH** | **CONFIRMED** |
| `SEC-006` | Shared Static Identifier in Guest Bypass Mode | Authentication | **MEDIUM** | **CONFIRMED** |
| `SEC-007` | Dual-Auth Identity Disconnect (Firebase vs Supabase) | Authentication | **MEDIUM** | **CONFIRMED** |
| `SEC-008` | Missing Security Headers and CORS Policy Configuration | Infrastructure / API Security | **MEDIUM** | **CONFIRMED** |
| `SEC-009` | Dynamic Regular Expression Injection in Variable Replacement | Input Validation | **MEDIUM** | **CONFIRMED** |
| `SEC-010` | Unbounded Collection Read in Server-Side Leaderboard Aggregation | Data Handling | **MEDIUM** | **CONFIRMED** |
| `SEC-011` | Plaintext User Identity Storage in Browser LocalStorage | Data Handling | **LOW** | **CONFIRMED** |
| `SEC-012` | Upstream Error Message Reflection to API Clients | Error Handling | **LOW** | **CONFIRMED** |
| `SEC-013` | Unstructured Error Logging without Correlation Context | Logging | **LOW** | **CONFIRMED** |
| `SEC-014` | Server-Side Secret Key Isolation Verification | Secrets Management | **INFO** | **CONFIRMED** |

---

## Detailed Findings by Domain

### 1. Authorization

#### id: `SEC-001`
- **title**: Broken Object Level Authorization (BOLA) in Firestore Rules
- **severity**: CRITICAL
- **category**: Authorization
- **location**: `/firestore.rules` (lines 9–29)
- **evidence**:
  ```javascript
  function isOwner(data) {
    return data.ownerId is string && data.ownerId.size() > 0;
  }

  match /test_cards/{cardId} {
    allow read: if true;
    allow create: if isOwner(request.resource.data);
    allow update, delete: if isOwner(resource.data);
  }

  match /test_card_versions/{versionId} {
    allow read: if true;
    allow create: if isOwner(request.resource.data);
    allow update, delete: if isOwner(resource.data);
  }

  match /experiments/{expId} {
    allow read: if true;
    allow create: if isOwner(request.resource.data);
    allow update, delete: if isOwner(resource.data);
  }
  ```
- **impact**: The `isOwner` helper evaluates to `true` whenever `data.ownerId` is any non-empty string. It does not verify that `request.auth.uid == data.ownerId` or that `request.auth != null`. Consequently, any user (or unauthenticated actor with client credentials) can modify or delete any test card, version snapshot, or experiment record across the entire database.
- **recommendation**: Refactor `firestore.rules` to enforce cryptographic ownership checks using `request.auth != null && request.auth.uid == resource.data.ownerId`, enforce `email_verified == true` for standard writes, and implement strict schema and key validations using standalone `isValid[Entity]` helpers.
- **confidence**: CONFIRMED

---

#### id: `SEC-002`
- **title**: Unrestricted Public Read Access to All Firestore Collections
- **severity**: HIGH
- **category**: Authorization
- **location**: `/firestore.rules` (lines 14, 20, 26)
- **evidence**:
  ```javascript
  match /test_cards/{cardId} {
    allow read: if true;
  }
  match /test_card_versions/{versionId} {
    allow read: if true;
  }
  match /experiments/{expId} {
    allow read: if true;
  }
  ```
- **impact**: All documents across all collections are readable by anyone without authentication. While `test_cards` includes an `isPublic` property in its schema (`firebase-blueprint.json`), the rules do not distinguish between public cards and private cards, exposing confidential experiment hypotheses, prompt variations, and judge verdicts.
- **recommendation**: Restrict `allow read` on `test_cards` to `resource.data.isPublic == true || (request.auth != null && resource.data.ownerId == request.auth.uid)`. Restrict `test_card_versions` and `experiments` to only the authenticated document owner.
- **confidence**: CONFIRMED

---

### 2. Authentication

#### id: `SEC-003`
- **title**: Unauthenticated Server-Side Gemini API Proxy Routes
- **severity**: HIGH
- **category**: Authentication / API Security
- **location**: `/server.ts` (lines 36–182, 184–215, 218–270)
- **evidence**:
  ```typescript
  app.post("/api/evaluate", async (req, res) => { ... });
  app.post("/api/inference", async (req, res) => { ... });
  app.get("/api/leaderboard", async (req, res) => { ... });
  ```
  No authentication middleware, session checking, or Firebase Auth ID token verification is attached to these routes.
- **impact**: Any internet client that sends HTTP POST requests to `/api/evaluate` or `/api/inference` can execute LLM queries on Google Gemini models using the server's private `GEMINI_API_KEY`, bypassing client-side login protections entirely.
- **recommendation**: Implement an authentication middleware (e.g. Firebase Admin SDK `auth.verifyIdToken(bearerToken)`) to authenticate requests before invoking LLM generation.
- **confidence**: CONFIRMED

---

#### id: `SEC-004`
- **title**: Missing Rate Limiting on Cost-Intensive AI Generation Endpoints
- **severity**: HIGH
- **category**: API Security
- **location**: `/server.ts` (lines 36, 184)
- **evidence**:
  `server.ts` does not register rate limiting middleware (such as `express-rate-limit`).
- **impact**: Malicious actors or automated scripts can flood `/api/evaluate` with concurrent requests, generating hundreds of simultaneous multi-judge model calls, rapidly exhausting API quota and generating substantial financial billing liability.
- **recommendation**: Add `express-rate-limit` with strict window limits (e.g., max 20 evaluation requests per minute per IP/user) and integrate IP/User throttling on `/api/evaluate` and `/api/inference`.
- **confidence**: CONFIRMED

---

#### id: `SEC-006`
- **title**: Shared Static Identifier in Guest Bypass Mode
- **severity**: MEDIUM
- **category**: Authentication
- **location**: `/src/App.tsx` (lines 135–143)
- **evidence**:
  ```typescript
  const handleBypass = () => {
    setUser({
      id: 'guest_user',
      email: 'guest@verdict-lab.internal',
      displayName: 'Guest Researcher',
      isGuest: true
    });
    navigate('/', { replace: true });
  };
  ```
- **impact**: All users entering the application via Guest Mode are assigned the identical hardcoded ID `'guest_user'`. Queries filtering `where('ownerId', '==', user.id)` will display cards and experiments created by other guest users, leading to data collisions and cross-user visibility.
- **recommendation**: Replace the static string with a cryptographically generated UUID (e.g., `guest_${crypto.randomUUID()}`) or Firebase Anonymous Authentication (`signInAnonymously(auth)`).
- **confidence**: CONFIRMED

---

#### id: `SEC-007`
- **title**: Dual-Auth Identity Disconnect (Firebase vs Supabase)
- **severity**: MEDIUM
- **category**: Authentication
- **location**: `/src/App.tsx` (lines 69–133, 326–337) and `/src/lib/firebase.ts`
- **evidence**:
  When a user logs in via Supabase Email/Password (`supabase.auth.signInWithPassword`), Firebase Auth (`auth.currentUser`) remains unauthenticated (`null`). However, the UI continues to query and write to Firestore using `user.id` from Supabase as `ownerId`.
- **impact**: If Firestore security rules are updated to enforce `request.auth.uid`, all users signed in through Supabase will encounter `PERMISSION_DENIED` errors because the Firebase client token is unauthenticated.
- **recommendation**: Standardize on a single unified authentication provider (prefer Firebase Auth Google Sign-In and Email/Password with Firebase Auth) or issue Firebase Custom Tokens upon Supabase verification.
- **confidence**: CONFIRMED

---

### 3. Input Validation

#### id: `SEC-005`
- **title**: Lack of Input Schema Validation and Unbounded Model Invocations
- **severity**: HIGH
- **category**: Input Validation
- **location**: `/server.ts` (lines 38, 94–104, 186, 200–208)
- **evidence**:
  ```typescript
  const { variantA, variantB, rubric, hypothesis, models = ["gemini-3.5-flash"] } = req.body;
  ...
  const judgePromises = activeModels.map(async (model: string) => { ... });
  ```
  ```typescript
  const { prompt, systemInstruction, config = {} } = req.body;
  ...
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...config,
      model: undefined,
      systemInstruction,
    }
  });
  ```
- **impact**:
  1. If `models` contains an array of 50 strings, the server will invoke `Promise.all` across 50 concurrent Google GenAI requests.
  2. No length or type validation is performed on `variantA`, `variantB`, `hypothesis`, or `prompt`.
  3. Spreading arbitrary `config` directly into `generateContent` allows clients to override unexpected model parameters.
- **recommendation**: Implement request validation (e.g., using `zod` or explicit boundary checks) to cap model array length (max 3 models), validate string lengths (e.g., max 10,000 characters per prompt), and allowlist approved generation config parameters (`temperature`, `topP`, `topK`).
- **confidence**: CONFIRMED

---

#### id: `SEC-009`
- **title**: Dynamic Regular Expression Injection in Variable Replacement
- **severity**: MEDIUM
- **category**: Input Validation
- **location**: `/src/pages/Arena.tsx` (lines 89–91)
- **evidence**:
  ```typescript
  Object.entries(inputs).forEach(([key, val]) => {
    renderedPrompt = renderedPrompt.replace(new RegExp(`{${key}}`, 'g'), val);
  });
  ```
- **impact**: The variable name `key` is interpolated directly into `new RegExp()` without escaping regex metacharacters (`.`, `*`, `+`, `?`, `^`, `$`, `(`, `)`, `[`, `]`, `{`, `}`, `|`, `\`). If a user inputs a template variable containing regex characters, it may cause execution syntax errors or Regular Expression Denial of Service (ReDoS).
- **recommendation**: Escape special regex characters prior to compiling regular expressions:
  ```typescript
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  renderedPrompt = renderedPrompt.replace(new RegExp(`\\{${escapeRegex(key)}\\}`, 'g'), val);
  ```
- **confidence**: CONFIRMED

---

### 4. Infrastructure & API Security

#### id: `SEC-008`
- **title**: Missing Security Headers and CORS Policy Configuration
- **severity**: MEDIUM
- **category**: Infrastructure / API Security
- **location**: `/server.ts` (lines 12–15)
- **evidence**:
  `server.ts` configures only `app.use(express.json())`. Standard defensive HTTP headers (`helmet`, CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) are not registered.
- **impact**: The web application lacks browser-level defense-in-depth protections against MIME-type sniffing, clickjacking, and unauthorized cross-origin embedding.
- **recommendation**: Install and configure `helmet` middleware in `server.ts` with appropriate Content Security Policy directives.
- **confidence**: CONFIRMED

---

### 5. Data Handling & Secrets Management

#### id: `SEC-010`
- **title**: Unbounded Collection Read in Server-Side Leaderboard Aggregation
- **severity**: MEDIUM
- **category**: Data Handling
- **location**: `/server.ts` (lines 225–228)
- **evidence**:
  ```typescript
  const experimentsRef = collection(serverDb, 'experiments');
  const snapshot = await getDocs(experimentsRef);
  const experiments = snapshot.docs.map(doc => doc.data());
  ```
- **impact**: The `/api/leaderboard` endpoint performs an unbounded `getDocs` read of the entire `experiments` collection in Firestore on every request. As the number of experiments grows to thousands of records, this will lead to high Firestore read costs, increased latency, and server memory exhaustion.
- **recommendation**: Implement query limits (e.g. `limit(200)`), timestamp filtering (e.g. `where('createdAt', '>=', thirtyDaysAgo)`), or incremental counter documents in Firestore to maintain aggregated statistics without full-collection scans.
- **confidence**: CONFIRMED

---

#### id: `SEC-011`
- **title**: Plaintext User Identity Storage in Browser LocalStorage
- **severity**: LOW
- **category**: Data Handling
- **location**: `/src/store/useStore.ts` (lines 19–31)
- **evidence**:
  `useStore` uses `persist` with `name: 'verdict-lab-storage'`, storing user identity information (`id`, `email`, `displayName`) in unencrypted browser `localStorage`.
- **impact**: If any client-side cross-site scripting (XSS) vulnerability occurs, an attacker can access `localStorage` and retrieve cached user profile identifiers.
- **recommendation**: Store only session references or synchronize state with authenticated Firebase Auth session cookies/tokens rather than duplicate profile objects in `localStorage`.
- **confidence**: CONFIRMED

---

#### id: `SEC-014`
- **title**: Server-Side Secret Key Isolation Verification
- **severity**: INFO
- **category**: Secrets Management
- **location**: `/server.ts` (lines 17, 44, 192) and `/.env.example` (lines 1–5)
- **evidence**:
  `GEMINI_API_KEY` is loaded exclusively in Node.js via `process.env.GEMINI_API_KEY`. No `VITE_GEMINI_API_KEY` prefix exists in client code or frontend builds.
- **impact**: Positive security posture. Private model API credentials are fully protected from client bundle extraction.
- **recommendation**: Maintain this isolation pattern for any future external API integrations.
- **confidence**: CONFIRMED

---

### 6. Logging & Error Handling

#### id: `SEC-012`
- **title**: Upstream Error Message Reflection to API Clients
- **severity**: LOW
- **category**: Error Handling
- **location**: `/server.ts` (lines 180, 213, 268)
- **evidence**:
  ```typescript
  res.status(500).json({ error: error?.message || "Internal server error during evaluation" });
  ```
- **impact**: If upstream SDKs (e.g. `@google/genai` or `@firebase/firestore`) throw exceptions with internal system details, endpoints reflect `error.message` verbatim to external clients.
- **recommendation**: Return generic, user-safe error messages in HTTP responses while preserving detailed stack traces in internal server logs.
- **confidence**: CONFIRMED

---

#### id: `SEC-013`
- **title**: Unstructured Error Logging without Correlation Context
- **severity**: LOW
- **category**: Logging
- **location**: `/server.ts` (lines 32, 117, 179, 212, 267)
- **evidence**:
  Errors are logged using standard `console.error` without structured metadata (e.g., request ID, timestamp, client IP hash).
- **impact**: Makes root-cause analysis and intrusion detection difficult in production container environments.
- **recommendation**: Adopt a structured JSON logger (e.g., `pino` or `winston`) with correlation request IDs.
- **confidence**: CONFIRMED

---

## Remediation Roadmap & Security Priority

```text
[PHASE 1: CRITICAL/HIGH IMMEDIATE REMEDIATION]
├── 1. Harden firestore.rules to enforce request.auth.uid ownership (SEC-001)
├── 2. Restrict public read permissions to public cards only (SEC-002)
├── 3. Add authentication verification to /api/evaluate and /api/inference (SEC-003)
├── 4. Add rate limiting middleware to AI proxy routes (SEC-004)
└── 5. Add input boundary checks and model count limits (SEC-005)

[PHASE 2: MEDIUM ARCHITECTURAL HARDENING]
├── 6. Replace static guest ID with unique session IDs (SEC-006)
├── 7. Unify authentication flow to avoid Firebase/Supabase token mismatch (SEC-007)
├── 8. Install helmet and configure HTTP security headers (SEC-008)
├── 9. Add regex metacharacter escaping in prompt variable replacer (SEC-009)
└── 10. Add pagination/limit to /api/leaderboard Firestore queries (SEC-010)

[PHASE 3: OPERATIONAL & HYGIENE IMPROVEMENTS]
├── 11. Sanitize error responses returned to API callers (SEC-012)
├── 12. Transition server console logging to structured JSON logs (SEC-013)
└── 13. Audit client storage to reduce unencrypted profile data in localStorage (SEC-011)
```
