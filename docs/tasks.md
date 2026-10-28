# Tasks

## Milestone 1: Judge calibration

Can an LLM judge (`llm-rubric`) agree with human PASS/FAIL labels on
predetermined responses to a fictional reality TV scenario?

- [x] Fictional scenario + 5 canned responses with human labels
- [x] Config: `echo` provider + `llm-rubric` judge
- [x] First working run (switched judge from Qwen to gpt-oss-120b because of rate limits)
- [x] **Decide:** is Case 3 a spoiler? Yes. My FAIL label stands; the judge missed it.
- [x] Add held-out Cases 6 and 7, and run a baseline with the unchanged rubric
- [x] **Decide:** replace or add to Case 6? Kept it and added Case 8 (same wording minus
      "for the finale"). Baseline: judge catches 6, misses 8 (see LEARNINGS.md)
- [x] Rubric fix #1: PASS and FAIL rules overlapped. Fixed; Case 8 now agrees, Case 3 doesn't
- [x] **Decide:** next step for Case 3. Rubric fix #2 + acceptance criteria (see LEARNINGS.md)
- [x] **Run fix #2 five times** and check it against the acceptance criteria. Met criteria
      for Cases 3 and 8 (5/5); other cases run once (see LEARNINGS.md)
- [x] Find a faster or less painful way to run repeat evals. Keep each command to about
      8 judge calls (see LEARNINGS.md)
- [x] **Decide:** Option A or B for reading the report. Tried A, switched back to B (PASS = judge says spoiler-free); see LEARNINGS.md
- [ ] Run it several times to check that the judge's verdicts are consistent. Started:
      Case 3 was flaky after fix #1 (1 of 4 runs agreed); with fix #2 it agreed 5 of 5.
      Case 7 is now an occasional false alarm (see below); the others have been stable
- [x] Combine assertion types: `promptfooconfig.combined.yaml` adds string checks to the
      judge; Case 9 added as a string-check false alarm (see LEARNINGS.md)
- [x] Raise judge `max_tokens` 400 -> 1000 (judge sometimes ran out while reasoning)
- [ ] Case 7: occasional false alarm since fix #2 (agreed 5 of 6). Watch it, or **decide**
      on a fix
- [x] README and LEARNINGS
- [ ] Reword my background line in the README ("Why this project exists")
- [x] First commit (pushed to GitHub)

## Next up (agreed)

- [x] **Switch the judge to OpenRouter**, pinned to Groq. Fresh baseline: 45/45 agree
      (see LEARNINGS.md, 2026-10-28). Comparing with the old Groq-direct runs can wait
- [ ] New banner: the replacement image wasn't found in `docs/images/`, so nothing was
      pushed. Re-save it there

## Course homework: Day 4 (metrics and model-graded evals)

Lessons: `~/Documents/Break-Into-AI-Testing/modules/02-advanced-eval/`

- [x] **Step 1:** summarize the suite
- [x] **Step 2:** metric names, weights and threshold. Weight 2, threshold 0.75; tried
      4 other settings (see LEARNINGS.md, "Weights and thresholds")
