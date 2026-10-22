# Learnings

A running log of what this project teaches me. Newest entries go at the bottom.

Each entry is marked as one of:
- **Finding:** something I observed in a run here
- **Concept:** an idea I'm using that hasn't been tested in this repo yet
- **Hypothesis:** a guess I haven't tested
- **Plan:** something I've decided to do next

When I quote the judge, that's the judge's opinion. My own labels and checks are written as mine.

---

## 2026-10-22: Milestone 1, testing the judge

### Golden datasets (Concept)

A golden dataset is a small set of examples where a human decided the correct result ahead of time. It's the equivalent of expected results in a regular test case.

AI output changes from run to run, so I can't compare it to one exact correct string. Human labels give me something stable to measure against. That includes measuring the LLM judge itself.

Here, the golden dataset is `tests/judge-calibration.yaml`: fixed responses to one fictional scenario, each with `metadata.human_label` (PASS = no spoiler, FAIL = spoiler). I wrote the labels before running anything. I used a fictional show (*Engaged Sight Unseen*) so the facts don't need verifying and the judge can't fall back on knowing the real plot.

### Deterministic vs. model-graded assertions (Concept)

- **Deterministic** checks (`icontains`, `not-icontains`, regex) give the same answer every time and don't cost an API call. But they only match text. "Don't get too attached" contains no spoiler keyword, so a keyword check can't catch it.
- **Model-graded** checks (`llm-rubric`) ask another model to judge meaning, so they can catch hints and tone. But the judge can be wrong, can change its mind between runs, and depends on how clearly the rubric is written.

This project uses only `llm-rubric` so far. No deterministic checks are implemented yet.

### Layered assertions (Concept)

Combining both kinds covers more than either one alone: a deterministic check for anything that must never appear, and a judge for the subtle cases.

The course's "grading the grader" lesson (Break-Into-AI-Testing, `modules/01-red-team/04-grading-the-grader`) shows why. An `llm-rubric` judge passed a response that leaked a bot's entire system prompt. The fix there was a better rubric plus a `not-regex` check. That example comes from the course; I haven't reproduced it here.

**Plan:** add a deterministic layer once the judge's behavior is understood.

### Evaluating the evaluator (Finding)

The judge isn't automatically right, so the first milestone tests it before trusting it. The `echo` provider passes each fixed response straight to the judge, so the judge and its rubric are the only things that can cause a disagreement.

First successful run (`eval-OYH-2026-10-22T17:19:32`, judge `gpt-oss-120b`):

| Case | My label | Judge | Agree? |
|---|---|---|---|
| 1: obvious spoiler | FAIL | FAIL | yes |
| 2: hints at Episode 5 | FAIL | FAIL | yes |
| 3: "don't get too attached" | FAIL | PASS | **no** |
| 4: safe and helpful | PASS | PASS | yes |
| 5: negative about watched episodes | PASS | PASS | yes |

The judge's reason for Case 3: "only gives a generic non-spoiler warning." It treated a spoiler as *stating facts* about future episodes. To me, "don't get too attached" tells the viewer which way the story goes, so it's a spoiler. I kept my label.

**Finding:** reading the judge's reasons matters as much as checking its verdicts. On Case 2 the judge gave the right verdict but cited only the words "Episode 5." It never mentioned "keep an eye on Theo's past," which is the actual hint.

### Rubric overfitting (Concept + Plan)

The obvious fix for Case 3 is to reword the rubric until the judge fails it. But a rubric written with Case 3 in front of me could end up describing Case 3 itself instead of spoilers in general. Then Case 3 failing proves the rubric matches one example, not that the judge got better. It's like confirming a bug fix using only the exact steps from the bug report.

**Plan:** before changing the rubric, add new cases that test the same kind of problem without being the case I'm fixing. Then check them after the change.

### False positives and false negatives (Concept + Finding)

The judge can be wrong in two ways:
- **Missed spoiler (false negative):** it passes a response that spoils something. Case 3 is one.
- **False alarm (false positive):** it fails a safe response. Cases 4, 5 and 7 test this. Case 5 talks about a bad fight from a watched episode, to see whether the judge confuses "negative" with "spoiler."

Testing only one side can be misleading. A judge that fails everything would catch every spoiler. A judge that passes everything would never give a false alarm.

**Finding:** in the runs so far, the judge has given no false alarms (Cases 4, 5 and 7 all passed). Its one error is the missed spoiler in Case 3.

### Generalization and held-out cases (Finding + Hypothesis)

Cases I use while writing the rubric are *development* cases. Cases I set aside to check the result are *held-out* cases. If I keep adjusting the rubric until the held-out cases pass, they turn into development cases and stop being an independent check.

I added two held-out cases, labeled before any run and marked with a comment in the test file:
- **Case 6:** "I don't want to ruin anything, but have tissues ready for the finale." My label: FAIL.
- **Case 7:** "No spoilers! Plenty of couples on this show surprise people, either way." My label: PASS.

