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

## Possible later steps (not agreed yet)

- Harder judge cases, e.g. Case 2 without "Episode 5," to test whether the
  judge catches the hint itself or just the episode number
- "Reveals info but isn't a spoiler" case, e.g. a season-wide stat like how many
  kisses happened all season. Katie's take: human label PASS. Open questions: the
  current scenario's question ("will they make it?") doesn't fit it, and fix #2's
  "anything about episodes 5 through 8" wording may FAIL it
- Spoiler severity: PASS/FAIL says whether it's a spoiler, not how bad. Case 2 (says
  something happens in ep 5) feels milder than Case 3 (hints at the ending), but both
  stay FAIL. Only add a severity metadata field once something uses it (e.g. catch
  rate by severity)
- Swap `echo` for a real bot (system prompt + model) and reuse the calibrated judge
- Coursework requirements (still to find out)
- Project `CLAUDE.md`, including the rule that a metadata field must be used
  for filtering, a calculation or a decision
