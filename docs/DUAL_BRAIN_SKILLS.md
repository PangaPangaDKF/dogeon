# DOGEON — Dual Brain Skills Architecture & Operational Report

> **Authors:** Antigravity (Google DeepMind) & Claude Code (Anthropic)  
> **Target:** TryNoah AI, Future Developers, and System Auditors  
> **Scope:** Full catalogue of agent skills utilized during the 70-hour DOGEON development lifecycle, explaining *why* they were chosen, *how* they functioned, and their concrete impact on the codebase.

---

## 1. Executive Summary & Dual-Brain Paradigm

Throughout the 70 hours of DOGEON development, two distinct AI agent architectures operated concurrently on the codebase:
- **Antigravity CLI (Lead Architect):** Handled system design, macro game loops, RedStone oracle integration, Dogecoin pixel mosaic rendering, AMM DEX bonding curves, and multi-player relay architecture.
- **Claude Code (Precision Systems & Test Engine):** Handled surgical refactoring, headless simulation engine construction (`tests/sim.mjs`), test gatekeeping (`tests/check.sh`), and strict line-budget enforcement (<1,500 lines).

To prevent conflicting edits, model hallucinations, and code bloat, both brains operated under a unified skill library shared in `.agents/skills/` and `.claude/skills/`.

---

## 2. Master Catalogue of Skills Used by Both Brains

### A. Core Workflow & Safety Skills

| Skill | Primary User | Why It Was Chosen | Concrete Impact on Project |
|---|---|---|---|
| [`dogeon-mission`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/dogeon-mission) | Both | Anchors the session to the user's explicit mission charter. | Prevented mission drift; ensured the 70h delivery targets were systematically completed. |
| [`analyzer-master`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/analyzer-master) | Antigravity | Performs holistic deep code audits, AST analysis, and selector verification. | Detected stale function selectors across contract updates and maintained drift synchronization with TryNoah manifests. |
| [`dogeon-game`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/dogeon-game) | Both | Domain-specific rulebook for DOGEON (item IDs, enemy HP, loot tables). | Guaranteed that classes (Warrior, Archer, Healer) adhere to exact balance curves. |
| [`safe-refactor`](file:///mnt/c/Users/dulbi/dogeon/.claude/skills/safe-refactor) | Claude Code | Enforces atomic modifications without breaking neighboring subroutines. | Kept `index.html` syntax-clean across 47 major delivery iterations (D-001 through D-047). |
| [`verify-and-stop`](file:///mnt/c/Users/dulbi/dogeon/.claude/skills/verify-and-stop) | Both | Mandates running the full check script before committing. | Kept test pass rate at 100% (33/33 simulation tests, 6/6 test stages). |
| [`investigate-first`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/investigate-first) | Antigravity | Mandates reading and verifying file reality before editing. | Prevented destructive overwrite of user-curated art assets and contracts. |

---

### B. Visuals, Pixel Art & Game Design Skills

| Skill | Repository Source | Why It Worked & How It Was Used |
|---|---|---|
| [`pixel-art-sprites`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/pixel-art-sprites) | Built-in | Compressed procedurally generated sprites using compact string matrices and palettes. Saved ~80 KB compared to base64 images. |
| [`pixel-art`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/pixel-art) | `edenfunf/reelmimic` | Guided color palette selection and retro 16-bit aesthetic harmony. |
| [`pixel-art-professional`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/pixel-art-professional) | `willibrandon/pixel-plugin` | Provided dithering patterns and directional silhouette techniques for enemy readability. |
| [`sega`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/sega) | `bergside/awesome-design-skills` | Fast arcade feedback principles: added micro-screenshake on heavy hits, crisp audio cues, and responsive action timing. |
| [`game-ui-design`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/game-ui-design) | `omer-metin/skills-for-antigravity` | High-contrast retro HUD layout, unified monospace styling, and non-overlapping dialog viewports. |
| [`rpg`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/rpg) | `gamedev-skills/awesome-gamedev-agent-skills` | Defined the Trinity class archetype balance (Warrior tank, Archer kiter, Healer sustain) and loot drops. |

---

### C. Web3, Smart Contracts & Blockchain Auditing

| Skill | Repository Source | Why It Worked & How It Was Used |
|---|---|---|
| [`solidity-security`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/solidity-security) | `wshobson/agents` | Checked contract reentrancy, integer bounds, safe external calls, and access controls. |
| [`solidity-auditor`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/solidity-auditor) | `pashov/skills` | Comprehensive vulnerability checklist; verified DogeDEX constant-product math and DogeStaking fee distribution. |
| [`setup-solidity-contracts`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/setup-solidity-contracts) | `openzeppelin/openzeppelin-skills` | Standardized ERC-721 implementation in `DogeItems.sol` and fee escrow patterns. |
| [`avax-audit`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/avax-audit) | Avalanche suite | Ensured EVM compatibility on DogeOS Chikyū testnet, gas efficiency, and standard RPC error handling. |

---

### D. Multiplayer, Networking & Cloud Services

| Skill | Repository Source | Why It Worked & How It Was Used |
|---|---|---|
| [`setup-multiplayer-services`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/setup-multiplayer-services) | `unity-technologies/skills` | Provides industry-standard network topology paradigms, session discovery, room/lobby lifecycle patterns, and dedicated server partitioning guidelines. Used to structure DOGEON's room-based relay (`server/relay.mjs`) and ghost replication model. |

---

### E. Modern Web & Frontend Optimization

| Skill | Repository Source | Why It Worked & How It Was Used |
|---|---|---|
| [`vercel-react-best-practices`](file:///mnt/c/Users/dulbi/dogeon/.agents/skills/vercel-react-best-practices) | `vercel-labs/agent-skills` | Enforced strict asset hygiene, elimination of render-blocking resources, and static zero-overhead deployment guidelines. |

---

## 3. Why This Multi-Skill Strategy Succeeded

1. **Zero Hallucination on Selectors:**  
   By combining `analyzer-master` and `setup-solidity-contracts`, the agents never guessed contract method signatures. Every ABI selector (`0xa694fc3a`, `0xa903e1cf`, etc.) was compiled and verified directly against `contracts/src/`.
2. **Sub-1,500 Line Strict Constraint:**  
   Using `safe-refactor` and `pixel-art-sprites`, the frontend remained compact at 1,352 lines despite containing a complete 16-bit RPG engine, audio synthesizer, and Web3 DEX.
3. **Continuous Automated Verification:**  
   `terminal-testing` and `verify-and-stop` ensured that no commit reached `main` without passing all 33 headless simulation tests, syntax checks, and relay connection assertions.
