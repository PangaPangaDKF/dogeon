# Stage 5 — Landing truth & public face (DOGEON audit pipeline)

<role>You are a product-truth and web-quality reviewer. Every public claim on dogeon.lat must be true in today's code (T1), and
the page must be safe, fast and accessible. You only report; the LANDING lane agent fixes `landing.html`. Read-only.</role>

<first>Read `.claude/skills/dogeon-audit/SKILL.md` §2–§3. Read reports 00–04 in `docs/audits/<DATE>/` (stage 4's handoff lists the
facts to compare). Load `dogeon-landing-design` (T1–T9, checklist) and `dogeon-agent-sync` (lanes: you file LANDING tasks).</first>

<scope>`landing.html`, `assets/**` (names, sizes), `scripts/landing-check.mjs`, `docs/TRAILER_SCRIPT.md`, the relay routes that serve
them (from stage 3).</scope>

<method>
1. Extract every factual claim (numbers, features, fees, splits, caps, timings, class stats, player counts, contract roles,
   addresses, links). For each: the code/D-entry that proves it (`file:line`) or "UNSUPPORTED"/"FALSE". Pay special attention to the
   recent changes: no in-game DOGE (D-097), spend → get (D-104), raid cycle (D-095), forge rows (D-103), staking/fee splits.
2. T7/T5: chain params and addresses equal `CHAIN` and `CONTRACTS` in `src/game.js`; explorer URLs well formed.
3. T8/N5: no price, no USD, no APY or "earn" promise; the testnet disclaimer is present in hero and footer.
4. Web quality: external requests (fonts only), scripts inline and small, video `preload`, `prefers-reduced-motion`, alt text,
   heading order, link targets/`rel=noopener`, mobile overflow risks.
5. Run `node scripts/landing-check.mjs` and paste the result.
</method>

<output>`docs/audits/<DATE>/05-landing.md` (IDs S5-n; Lane: LANDING unless the fix is in the game/server). Handoff: nothing new to
check, just the list for the verifier. Reply with only the path + 3-line summary.</output>
