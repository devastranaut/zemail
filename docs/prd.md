Here is your **final, refined PRD** aligned with the name:

---

# 📄 PRD — Zemail (MCP Email Agent)

---

# 1. Product Overview

## 1.1 Name

```txt
Zemail
```

## 1.2 Tagline

```txt
Email operations for AI agents via MCP
```

---

## 1.3 Vision

Zemail is a **client-agnostic MCP server** that enables AI agents to:

* send emails
* read inbox
* understand conversations
* generate intelligent replies

👉 It acts as an **AI-native email execution layer**, not a traditional app.

---

## 1.4 Core Principle

```txt
Zemail = Email as tools for AI, not UI for humans
```

---

# 2. Objectives

## Primary Objectives

* Learn and implement MCP correctly
* Build reusable AI tool infrastructure
* Enable any MCP-compatible client to perform email operations

## Secondary Objectives

* Create foundation for:

  * agentic workflows
  * automation systems
  * future SaaS (MCP platform)

---

# 3. Target Users

## Primary

* AI agents (VS Code, CLI agents, custom orchestrators)

## Secondary

* Developers building agentic systems

---

# 4. Scope

## In Scope (v1)

* MCP server (HTTP endpoint)
* Gmail integration (send + read)
* AI integration (summarize + reply)
* 4 core MCP tools
* client-agnostic compatibility

## Out of Scope (v1)

* frontend UI
* multi-user system
* billing
* analytics dashboard

---

# 5. Core Features

---

## 5.1 MCP Server

### Requirements

* Endpoint: `/api/mcp`
* Accept structured JSON requests
* Route requests to tools
* Return standardized MCP responses

---

## 5.2 Tool System

Each tool must:

* have unique namespace-based name
* define JSON schema
* include clear description
* return structured output

---

# 6. Core Tools

---

## 6.1 Tool — `email.send`

```json
{
  "name": "email.send",
  "description": "Send an email via Gmail",
  "inputSchema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "subject": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["to", "subject", "body"]
  }
}
```

---

## 6.2 Tool — `email.read`

```json
{
  "name": "email.read",
  "description": "Fetch latest emails",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": { "type": "number" }
    }
  }
}
```

---

## 6.3 Tool — `email.summarize`

```json
{
  "name": "email.summarize",
  "description": "Summarize an email",
  "inputSchema": {
    "type": "object",
    "properties": {
      "emailId": { "type": "string" }
    },
    "required": ["emailId"]
  }
}
```

---

## 6.4 Tool — `email.reply`

```json
{
  "name": "email.reply",
  "description": "Generate and send a reply",
  "inputSchema": {
    "type": "object",
    "properties": {
      "emailId": { "type": "string" }
    }
  }
}
```

---

# 7. Non-Functional Requirements

---

## 7.1 Client-Agnostic

* Must work with any MCP client
* No dependency on VS Code or specific IDE
* Strict adherence to MCP schema

---

## 7.2 Stateless Design

* No session dependency
* Each request independent

---

## 7.3 Performance

* Fast response (<3 seconds excluding API calls)
* Efficient external API usage

---

## 7.4 Security

* OAuth2 authentication for Gmail via Google Cloud
* API key protection for MCP endpoint
* scoped permissions:

  * gmail.readonly
  * gmail.send

---

# 8. System Architecture

```txt
MCP Clients (VS Code / CLI / Agents)
                ↓
        HTTP Endpoint (/api/mcp)
                ↓
            MCP Server
                ↓
          Tool Registry
   ├── email.send
   ├── email.read
   ├── email.summarize
   └── email.reply
                ↓
     External Services
   ├── Gmail API
   └── OpenAI API
```

---

# 9. Data Flow

---

## 9.1 General Tool Execution

```txt
Client → MCP Request
        ↓
Tool Identification
        ↓
Execute Tool Logic
        ↓
External API Call
        ↓
Return Structured Response
```

---

## 9.2 Auto Reply Flow

```txt
Fetch Email
   ↓
Generate Response (AI)
   ↓
Send Email (Gmail)
   ↓
Return Confirmation
```

---

# 10. API Design

---

## Endpoint

```http
POST /api/mcp
```

---

## Request Example

```json
{
  "tool": "email.send",
  "input": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Test email"
  }
}
```

---

## Response Example

```json
{
  "content": "Email sent successfully"
}
```

---

# 11. Folder Structure

```txt
/app/api/mcp/route.ts

/lib/mcp/
  server.ts
  registry.ts

/lib/tools/
  emailSend.ts
  emailRead.ts
  emailSummarize.ts
  emailReply.ts

/lib/google/
  gmailClient.ts

/lib/ai/
  openai.ts
```

---

# 12. Implementation Plan

---

## Phase 1 — MCP Foundation (Day 1)

* Setup Next.js project
* Create `/api/mcp` endpoint
* Implement tool registry
* Add test tool

---

## Phase 2 — Gmail Integration (Day 2–3)

* Setup OAuth in Google Cloud
* Implement:

  * send email
  * read emails

---

## Phase 3 — Tool Integration (Day 3–4)

* Wrap Gmail logic into MCP tools
* Validate schemas

---

## Phase 4 — AI Layer (Day 4–5)

* Integrate OpenAI API
* Implement:

  * summarization
  * auto reply

---

## Phase 5 — Testing (Day 5)

* Test using:

  * VS Code MCP client
  * curl
  * custom scripts

---

# 13. Success Criteria

* MCP server handles tool calls correctly
* Emails can be sent and read
* AI summarizes and replies accurately
* Works across multiple MCP clients

---

# 14. Risks & Mitigation

| Risk                 | Mitigation                   |
| -------------------- | ---------------------------- |
| Gmail API complexity | use official SDK             |
| MCP misuse           | enforce schema validation    |
| Vercel limitations   | avoid long-lived connections |

---

# 15. Future Roadmap

* multi-user OAuth system
* email thread memory
* RAG over inbox
* MCP tool marketplace
* analytics dashboard

---

# 16. Strategic Outcome

```txt
Zemail becomes a foundational layer for AI-driven communication systems
```

---

# Final Positioning

Zemail is:

```txt
An AI-first email infrastructure exposed via MCP
```

---