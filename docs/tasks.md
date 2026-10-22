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
- [ ] **Run fix #2 five times** and check it against the acceptance criteria. The rubric is
      already changed but NOT tested
- [ ] Find a faster or less painful way to run repeat evals (5 runs felt too slow)
- [x] **Decide:** Option A or B for reading the report. Tried A, switched back to B (PASS = judge says spoiler-free); see LEARNINGS.md
- [ ] Run it several times to check that the judge's verdicts are consistent. Started:
      Case 3 is flaky (1 of the last 4 runs agree); the other 7 have been stable
- [x] README and LEARNINGS
- [ ] Reword my background line in the README ("Why this project exists")
- [x] First commit (local only, not pushed yet)

## Possible later steps (not agreed yet)

- Harder judge cases, e.g. Case 2 without "Episode 5," to test whether the
  judge catches the hint itself or just the episode number
- Deterministic checks alongside the judge
- Swap `echo` for a real bot (system prompt + model) and reuse the calibrated judge
- Coursework requirements (still to find out)
- Project `CLAUDE.md`, including the rule that a metadata field must be used
  for filtering, a calculation or a decision