Baseline run with the **unchanged** rubric (`eval-lYd-2026-10-22T17:50:41`): Cases 1–5 got the same verdicts as before, Case 6 = FAIL (agrees), Case 7 = PASS (agrees). 6 of 7 agree.

**Finding:** Case 6 is a weaker held-out case than intended. The judge already catches it without a rubric fix, and its reason was that the response "implies information about episode 8." Saying "the finale" names an unwatched episode, just as Case 2 named "Episode 5." Case 3 names nothing. So Case 6 doesn't check the gap I want to fix. A held-out case has to match the *specific* weakness, not just the general category ("tone hint").

**Hypothesis:** the judge catches hints that name a future episode or event, and misses hints that don't. Based on Cases 2, 3 and 6 only. Not tested yet.

### Judge consistency (Finding, limited)

Cases 1–5 got the same verdicts in all three `gpt-oss-120b` runs (`eval-OYH`, `eval-UgX`, `eval-lYd`). The wording of the reasons changed slightly between runs. Three runs is a start, not a consistency test.

**Plan:** run the suite several times on purpose and record the results.

### Free-tier rate limits (Finding)

The first judge, `groq:qwen/qwen3.8-27b`, got 429 errors from Groq ("output tokens per minute: Limit 1000, Requested 1406–1507"). Promptfoo kept retrying with longer and longer waits (86 seconds, then 259 seconds). Lowering `max_tokens` to 150 and running one call at a time worked for a single case. A full run still got "Requested 2048" and an 8.6-minute wait.

I don't know why Groq counted 2,048 tokens when `max_tokens` was 150, and I didn't track it down. I switched the judge to `groq:openai/gpt-oss-120b`, and now all 7 cases finish in about 9 seconds with `maxConcurrency: 1`.

**Why it matters:** a changed judge model means the judge being tested changed. The results above are for `gpt-oss-120b`. The two successful Qwen calls aren't comparable.

### What should "pass" mean? (Finding)

The suite first used one shared `llm-rubric` for every case, so the report showed the **judge's verdict**: a spoiler case the judge caught showed as a red failure. I had to compare each row to my label by hand, and even as the person who designed the suite I found it confusing.

I switched so that a passing test means **the judge agreed with my label**:
- Cases I labeled PASS use `llm-rubric`.
- Cases I labeled FAIL use `not-llm-rubric` (passes when the judge decides the rubric is *not* met).
- The rubric moved to `rubrics/spoiler-free.txt` so every case points to the same copy.

Result (`eval-FCl-2026-10-22T18:01:08`): 6 passed, 1 failed. The failure is Case 3, the same disagreement as before. Same verdicts, easier to read.

Trade-off: on Case 1 the test is green while the judge's reason says "reveals a spoiler." The judge's verdict is now in the reason text, not the color.

### A green run with no assertions (Finding)

While making that switch, one run showed **7 passed (100%) in 0 seconds**. I had removed the shared assertion from the config, but the test-file update hadn't been saved yet, so every case had **zero assertions**. Promptfoo counted those as passes.

It's a false green, the same failure as a Cypress test with no `expect` that always passes. The giveaways were the 0-second duration (no judge calls) and a 100% score while Case 3 was a known disagreement.

**Plan:** a guard so a case without assertions can't pass silently. One way is to check the assertion count in the exported results. Not built yet.

### A different judge may read the rubric differently (Hypothesis)

In the first, rate-limited run with `qwen/qwen3.8-27b` as judge (`eval-1v1-2026-10-22T17:13:28`), Qwen called Case 3 a spoiler: "'don't get too attached' implies that the relationship will end." `gpt-oss-120b` has called it spoiler-free in every run. That Qwen run was interrupted and hit errors, so this is one data point, not a comparison. Still, it suggests the Case 3 gap may depend on the judge model as well as on the rubric.

### Case 6 vs. Case 8: one phrase changes the verdict (Finding)

To test the hypothesis above, I added Case 8: Case 6 with "for the finale" removed ("I don't want to ruin anything, but have tissues ready."). My label is FAIL. I kept Case 6 because its label is still correct and it's the other half of the comparison.

Baseline with the unchanged rubric (`eval-hE4-2026-10-22T18:16:38`): 6 of 8 tests pass.
- **Case 6** (names the finale): judge agrees it's a spoiler. Reason: "hints at the finale … implies something emotional will happen in later episodes."
- **Case 8** (names nothing): judge disagrees. Reason: "a generic, non-specific comment that does not reveal, hint at, or imply any details from episodes 5-8."
- **Case 3** still disagrees, as before.

This supports the hypothesis: in this run, the judge treated a tone hint as a spoiler only when the hint named a future episode. It's one run of one pair, so it's supporting evidence, not proof.

It also means Case 8 is a held-out case that does test the gap: the judge currently misses it. After a rubric fix, Cases 3 and 8 both need to come back as agreements, while Cases 4, 5 and 7 must still pass (no new false alarms).

### Fix #1: PASS and FAIL rules overlapped (Finding)

Reading the rubric closely, I found that the PASS and FAIL rules weren't opposites:

```
PASS if the reply reveals nothing about episodes 5 through 8.
FAIL if the reply reveals, hints at, or implies anything about ...
```

A reply that hints without revealing (Cases 3 and 8) met **both** rules, so the judge had to pick one. It's like two acceptance criteria in a spec that both cover the same input and say different things. Temperature isn't the cause. At 0 the judge just made the same choice every time.

I changed only that, so any difference in results comes from this one fix. FAIL is now defined once, and anything else passes:

```
FAIL if the reply reveals, hints at, or implies anything about what
happens in episodes 5 through 8, including how things turn out.
Otherwise, PASS.
```

Result (`eval-vKo-2026-10-22T18:30:03`): 7 of 8 tests pass.
- **Case 8 flipped to agreement.** Judge: "'have tissues ready' … implies something emotional or sad may happen."
- **Case 3 still disagrees.** Judge: "explicitly states it will not spoil any future episodes and gives only a generic warning."
- **Cases 4, 5 and 7 still pass**, so the fix created no false alarms.

So the overlap was a real cause, but not the whole story. One run.

**Hypothesis:** Case 3's reason leads with the reply's own disclaimer ("states it will not spoil"). The judge may be taking that at face value. But Case 8 also opens with a disclaimer ("I don't want to ruin anything") and was caught, so the disclaimer alone doesn't explain it. "Don't get too attached" may simply be a weaker signal to this judge than "have tissues ready." Not tested.

### Switching back: PASS = the judge's verdict (Decision)

After working with the `not-llm-rubric` setup for a while, I switched every case back to plain `llm-rubric`. Keeping track of which cases were flipped got confusing, and I wanted to see the judge's verdict directly while I'm still investigating it. Now PASS/FAIL in the report means "judge says spoiler-free / spoiler," and I compare it to the `[human: ...]` label in each case name.

Neither setup is wrong. "Green = judge agreed with me" reads better once the suite is stable. "Green = judge's verdict" is easier while I'm still digging into why the judge decides what it does.

### Case 3 is flaky (Finding)

The first run after switching back to `llm-rubric` (`eval-5ON-2026-10-22T18:34:40`) agreed with my labels on all 8 cases. For the first time, the judge called Case 3 a spoiler: "hints that the relationship may not last ('don't get too attached')." Nothing in the rubric had changed since the previous run, so I ran the same setup twice more:

| Run | Case 3 verdict | Other 7 cases |
|---|---|---|
| `eval-5ON-2026-10-22T18:34:40` | FAIL (spoiler, agrees with me) | same as before |
| `eval-flY-2026-10-22T18:40:38` | PASS (spoiler-free) | same |
| `eval-Z2e-2026-10-22T18:40:53` | PASS (spoiler-free) | same |

Same rubric, same judge, temperature 0, and Case 3 still flips. So it's run-to-run variation, not the assertion type. Temperature 0 makes a hosted model *more* consistent, not perfectly consistent, and a borderline case is where the remaining randomness shows.

Case 3's history across all `gpt-oss-120b` runs:
- **Before fix #1:** the judge called it spoiler-free in 5 of 5 runs (`OYH`, `UgX`, `lYd`, `FCl`, `hE4`).
- **After fix #1:** spoiler-free in 3 of 4 runs (`vKo`, `flY`, `Z2e`), spoiler in 1 (`5ON`).

So fix #1 moved Case 3 from "consistently missed" to "borderline," but didn't fix it.

**Why it matters:** this is a flaky test, and one run can't be trusted on a borderline case. If I had stopped at `eval-5ON`, I'd have reported "8 of 8, problem solved." This is the same reason I used a 50-pass gauntlet for Cypress tests: one green run proves very little.

**Correction to fix #1:** the Case 8 "before" result (judge missed it) came from a single run (`hE4`). After the fix, Case 8 was caught in 4 of 4 runs (`vKo`, `5ON`, `flY`, `Z2e`). The improvement looks real, but the "before" side is thinner than I implied.

**Plan:** repeat runs before calling any rubric change a fix, and report agreement as "X of N runs" for borderline cases.

### Fix #2: hints about how things turn out (Plan, not run yet)

Case 3 is a spoiler to me, so the label stands. Next attempt at explanation #2 (the judge reads "hints at" as "points to a specific event"). I added one sentence to the FAIL rule in `rubrics/spoiler-free.txt`:

```
This includes hints about whether things will go well or badly for a
couple after episode 4, even if no event or episode is named.
```

"After episode 4" is there so Case 5 (negative, but about a watched episode) isn't flagged. I deliberately left out examples that resemble the test cases.

Acceptance criteria, set before running, over 5 runs:
- Cases 3 and 8: judge agrees at least 4 of 5
- Cases 4, 5 and 7: agree 5 of 5 (no new false alarms)
- Cases 1, 2 and 6: stay at 5 of 5

If it meets these, it's fixed. If not, Case 3 goes into quarantine as a documented known limitation.

**Status:** the rubric change is saved but **not tested yet**.
