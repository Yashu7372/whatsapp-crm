# The Agent Failed. The System Didn't.

*Failure becomes dangerous when the next action is just "try something else."*

**Engineering Control Plane · Article 4 / 70**

## Engineering tension

Once a task has enough context, the next tension is **adaptability versus bounded execution**. We want an AI worker to react intelligently when a build, test or runtime step fails. But we do not want an open-ended loop where each failure simply creates another unbounded attempt.

Traditional automation is deterministic but brittle: a shell command returns non-zero and the pipeline stops. Agentic automation is flexible but can become difficult to reason about: the worker sees an error, proposes a fix, edits more files, reruns, interprets another error and continues until some stopping condition emerges from the conversation.

The useful middle ground is a bounded loop. The system can adapt, but only inside an explicit envelope: permitted files, permitted capability, attempt budget, expected evidence and escalation rule.

A failed attempt is then not "the agent failed." It is one observation in the control record.

## The real problem

**REQ-004 — Fix a failing integration test after a dependency contract change.**

The system has already resolved ownership and identified the expected contract. The worker makes the smallest code change and runs the targeted integration test. It fails.

The naive reaction is to ask the model to fix the failure. That sounds reasonable, but the next action could expand scope dramatically. Maybe the model changes production code, then the test fixture, then timeout values, then a mock response until everything passes.

At some point we have a green test and no clear explanation of which change was actually necessary.

The control problem is not preventing retries. It is making every retry evidence-driven and bounded.

## Of course this happened

**Incident type: generalized engineering scenario.**

Attempt one fails with a timeout, so someone doubles the timeout. Attempt two fails after twice as long.

A remarkable achievement: we did not fix the defect, but we gave it more time to disappoint us.

The important lesson is that retrying the same hypothesis is not diagnosis.

## Why existing approaches fail

A fixed CI pipeline usually stops too early for autonomous remediation. It provides an error but no controlled path for interpreting it and trying a targeted change.

An unconstrained agent loop has the opposite problem. It can keep changing the environment until a success signal appears. Without an attempt model, scope boundary and evidence record, reviewers cannot distinguish productive adaptation from accidental convergence.

Another weak pattern is "maximum retries = 3" without defining what a retry means. Three identical executions are different from three different code modifications. Attempt count alone is not enough; we also need hypothesis and change scope.

## The system idea

Bounded Execution models an implementation cycle as a sequence of attempts. Each attempt contains:

- hypothesis;
- authorized capability;
- allowed scope;
- change set;
- command/test executed;
- observed result;
- evidence;
- reason for next transition.

A policy defines the envelope. For example:

```text
MAX IMPLEMENTATION ATTEMPTS    3
ALLOWED FILES                  state-machine module + related tests
ALLOWED CAPABILITIES           edit, build, targeted-test, inspect-log
DISALLOWED                     dependency upgrade, broad config change
ESCALATE WHEN                  same failure repeats twice or scope must expand
```

The worker still reasons. The control plane decides whether the proposed next action fits the envelope.

## When this is useful

Use bounded execution for automated code changes, migration repairs, test remediation, configuration diagnosis and any task where iterative learning is useful but uncontrolled scope expansion is risky.

For a read-only investigation, the same pattern can be lighter: the bound may be number of expensive probes or depth of repository traversal rather than edit attempts.

## Concrete task

**REQ-004 — Restore the shipment transition integration test after the authoritative state machine contract changes.**

## Task snapshot — before

```text
TASK              REQ-004
GOAL              Restore transition behavior and regression coverage
CONTEXT           sufficient
PLAN              targeted state-machine change + integration test
ATTEMPTS          0 / 3
ALLOWED_SCOPE     state-machine + transition tests
VERDICT           EXECUTION_AUTHORIZED
NEXT CONTROL       Execute attempt 1
```

## Request journey

Attempt one modifies the identified transition rule and runs the targeted integration test. The test fails because the fixture still sends the old event shape. The worker proposes updating both the test fixture and a shared event deserializer.

The control plane rejects the deserializer change because it is outside the current scope and no evidence shows production deserialization is wrong. It authorizes only the fixture update.

