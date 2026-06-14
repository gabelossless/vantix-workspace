# Vantix Agent Board

Workspace: `./` (project root)
Last updated: June 13, 2026

---

## Organizational Structure

```
                            ┌─────────────────┐
                            │   CEO Agent      │ Strategy, vision, priorities
                            └────────┬─────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼────────┐
    │   CTO Agent       │  │   Board of Agents │  │  Advisory       │
    │  Architecture     │  │  Strategic        │  │  External        │
    │  Quality          │  │  Oversight        │  │  Inputs          │
    └─────────┬─────────┘  └─────────┬─────────┘  └─────────────────┘
              │                      │
              └──────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │       R&D Product Team           │
                    │  5 agents — execution layer      │
                    └─────────────────────────────────┘
```

---

## Board of Agents (Strategic Oversight)

5 agents focused on AGI, crypto markets, and revenue generation.

| Agent | Role | Focus |
|---|---|---|
| **AGI Strategist** | Long-term AI architecture | Model selection, research direction, capability roadmap |
| **Crypto Market Lead** | Market data & exchange strategy | Exchange integration priority, data quality, trading signals |
| **Revenue Architect** | Business model & monetization | Tokenomics, subscription tiers, institutional sales |
| **Risk & Compliance Officer** | Risk modeling & safety | Position limits, regulatory awareness, model guardrails |
| **Systems Architect** | Infrastructure & scale | Deployment topology, latency budgets, reliability |

### Charter
- Meets weekly to review milestone progress and adjust priorities
- Each agent maintains a one-page strategic memo in `docs/strategy/`
- Decisions logged in `docs/roadmap.md` Decision Log

---

## R&D Product Team (Execution)

5 agents that build and ship features.

| Agent | Role | Key Files |
|---|---|---|
| **Protocol Engineer** | Exchange adapters, market data, blockchain | `src/exchange/`, `src/models.rs` |
| **Risk Quant** | Slippage, volatility, portfolio risk | `src/slippage.rs`, risk analytics |
| **Capital RAG Engineer** | Knowledge retrieval, embeddings, ingestion | `src/capital/`, `storage/models/` |
| **Terminal UX Engineer** | Panels, data viz, interaction | `src/components/`, `src/app/` |
| **Data Pipeline Engineer** | Storage, streaming, ETL, observability | `src/storage/`, `/metrics`, logging |

### Charter
- Operates in 2-week sprints aligned with roadmap milestones
- Each agent has a `.opencode/agents/` config with tool permissions scoped to their domain
- CI must pass before any agent merges to main

---

## Executive Agents

### CEO Agent
- Owns the vision, roadmap priority, and resource allocation
- Reviews milestone completion against strategic goals
- Maintains the Decision Log in `docs/roadmap.md`
- Authorizes new feature areas and external integrations

### CTO Agent
- Owns technical architecture, code quality standards, and platform decisions
- Enforces the Senior Workflow Rules from `docs/agent-handoff.md`
- Reviews all `.opencode/agents/` configs for security and scoping
- Maintains the type contract boundary (`api-types.ts` ↔ Rust structs)

---

## Orchestrator (Default Entry Point)

The **Orchestrator** agent (`.opencode/agents/orchestrator.md`) is the default dispatch point. It:

1. Receives incoming tasks and identifies the primary domain
2. Launches the appropriate subagent via `task` tool
3. Collects results and runs the Verification Checklist
4. Escalates to CTO or CEO for cross-domain or strategic decisions

All work should flow through the Orchestrator unless you know exactly which agent you need.

## Agent Interaction Model

```
CEO ──> Board ──> CTO ──> R&D Team
  │                    │
  └────────────────────┘
     feedback loop
```

1. CEO sets quarterly objectives
2. Board refines into strategic milestones
3. CTO translates into technical tickets
4. R&D Team executes and reports up
5. Feedback flows back through the chain

---

## Quick Reference: Agent Configs

| Agent | Config File | Type |
|---|---|---|
| Orchestrator | `.opencode/agents/orchestrator.md` | Primary (default) |
| CEO Agent | `.opencode/agents/ceo.md` | Executive |
| CTO Agent | `.opencode/agents/cto.md` | Executive |
| Protocol Engineer | `.opencode/agents/protocol-engineer.md` | R&D |
| Risk Quant | `.opencode/agents/risk-quant.md` | R&D |
| Capital RAG Engineer | `.opencode/agents/capital-rag-engineer.md` | R&D |
| Terminal UX Engineer | `.opencode/agents/terminal-ux-engineer.md` | R&D |
| Data Pipeline Engineer | `.opencode/agents/data-pipeline-engineer.md` | R&D |