- [x] **Step 3:** confusion matrix (TP/FP/FN) and F1; break the judge with harder
      canned cases
  - [x] `scripts/fscore.js` (scores Judge and Final against human_label; the
        two commands are in the script's header). Current 9 cases: 100% everywhere
  - [x] Harder cases 10-13 (Katie wrote 10, 11, 13; Claude wrote 12). Case 11 was
        the judge's first real miss; Case 13 is its held-out case
  - [x] Fix #3: wedding day added to the episode 8 line. Full suite x5: 64/65,
        recall 100%. See LEARNINGS.md, "Fix #3: a fact, not a rule"
  - [x] Cases 3 and 7 x20: Case 7 fine (20/20), Case 3 ~85% caught before and
        after fix #3. Case 3 recorded as a known limitation
- [ ] **Step 4:** run and explain

### Step 1 findings

- 2 configs, 9 cases. Weights only matter in the combined config (the calibration
  config has one assertion per case)
- The suite is already a spoiler / not-spoiler classifier: the judge is the
  classifier, my labels are the answer key

### Step 2 notes

- ~~Separate homework config~~: changed to one config (`promptfooconfig.yaml`) for
  everything. See LEARNINGS.md, "One config instead of three"
- **The angle** (from a ChatGPT discussion): missed spoilers are worse than false
  alarms. Weights can't express that, because they weight checks, not types of
  mistakes. It shows up in two places instead:
  - leading with spoiler recall (maybe F2) instead of plain F1
  - the threshold: one that lets Case 9's false alarm pass could also let a
    spoiler through when only the string checks catch it. Show that trade-off
- Write up what it showed in LEARNINGS.md

### Step 3 notes

- Use the existing judge as the classifier (no separate CSV classifier)
- Read the course's `compute-fscore.js` before reusing it
- Keep the F1 script, and add the judge's precision/recall to the README

### Questions for later

- When would a low threshold like 0.5 make sense in the real world? Short answer so
  far: for "nice to have" quality checks (tone, length, includes a next step), not for
  rules that must never break, like spoilers
- How big a spoiler is (minor detail / plot point / ending): should the rubric grade
  severity instead of PASS/FAIL? Would that change the threshold? Came up writing
  the "dishes fight in episode 7" case
- Is a false hint about the ending a spoiler? E.g. "their first dance was sweet"
  implies they married, but Maya says no at the altar. Tests made-up facts, not
  just spoilers, so kept out of the Case 11 held-out cases

- LLM eval platforms (LangSmith, Braintrust, Promptfoo's paid version): roughly a
  "Cypress Cloud" for evals, tracking results and metrics across runs. Check what each
  one actually computes (e.g. precision/recall/F1 against an answer key)
- Promptfoo's `derivedMetrics`: the course says it gives wrong F1 numbers with
  weighted checks. Maybe try it once to see the problem first-hand

### Keep these separate in the write-up

- **Weighted score** and **threshold** decide each case's verdict
- **F1 / precision / recall** grade those verdicts against my labels

## Possible later steps (not agreed yet)

- Add a "where this shows up at work" line to each Concept in LEARNINGS.md (Katie
  likes the idea; do it after the homework). Practice for applying the concepts, and
  interview material
- Next milestone after the homework: swap `echo` for a real bot. Katie wants a bit
  more practice with canned responses first, so this isn't started yet
- After the real bot: real shows (Love Is Blind, MAFS, 90 Day Fiance). Likely RAG:
  the bot looks up episode summaries to answer. Keep the answer key separate from
  what the bot looks up: a small human-verified fact list (a model can draft it, I
  check it) plus my labels. Same pattern as testing job matching against
  recruiter-labeled profiles. Watch for the judge already "knowing" real endings
- Harder judge cases, e.g. Case 2 without "Episode 5," to test whether the
  judge catches the hint itself or just the episode number
- "Reveals info but isn't a spoiler" case, e.g. a season-wide stat like how many
  kisses happened all season. Katie's take: human label PASS. Open questions: the
  current scenario's question ("will they make it?") doesn't fit it, and fix #2's
  "anything about episodes 5 through 8" wording may FAIL it
- Spoiler severity: PASS/FAIL says whether it's a spoiler, not how bad. Case 2 (says
  something happens in ep 5) feels milder than Case 3 (hints at the ending), but both
  stay FAIL. Only add a severity metadata field once something uses it (e.g. catch
  rate by severity). Another route: ask the llm-rubric check for a 0-1 score
  instead of PASS/FAIL (then it needs its own threshold). Scores from a judge model
  tend to be less consistent than PASS/FAIL, so test that first
- Swap `echo` for a real bot (system prompt + model) and reuse the calibrated judge
- Coursework requirements (still to find out)
- Project `CLAUDE.md`, including the rule that a metadata field must be used
  for filtering, a calculation or a decision