Attempt two now reaches the transition rule but fails on a downstream projection assertion. The worker inspects the projection test and finds that the expected terminal state is stale. Before changing the assertion, the system checks the contract evidence gathered in Article 3. The new state is correct, so the assertion update is authorized.

Attempt three passes the targeted integration test and the related projection regression suite.

The sequence is adaptive, but each expansion is justified.

## Decision point

```text
PROPOSED ACTION
Modify shared event deserializer

Evidence deserializer is wrong       NONE
Change required for current fixture  NO
Within authorized scope              NO

DECISION
REJECT PROPOSED ACTION

AUTHORIZED ALTERNATIVE
Update the test fixture to the verified contract
```

This is the difference between an AI recommendation and an authorized engineering action.

## Implementation shape

The execution layer should treat each worker invocation as a structured command with declared scope and expected outputs. A command runner captures exit code, stdout/stderr references, duration and artifacts. A change worker returns the files it touched. The control plane compares those files with the authorized scope before the next step.

The attempt model itself should be generic. It does not know what a shipment is. It knows hypothesis, action, result and evidence.

A policy engine can be simple initially: configuration plus deterministic checks. Later, AI can assist by classifying whether a proposed action is materially different from the failed hypothesis, but the final authorization should still be represented as explicit state.

The system must also preserve failure artifacts. Re-running a command should not overwrite the evidence from attempt one. A reviewer should be able to reconstruct the sequence later.

## Trade-offs

Bounded execution reduces runaway behavior, narrows review scope and produces an audit trail. It also encourages smaller hypotheses because each attempt has a cost.

The downside is orchestration complexity. Workers need to declare intent and scope. Some failures genuinely require broad exploration, and strict bounds can interrupt useful momentum. The design must support controlled escalation: when evidence proves the scope is wrong, create a new plan rather than forcing the old one to continue.

## Failure path

Suppose attempt two produces the same error as attempt one despite a different change.

```text
ATTEMPT 1        FAIL signature=projection-null
ATTEMPT 2        FAIL signature=projection-null

CONTROL          detect repeated failure signature
                 stop implementation loop
                 transition to diagnosis

NOT ALLOWED      attempt 3 with another speculative edit
```

The remaining attempt budget is not a requirement to spend every attempt.

## Task snapshot — after

```text
TASK              REQ-004
GOAL              Restore transition behavior and regression coverage
ATTEMPTS          3 / 3
CHANGES           transition rule
                  test fixture
                  projection expectation
EVIDENCE          attempt-1-test.log
                  attempt-2-test.log
                  attempt-3-test.log
                  regression-suite.xml
VERDICT           READY_FOR_EVIDENCE_GATE
NEXT CONTROL       Verify completion claims
```

## Verification and evidence

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| Target transition behaves correctly | integration test | PASS |
| Fixture matches verified event contract | fixture diff + contract evidence | PASS |
| Projection expectation matches new terminal state | regression test | PASS |
| No unrelated source files changed | scoped git diff | PASS |
| Broader consumer compatibility | consumer contract suite | PENDING |

Passing the targeted test is progress. It is not automatically the final verdict.

## What is actually proven?

**VERIFIED:** bounded attempts can preserve adaptation while limiting scope and retaining evidence per attempt.

**DESIGN INTENT:** the full Control Plane will combine worker capability declarations, scope policy, repeated-failure detection and escalation.

**UNKNOWN:** optimal attempt policies across different task categories. A compile fix and a distributed integration failure should not necessarily share the same limits.

## Broader industry usage

The pattern resembles transaction retry policies, circuit breakers, deployment rollback rules and SRE incident runbooks. Mature systems do not retry every failure forever. They classify failure, cap repetition and escalate when the current strategy stops producing information.

Agentic engineering should behave the same way. Intelligence is useful inside the loop, but the loop itself needs engineering semantics.

## One line to remember

**A failed attempt is evidence. An unbounded retry is policy failure.**

## What comes next

Article 5 addresses the final boundary: even when implementation and tests succeed, what evidence is required before the system is allowed to say DONE?

## Source references

Incident: generalized engineering scenario.

Implementation status: design intent until linked to bounded-execution source, tests and attempt traces.
