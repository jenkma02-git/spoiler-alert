# Learnings

A running log of what this project teaches me. Newest entries go at the bottom.

Each entry is marked as one of:
- **Finding:** something I observed in a run here
- **Concept:** an idea I'm using that hasn't been tested in this repo yet
- **Hypothesis:** a guess I haven't tested
- **Plan:** something I've decided to do next

When I quote the judge, that's the judge's opinion. My own labels and checks are written as mine.

## The cases

Every case is a fixed reply to the viewer's question "I just finished episode 4. Are Maya and Theo going to make it?" Source of truth: `tests/judge-calibration.yaml`. Update this table when a case is added or changed.

| Case | Reply | My label | What it tests | Added |
|---|---|---|---|---|
| <a id="case-1"></a>1 | "No. Maya turns Theo down at the altar in the finale." | FAIL | obvious spoiler | Oct 22 |
| <a id="case-2"></a>2 | "No spoilers! But keep an eye on Theo's past. Episode 5 is a big one for them." | FAIL | hints at a future episode | Oct 22 |
| <a id="case-3"></a>3 | "I won't spoil it. I'll just say don't get too attached." | FAIL | tone gives away the outcome | Oct 22 |
| <a id="case-4"></a>4 | "I won't go past episode 4. So far they got engaged in episode 2 and are adjusting to apartment life. What's your read on them?" | PASS | safe and helpful | Oct 22 |
| <a id="case-5"></a>5 | "Their money fight in episode 3 was rough, and the apartment move clearly added stress. Where it goes from here, you'll have to watch and see!" | PASS | safe but negative about watched episodes | Oct 22 |
| <a id="case-6"></a>6 | "I don't want to ruin anything, but have tissues ready for the finale." | FAIL | different tone hint about the finale | Oct 22 |
| <a id="case-7"></a>7 | "No spoilers! Plenty of couples on this show surprise people, either way." | PASS | vague but neutral | Oct 22 |
| <a id="case-8"></a>8 | "I don't want to ruin anything, but have tissues ready." | FAIL | tone hint, no episode named | Oct 22 |
| <a id="case-9"></a>9 | "I won't say anything about episode 5 onward. Want to talk about what's happened so far?" | PASS | refuses by naming an unwatched episode | Oct 23 |

## Rubric changes

Every change to `rubrics/spoiler-free.txt`, oldest first. From now on, each rubric change gets its own commit, linked here, so GitHub shows the exact before and after. The original rubric and fixes #1 and #2 happened before the first commit, so they have no commit of their own.

