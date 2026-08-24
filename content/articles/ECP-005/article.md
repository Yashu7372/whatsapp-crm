# Done Is Not a Boolean

*Code can compile, tests can pass, and the task can still be unverified.*

**Engineering Control Plane · Article 5 / 70**

## Engineering tension

The final tension in an automated engineering task is **completion speed versus evidence quality**. Teams want a fast answer to a simple question: is the work done? But engineering outcomes are rarely represented by one signal.

A build passing proves compilation. A unit test passing proves one set of assertions under one environment. A service starting proves the process remained alive long enough to satisfy a health check. None of those signals individually proves that the original requirement is satisfied.

Humans often collapse those distinctions because context is in their heads. We know which test matters, which dependency was simulated and which production behavior is still uncertain. An automated system cannot depend on that implicit knowledge. If it is going to declare completion, the claims behind that declaration must be represented explicitly.

The control-plane answer is an Evidence Gate: a deterministic check that asks whether every required completion claim has sufficient evidence.

## The real problem

Return to the shipment change from the previous articles. The transition rule is updated. The targeted integration test passes. The projection regression suite passes. The diff is limited to the expected files.

It looks done.

But the requirement includes one more assertion: existing consumers of the shipment event must remain compatible. The consumer contract suite has not run because one test environment is unavailable.

If the system returns `DONE=true` because the code and available tests are green, it has transformed "not checked" into "passed." That is not automation. It is optimism with a boolean type.

## Of course this happened

**Incident type: generalized engineering scenario.**

The dashboard shows four green checks and one missing integration environment. Someone asks, "Can we just mark it green and rerun later?"

Of course. And while we are here, perhaps `UNKNOWN` can be renamed to `PASS_BUT_SHY`.

The sarcasm points to a real semantic error: absence of evidence is not positive evidence.

## Why existing approaches fail

Many workflows use the last command as the final truth. If CI exits zero, the task is done. That works only when the pipeline itself completely represents the requirement.

Another approach is a confidence score. The system may be 95% confident the change is correct, but confidence does not tell a reviewer which claim remains untested.

A checklist is better, but manually maintained checklists drift. An evidence gate should be derived from the task contract and produce machine-readable verdicts.

The weakest approach is an AI self-review that asks the same model that produced the change whether it looks complete. Self-review can find issues, but it cannot create evidence that does not exist.

## The system idea

An Evidence Gate evaluates completion assertions. Each assertion has:

- a requirement or claim;
- acceptable evidence types;
- collected evidence references;
- verdict;
- optional policy such as freshness or environment.

The core verdict vocabulary should remain small and explicit:

```text
PASS       required evidence exists and satisfies policy
FAIL       evidence demonstrates the requirement is not met
UNKNOWN    evidence is missing or insufficient
SKIPPED    policy explicitly says the assertion does not apply
```

The overall task verdict is derived from those assertions. The default rule is simple: required `FAIL` or `UNKNOWN` assertions prevent completion.

The gate does not run tests itself. It does not modify code and it does not decide implementation strategy. It evaluates the evidence produced by other capabilities.

That separation matters because evidence may come from many sources: test reports, git diff, runtime probes, static analysis, screenshots, generated artifacts, database comparisons, logs or human approval.

## When this is useful

Use an evidence gate when multiple independent signals contribute to completion: AI-generated code, migrations, multi-service changes, infrastructure updates, production simulation, compliance workflows, release automation or any process where a false positive is materially expensive.

It may be unnecessary for a tiny deterministic task where one command fully proves the requested outcome, for example formatting a file and verifying it matches a formatter's output.

The gate should reflect risk, not become bureaucracy by default.

## Concrete task

**REQ-005 — Complete the shipment transition fix only when behavior, compatibility and scope are proven.**

## Task snapshot — before

```text
TASK              REQ-005
GOAL              Verify shipment transition change
IMPLEMENTATION     COMPLETE
TARGET TESTS       PASS
REGRESSION TESTS   PASS
CONSUMER CONTRACT  NOT RUN
DIFF SCOPE         PASS
VERDICT            EVIDENCE_INCOMPLETE
NEXT CONTROL       Resolve consumer compatibility evidence
```

The implementation is finished. The task is not.

## Request journey

The control plane receives the execution result and creates completion assertions from the task's verification policy. It attaches existing test outputs to the relevant assertions. The scoped diff satisfies the "no unrelated files" assertion. The integration and projection reports satisfy behavior assertions.

The consumer compatibility assertion has no acceptable evidence. The environment required for that suite is unavailable, so the assertion becomes `UNKNOWN`.

The gate does not ask the model whether compatibility is probably fine. It returns a blocked verdict with one precise reason.

Later, the contract suite becomes available and passes. The evidence reference is attached, the assertion is re-evaluated and the overall task transitions to `VERIFIED` without rerunning unrelated work.

## Decision point

```text
QUESTION
Can REQ-005 be closed?

Transition behavior                PASS
Projection behavior                PASS
Change scope                       PASS
Consumer compatibility             UNKNOWN

DECISION
NOT VERIFIED

BLOCKING ASSERTION
Consumer compatibility has no evidence

NEXT ACTION
Run approved contract suite when environment is available
```

This is a much more useful answer than "95% complete."

## Implementation shape

The evidence model should be generic and typed. A claim references evidence by identifier rather than embedding entire logs. Evidence metadata can include producer, timestamp, environment, artifact location and checksum. Policies determine which evidence types satisfy which assertion.

For example, a `consumer_compatibility` assertion may accept a contract test report generated from a specific suite. A `scope_integrity` assertion may require a git diff evaluated against allowed paths. A `runtime_behavior` assertion may require a health probe plus an integration result from an approved profile.

Changeable requirements belong in task or policy configuration. The Evidence Gate code should not know that there are exactly four checks, that an article series has seventy entries, or that a shipment system exists. It evaluates arbitrary assertions according to configured policy.

The same model should support progressive evidence. If one assertion is unknown, previously passing evidence remains attached; the system does not need to erase state and rerun everything.

For AI-generated articles and portfolio publishing, the same principle is useful: a claim labelled `VERIFIED` must cite code, test, commit, configuration, runtime or external evidence. A planned capability should be labelled `DESIGN_INTENT`, not quietly described as already implemented.

## Trade-offs

The strongest benefit is semantic honesty. The system can explain exactly what is proven and what is not. It also enables resumable workflows: missing evidence can be collected later without repeating completed steps.

The cost is that requirements must be modeled well enough to produce assertions. Poorly designed gates can create false confidence too. A passing test is only valuable if the test genuinely represents the requirement.

Evidence storage also needs lifecycle rules. Artifacts become stale. Environments change. A result from last week's build may not be valid for today's commit. Freshness and provenance eventually matter.

There is a user-experience trade-off as well. Engineers do not want a wall of twenty checks for every tiny change. The visible gate should highlight blockers and summarize passing evidence while retaining full detail for audit.

## Failure path

Suppose a worker tries to satisfy the missing compatibility check by attaching the existing unit-test report.

```text
ASSERTION          consumer compatibility
REQUIRED EVIDENCE  consumer contract suite
PROVIDED           state-machine unit tests

GATE               REJECT EVIDENCE
VERDICT             UNKNOWN
NEXT CONTROL        collect accepted evidence
```

The existence of some test evidence is not enough. Evidence has to support the specific claim.

Now suppose the required suite runs and fails:

```text
CONSUMER CONTRACT  FAIL
OVERALL VERDICT    NOT VERIFIED
NEXT CONTROL       create remediation task / return to planning
```

The gate turns completion back into engineering work instead of hiding the failure behind an earlier green build.

## Task snapshot — after

```text
TASK              REQ-005
GOAL              Verify shipment transition change
IMPLEMENTATION     COMPLETE
TARGET TESTS       PASS
REGRESSION TESTS   PASS
CONSUMER CONTRACT  PASS
DIFF SCOPE         PASS
EVIDENCE           integration-report.xml
                  projection-regression.xml
                  consumer-contract.xml
                  scoped-diff.json
VERDICT            VERIFIED
NEXT CONTROL       CLOSE TASK
```

The difference between the before and after snapshots is one evidence item and one verdict. No new implementation was required.

## Verification and evidence

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| Correct transition after facility scan | integration-report.xml | PASS |
| Projection reflects terminal state | projection-regression.xml | PASS |
| Existing consumers remain compatible | consumer-contract.xml | PASS |
| No unrelated files changed | scoped-diff.json | PASS |
| Required evidence belongs to current commit | evidence metadata / commit SHA | PASS |

**OVERALL VERDICT: VERIFIED**

The important point is not the table. It is that every cell can be derived and checked by the system.

## What is actually proven?

**VERIFIED:** explicit evidence assertions allow the system to distinguish PASS, FAIL and UNKNOWN without coercing missing checks into success.

**DESIGN INTENT:** the Engineering Control Plane will use evidence policy to gate task completion across code, runtime, simulation and publishing workflows.

**UNKNOWN:** the final evidence-retention and freshness policy until the platform is exercised across longer-running workflows.

**NOT IMPLEMENTED:** a claim that every engineering task can be fully verified automatically. Some evidence will legitimately require human review.

## Architecture reference

```text
Execution Workers
      │
      ├── code diff
      ├── test reports
      ├── runtime probes
      └── analysis outputs
             │
             ▼
       Evidence Store
             │
             ▼
        Evidence Gate
             │
      ┌──────┼────────┐
      ▼      ▼        ▼
    PASS    FAIL    UNKNOWN
             │
             ▼
       Task Verdict
```

This architecture keeps evidence production separate from verdict authority.

## Broader industry usage

CI quality gates, regulated change management, security policy checks and SRE release criteria all use variants of this idea. A deployment may require build success, vulnerability thresholds, approvals and environment validation. Data pipelines use quality rules before publishing datasets. Financial systems reconcile independent records before settlement.

The common pattern is simple: critical completion is a conjunction of evidence-backed assertions, not a feeling produced by the last successful command.

AI-assisted engineering makes this more important because the system can generate persuasive explanations even when a required check never happened.

## One line to remember

**Missing evidence is not a pass.**

## What comes next

The next articles can build on this foundation by connecting task state, runtime context, knowledge resolution, bounded execution and evidence into one configurable control DAG rather than treating them as isolated engines.

## Source references

Incident: generalized engineering scenario.

Implementation status: design intent until linked to Evidence Gate source, validation tests and real task evidence artifacts.