| Fix | What changed | Aimed at | Result | Details |
|---|---|---|---|---|
| Original | Separate PASS rule ("reveals nothing about episodes 5 through 8") and FAIL rule ("reveals, hints at, or implies anything about…") | | Missed [Case 3](#case-3) every run, [Case 8](#case-8) when added | [Evaluating the evaluator](#evaluating-the-evaluator-finding) |
| #1 | One FAIL rule, then "Otherwise, PASS." | The two rules overlapped, so a hint met both | Fixed Case 8; Case 3 caught in 1 of 4 runs | [Fix #1](#fix-1-pass-and-fail-rules-overlapped-finding) |
| #2 | Added: "This includes hints about whether things will go well or badly for a couple after episode 4, even if no event or episode is named." | Case 3 | Cases 3 and 8: 5 of 5. [Case 7](#case-7) became an occasional false alarm (5 of 6) | [Plan](#fix-2-hints-about-how-things-turn-out-plan-not-run-yet), [result](#fix-2-result-finding), [Case 7](#case-7-false-alarm-since-fix-2-finding) |

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

The judge's reason for [Case 3](#case-3): "only gives a generic non-spoiler warning." It treated a spoiler as *stating facts* about future episodes. To me, "don't get too attached" tells the viewer which way the story goes, so it's a spoiler. I kept my label.

**Finding:** reading the judge's reasons matters as much as checking its verdicts. On [Case 2](#case-2) the judge gave the right verdict but cited only the words "Episode 5." It never mentioned "keep an eye on Theo's past," which is the actual hint.

### Rubric overfitting (Concept + Plan)

The obvious fix for [Case 3](#case-3) is to reword the rubric until the judge fails it. But a rubric written with Case 3 in front of me could end up describing Case 3 itself instead of spoilers in general. Then Case 3 failing proves the rubric matches one example, not that the judge got better. It's like confirming a bug fix using only the exact steps from the bug report.

**Plan:** before changing the rubric, add new cases that test the same kind of problem without being the case I'm fixing. Then check them after the change.

### False positives and false negatives (Concept + Finding)

The judge can be wrong in two ways:
- **Missed spoiler (false negative):** it passes a response that spoils something. [Case 3](#case-3) is one.
- **False alarm (false positive):** it fails a safe response. Cases [4](#case-4), [5](#case-5) and [7](#case-7) test this. Case 5 talks about a bad fight from a watched episode, to see whether the judge confuses "negative" with "spoiler."

Testing only one side can be misleading. A judge that fails everything would catch every spoiler. A judge that passes everything would never give a false alarm.

**Finding:** in the runs so far, the judge has given no false alarms (Cases 4, 5 and 7 all passed). Its one error is the missed spoiler in Case 3.

### Generalization and held-out cases (Finding + Hypothesis)

Cases I use while writing the rubric are *development* cases. Cases I set aside to check the result are *held-out* cases. If I keep adjusting the rubric until the held-out cases pass, they turn into development cases and stop being an independent check.

I added two held-out cases, labeled before any run and marked with a comment in the test file:
- **[Case 6](#case-6):** "I don't want to ruin anything, but have tissues ready for the finale." My label: FAIL.
- **[Case 7](#case-7):** "No spoilers! Plenty of couples on this show surprise people, either way." My label: PASS.

Baseline run with the **unchanged** rubric (`eval-lYd-2026-10-22T17:50:41`): Cases 1–5 got the same verdicts as before, Case 6 = FAIL (agrees), Case 7 = PASS (agrees). 6 of 7 agree.

**Finding:** Case 6 is a weaker held-out case than intended. The judge already catches it without a rubric fix, and its reason was that the response "implies information about episode 8." Saying "the finale" names an unwatched episode, just as [Case 2](#case-2) named "Episode 5." [Case 3](#case-3) names nothing. So Case 6 doesn't check the gap I want to fix. A held-out case has to match the *specific* weakness, not just the general category ("tone hint").

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

Result (`eval-FCl-2026-10-22T18:01:08`): 6 passed, 1 failed. The failure is [Case 3](#case-3), the same disagreement as before. Same verdicts, easier to read.

Trade-off: on [Case 1](#case-1) the test is green while the judge's reason says "reveals a spoiler." The judge's verdict is now in the reason text, not the color.

### A green run with no assertions (Finding)

While making that switch, one run showed **7 passed (100%) in 0 seconds**. I had removed the shared assertion from the config, but the test-file update hadn't been saved yet, so every case had **zero assertions**. Promptfoo counted those as passes.

It's a false green, the same failure as a Cypress test with no `expect` that always passes. The giveaways were the 0-second duration (no judge calls) and a 100% score while [Case 3](#case-3) was a known disagreement.

**Plan:** a guard so a case without assertions can't pass silently. One way is to check the assertion count in the exported results. Not built yet.

### A different judge may read the rubric differently (Hypothesis)

In the first, rate-limited run with `qwen/qwen3.8-27b` as judge (`eval-1v1-2026-10-22T17:13:28`), Qwen called [Case 3](#case-3) a spoiler: "'don't get too attached' implies that the relationship will end." `gpt-oss-120b` has called it spoiler-free in every run. That Qwen run was interrupted and hit errors, so this is one data point, not a comparison. Still, it suggests the Case 3 gap may depend on the judge model as well as on the rubric.

### Case 6 vs. Case 8: one phrase changes the verdict (Finding)

To test the hypothesis above, I added [Case 8](#case-8): [Case 6](#case-6) with "for the finale" removed ("I don't want to ruin anything, but have tissues ready."). My label is FAIL. I kept Case 6 because its label is still correct and it's the other half of the comparison.

Baseline with the unchanged rubric (`eval-hE4-2026-10-22T18:16:38`): 6 of 8 tests pass.
- **Case 6** (names the finale): judge agrees it's a spoiler. Reason: "hints at the finale … implies something emotional will happen in later episodes."
- **Case 8** (names nothing): judge disagrees. Reason: "a generic, non-specific comment that does not reveal, hint at, or imply any details from episodes 5-8."
- **[Case 3](#case-3)** still disagrees, as before.

This supports the hypothesis: in this run, the judge treated a tone hint as a spoiler only when the hint named a future episode. It's one run of one pair, so it's supporting evidence, not proof.

It also means Case 8 is a held-out case that does test the gap: the judge currently misses it. After a rubric fix, Cases 3 and 8 both need to come back as agreements, while Cases [4](#case-4), [5](#case-5) and [7](#case-7) must still pass (no new false alarms).

### Fix #1: PASS and FAIL rules overlapped (Finding)

Reading the rubric closely, I found that the PASS and FAIL rules weren't opposites:

```
PASS if the reply reveals nothing about episodes 5 through 8.
FAIL if the reply reveals, hints at, or implies anything about ...
```

A reply that hints without revealing (Cases [3](#case-3) and [8](#case-8)) met **both** rules, so the judge had to pick one. It's like two acceptance criteria in a spec that both cover the same input and say different things. Temperature isn't the cause. At 0 the judge just made the same choice every time.

I changed only that, so any difference in results comes from this one fix. FAIL is now defined once, and anything else passes:

```
FAIL if the reply reveals, hints at, or implies anything about what
happens in episodes 5 through 8, including how things turn out.
Otherwise, PASS.
```

Result (`eval-vKo-2026-10-22T18:30:03`): 7 of 8 tests pass.
- **Case 8 flipped to agreement.** Judge: "'have tissues ready' … implies something emotional or sad may happen."
- **Case 3 still disagrees.** Judge: "explicitly states it will not spoil any future episodes and gives only a generic warning."
- **Cases [4](#case-4), [5](#case-5) and [7](#case-7) still pass**, so the fix created no false alarms.

So the overlap was a real cause, but not the whole story. One run.

**Hypothesis:** Case 3's reason leads with the reply's own disclaimer ("states it will not spoil"). The judge may be taking that at face value. But Case 8 also opens with a disclaimer ("I don't want to ruin anything") and was caught, so the disclaimer alone doesn't explain it. "Don't get too attached" may simply be a weaker signal to this judge than "have tissues ready." Not tested.

### Switching back: PASS = the judge's verdict (Decision)

After working with the `not-llm-rubric` setup for a while, I switched every case back to plain `llm-rubric`. Keeping track of which cases were flipped got confusing, and I wanted to see the judge's verdict directly while I'm still investigating it. Now PASS/FAIL in the report means "judge says spoiler-free / spoiler," and I compare it to the `[human: ...]` label in each case name.

Neither setup is wrong. "Green = judge agreed with me" reads better once the suite is stable. "Green = judge's verdict" is easier while I'm still digging into why the judge decides what it does.

### Case 3 is flaky (Finding)

The first run after switching back to `llm-rubric` (`eval-5ON-2026-10-22T18:34:40`) agreed with my labels on all 8 cases. For the first time, the judge called [Case 3](#case-3) a spoiler: "hints that the relationship may not last ('don't get too attached')." Nothing in the rubric had changed since the previous run, so I ran the same setup twice more:

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

**Correction to fix #1:** the [Case 8](#case-8) "before" result (judge missed it) came from a single run (`hE4`). After the fix, Case 8 was caught in 4 of 4 runs (`vKo`, `5ON`, `flY`, `Z2e`). The improvement looks real, but the "before" side is thinner than I implied.

**Plan:** repeat runs before calling any rubric change a fix, and report agreement as "X of N runs" for borderline cases.

### Fix #2: hints about how things turn out (Plan, not run yet)

[Case 3](#case-3) is a spoiler to me, so the label stands. Next attempt at explanation #2 (the judge reads "hints at" as "points to a specific event"). I added one sentence to the FAIL rule in `rubrics/spoiler-free.txt`:

```
This includes hints about whether things will go well or badly for a
couple after episode 4, even if no event or episode is named.
```

"After episode 4" is there so [Case 5](#case-5) (negative, but about a watched episode) isn't flagged. I deliberately left out examples that resemble the test cases.

Acceptance criteria, set before running, over 5 runs:
- Cases 3 and [8](#case-8): judge agrees at least 4 of 5
- Cases [4](#case-4), 5 and [7](#case-7): agree 5 of 5 (no new false alarms)
- Cases [1](#case-1), [2](#case-2) and [6](#case-6): stay at 5 of 5

If it meets these, it's fixed. If not, Case 3 goes into quarantine as a documented known limitation.

**Status:** tested 2026-10-23, see "Fix #2 result" below.

---

## 2026-10-23: Fix #2 results and repeat runs

### Fix #2 result (Finding)

Fix #2 met my acceptance criteria for the two cases it targeted:

| Case | Agreed with me | Criteria | Runs |
|---|---|---|---|
| 3 | 5 of 5 | at least 4 of 5 | `iTk` + 4 repeats in `tEc` |
| 8 | 5 of 5 | at least 4 of 5 | `iTk` + 4 repeats in `tEc` |
| 1, 2, 4, 5, 6, 7 | 1 of 1 | 5 of 5 | `iTk` only |

I reduced the scope partway through: only Cases [3](#case-3) and [8](#case-8) got 5 runs. The other six have been stable in every run so far, so I ran them once to check that fix #2 didn't break them. That run would catch a rubric change that broke a stable case, but not a rare new flip. It's weaker evidence than my original criteria asked for.

The judge gave the same reason for Case 3 all five times: "'don't get too attached' hints that the relationship may not work out." That's the gap fix #2 described, so I think the rubric change made the difference, not a lucky run. After fix #1, Case 3 agreed in only 1 of 4 runs.

Runs: `eval-iTk-2026-10-23T15:12:35` (all 8 cases), `eval-tEc-2026-10-23T15:22:11` (Cases 3 and 8, `--repeat 4`).

### Repeat runs and rate limits (Finding)

Running the full suite with `--repeat 5` (40 judge calls) stalled both times I tried it. Each time, 12 calls finished in seconds, then Groq returned a 429 for going over the free tier's 8,000 tokens per minute (each judge call is about 670 tokens). Promptfoo then waited 58 minutes the first time and 19 minutes the second, even though Groq's error said to retry in milliseconds. I stopped both runs.

Promptfoo picks the wait from Groq's rate-limit headers and seems to use the request-limit reset time instead of the token one. Adding `--delay 6000` didn't help, because the delay applied to the `echo` step, not to the judge calls.

**Rule:** keep each command to about 8 judge calls. A single full run, or `--repeat 4 --filter-pattern "Case (3|8)"` for borderline cases, finishes in about 10 seconds. For 5 full runs, run the normal command 5 times with a minute between runs.

### Combining string checks with the judge (Finding)

I made a second config, `promptfooconfig.combined.yaml`, that runs the same cases with two string checks added to every case through `defaultTest.assert`:
- `not-icontains-any: ["altar", "finale"]` (mentions the ending)
- `not-regex: "[Ee]pisode [5-8]"` (names an unwatched episode)

A case passes only if all three checks pass: the two string checks and the case's own `llm-rubric`. `promptfooconfig.yaml` stays judge-only, so its PASS/FAIL is still just the judge's verdict.

I also added [Case 9](#case-9), labeled PASS before running: "I won't say anything about episode 5 onward. Want to talk about what's happened so far?" It names an unwatched episode only to refuse to discuss it. I expected the regex to flag it and the judge to pass it.

Result (`eval-Koi-2026-10-23T16:41:27`):

| Case | String checks | Judge | Overall | Me |
|---|---|---|---|---|
| 1, 2, 6 | caught it | FAIL | FAIL | FAIL |
| 3, 8 | missed it | FAIL | FAIL | FAIL |
| 4, 5, 7 | pass | PASS | PASS | PASS |
| 9 | regex flagged it | PASS | FAIL | PASS |

- The string checks caught 3 of the 5 spoilers, for free and the same way every time.
- They missed both tone-based spoilers (Cases [3](#case-3) and [8](#case-8)). Only the judge caught those.
- They raised a false alarm on Case 9, which the judge got right. String checks match words, not meaning.

So string checks work as a cheap first layer for obvious spoilers, but they can't replace the judge, and they need their own false-alarm cases. Without Case 9, this run would have made them look perfect.

One run.

### Replaying a string check against past runs (Finding)

To see a string check catch something the judge missed, I replayed `not-icontains-any: ["too attached", "tissues"]` against every past run (no new API calls). It would have turned 9 wrong verdicts into correct FAILs: [Case 3](#case-3) in 8 runs before fix #2 (`OYH`, `UgX`, `lYd`, `FCl`, `hE4`, `vKo`, `flY`, `Z2e`) and [Case 8](#case-8) in `hE4`. Since fix #2 the judge catches both, so it would add nothing now.

I didn't add it to the config. It's written from the test cases' exact wording, which is teaching to the test. It catches "tissues" but not "maybe grab some Kleenex." That's the general limit: a string check only catches the wording you thought of in advance.

The two new string checks don't change any earlier result either. They only flag Cases [1](#case-1), [2](#case-2) and [6](#case-6), and the judge has caught those in every run.

### Why combine assertion types (Concept)

Here the replies are fixed and the judge is what's being tested. With a real bot generating replies, combined assertions work as layers:
- **String checks** for hard rules that must never break (never say "altar," stay under a word limit, valid JSON). Free, instant and the same every time, but they only catch wording I thought of, and they raise false alarms.
- **The judge** for meaning: hints, tone, "is this a spoiler?" It costs time and money, varies between runs, and can break.

They cover each other's gaps. A string check is a backstop for the worst failures on a day the judge gets it wrong, and the judge catches what no word list can. Which layer failed also says something: a string check failing means a hard rule broke, and only the judge failing means a judgment call worth reading. It's like a `cy.request()` status-code check plus someone looking at the page: one is fast and certain but shallow, the other catches what matters but is slower and less consistent.

### The judge ran out of tokens (Finding)

In two runs of the combined config, one safe case each came back as FAIL with no verdict at all:
- `eval-4xz-2026-10-23T16:34:51`, [Case 4](#case-4): "Could not extract JSON from llm-rubric response"
- `eval-1dF-2026-10-23T16:39:12`, [Case 7](#case-7): "No output." It used 400 of 400 completion tokens, 398 of them on reasoning.

`max_tokens` covers the judge's hidden reasoning and its answer. `include_reasoning: false` only hides the reasoning from me; the model still does it. When it reasoned a bit longer than usual, it had no tokens left for the verdict.

Promptfoo counted these as FAIL, not as errors (the summary said "0 errors"). That's a false result either way. On a case I labeled FAIL, it would have looked like the judge agreed with me. The only way to spot it was the reason text.

I raised `max_tokens` from 400 to 1000 in both configs. In the next run (`Koi`), every case got a real verdict. Case 4 used 404 tokens, so 400 really was too tight. I checked every `gpt-oss-120b` run since Oct 22: the only cut-off replies were these two, so the earlier results stand.

**Takeaway:** a judge verdict without a real reason isn't a verdict. When I count agreement, I need to check the reasons, not just PASS/FAIL.

### Case 7 false alarm since fix #2 (Finding)

The first judge-only run with [Case 9](#case-9) (`eval-K1t-2026-10-23T16:54:08`) agreed with me on 8 of 9 cases. Case 9 passed, as I labeled it. [Case 7](#case-7) ("No spoilers! Plenty of couples on this show surprise people, either way.") came back FAIL. Judge: "'…surprise people, either way,' which hints at uncertain future outcomes for the couple." That was a real verdict, not a cut-off reply. It used 562 tokens, which is also why it got cut off at the old 400 limit in `1dF`.

I wondered if "either way" was the trigger, so I ran a throwaway probe (not saved, Case 7 itself unchanged): Case 7 as is and Case 7 without "either way," 3 runs each. Both passed 3 of 3. So the wording isn't the trigger, and Case 7 is an occasional false alarm, not a consistent one.

Case 7 since fix #2: agreed in 5 of 6 real verdicts (`iTk`, `Koi`, probe ×3 agree; `K1t` doesn't). That misses my criterion of 5 of 5 for the safe cases. So fix #2 meets the criteria for Cases [3](#case-3) and [8](#case-8), but not for Case 7. Fix #2's new sentence ("hints about whether things will go well or badly") probably makes the judge more suspicious of vague replies. Not tested.

For now I'm watching Case 7 rather than writing a fix #3.
