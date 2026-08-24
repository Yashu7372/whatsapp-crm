# The Knowledge Gap Is a State, Not an Excuse

*When the system does not know enough, the correct next action is not "be more confident."*

**Engineering Control Plane · Article 3 / 70**

## Engineering tension

Every engineering automation system eventually meets a task where the available information is incomplete. The tension is **progress versus epistemic discipline**. We want the system to keep moving, but we do not want missing facts to be silently converted into assumptions.

Humans do this all the time. We see a class name, infer ownership, make the obvious change and then discover that a scheduled projection, message consumer or configuration layer owns the real behavior. AI workers can do the same thing faster and with much more convincing prose.

A trustworthy control plane therefore needs a first-class representation for `UNKNOWN`. Not as a failure message, not as a low-confidence footnote, but as part of task state that can influence authority.

The system should be able to say: "I can execute, but I do not yet know enough to execute responsibly."

## The real problem

**REQ-003 — Shipment status remains `IN_TRANSIT` after a facility scan.**

The obvious code search finds `ShipmentService`, `FacilityScanEvent` and `ShipmentProjection`. A naive plan would modify the service method that handles the event. But one crucial fact is missing: which component owns the terminal-state transition?

If the transition is controlled by a state machine, changing `ShipmentService` duplicates policy. If it is projection-owned, editing the domain service may produce the correct value in one path and the wrong value in another. If the behavior is configuration-driven, code may not need to change at all.

The task is blocked by one missing relationship, not by a lack of coding ability.

## Of course this happened

**Incident type: generalized engineering scenario.**

The agent finds a method called `updateStatus`, changes it, and every unit test around that class passes. Excellent. Unfortunately, production state is rebuilt from an event consumer that never calls that method.

The method name was very cooperative. The architecture, less so.

The lesson is that lexical similarity is not ownership evidence.

## Why existing approaches fail

One approach is to give the model more repository context. That helps only if the needed fact is present and retrievable. Another is to ask the model for a confidence score. A confidence score is not evidence; it is merely a statement about the model's belief.

A third approach is to let the agent implement the most likely solution and use tests to discover whether it was wrong. That can be efficient for low-risk local changes, but it is wasteful when the missing fact can be resolved cheaply through targeted retrieval.

The better pattern is to identify the gap explicitly, classify it, retrieve only what can resolve it and re-evaluate the task.

## The system idea

A Knowledge Gap Resolver works over the task's known and unknown facts. It asks four questions:

1. What decision is currently blocked?
2. Which exact fact is missing?
3. Which sources are capable of resolving that fact?
4. What evidence threshold is enough to continue?

For REQ-003, the missing fact is not "understand shipment architecture." It is narrower: "identify the authoritative owner of the terminal-state transition after `FACILITY_SCAN`."

That query can be resolved from code references, architecture documentation, event flow definitions, tests or historical design decisions. The resolver should prefer the cheapest authoritative source first and expand only if evidence conflicts.

The output is not a paragraph. It is an updated fact with provenance.

## When this is useful

Use this pattern when implementation depends on ownership, contracts, invariants, runtime relationships, data semantics or historical decisions that are not directly observable from the current file.

It is less useful when the task is mechanically local and all required information is already explicit in the source under edit.

## Concrete task

**REQ-003 — Correct the shipment transition after `FACILITY_SCAN` without duplicating state ownership.**

## Task snapshot — before

```text
TASK              REQ-003
GOAL              Correct shipment terminal transition
KNOWN             FacilityScanEvent exists
                  ShipmentProjection exists
                  ShipmentService receives related events
UNKNOWN           authoritative owner of terminal-state transition
CONFIDENCE         0.61
VERDICT            KNOWLEDGE_GAP
NEXT CONTROL       Resolve transition ownership
```

## Request journey

The task starts with code search, but search results are treated as candidate evidence rather than proof. The control plane records the unknown relationship and builds a targeted retrieval request.

The retrieval worker finds a state-machine implementation referenced by both an integration test and an architecture note. A second code path confirms that `ShipmentService` delegates transition evaluation rather than owning it.

The gap is now resolved. The task model is updated with a verified relationship and the planner can build a much narrower implementation plan: change the transition rule in one owner, then run the state-machine and projection tests that prove downstream behavior.

## Decision point

```text
QUESTION
Can planning begin?

Event contract identified             PASS
Transition owner identified           PASS
Downstream projection identified      PASS
Required invariant understood         PASS
Conflicting evidence                  NONE

DECISION
PLAN AUTHORIZED
```

The important part is that authorization changed because evidence changed, not because the model produced a more confident answer.

## Implementation shape

The knowledge layer should store facts separately from retrieval text. A fact can have a subject, relation, object, confidence/provenance and evidence references. Retrieval can still use embeddings, text search, graph traversal or an LLM, but the Control Plane consumes a normalized result.

A generalized gap record could contain:

```text
blocked_decision
missing_fact
candidate_sources
retrieval_attempts
evidence
resolution_status
```

Nothing in that contract needs to mention shipments. The same mechanism can resolve "which service owns this API", "which configuration controls this threshold" or "which database table is authoritative for this projection."

The resolver must also support disagreement. Two documents can claim different owners. In that case the correct state is not `RESOLVED`; it is `CONFLICTING_EVIDENCE`, which can trigger another retrieval strategy or human review.

## Trade-offs

The advantage is fewer speculative changes and a reusable path from uncertainty to evidence. It also makes task history explainable: later reviewers can see which fact blocked the plan and what resolved it.

The cost is additional modeling and retrieval latency. There is also a risk of over-gating: if every tiny uncertainty blocks execution, the system becomes unusably cautious. The answer is task-specific evidence policy, not removing the gap model.

## Failure path

Suppose retrieval finds two sources:

```text
architecture-v1.md     says ShipmentService owns transition
current integration test references ShipmentStateMachine
```

The bounded response is:

```text
STATUS            CONFLICTING_EVIDENCE
NEXT CONTROL      prefer current executable evidence; inspect ownership path
NOT ALLOWED       choose the document because it sounds authoritative
                  choose the test because it is newer without inspection
```

Contradiction is useful information.

## Task snapshot — after

```text
TASK              REQ-003
GOAL              Correct shipment terminal transition
KNOWN             ShipmentStateMachine owns transition policy
                  ShipmentProjection consumes resulting state
UNKNOWN           —
CONFIDENCE         0.93
EVIDENCE           state-machine source
                  integration transition test
                  architecture ownership note
VERDICT            READY_TO_PLAN
NEXT CONTROL       Build bounded implementation plan
```

## Verification and evidence

| Claim | Evidence | Verdict |
| --- | --- | --- |
| State machine owns transition | source call path + test | PASS |
| Projection consumes resulting state | projection test/code | PASS |
| ShipmentService is not the policy owner | delegation path | PASS |
| Proposed change preserves all terminal transitions | regression suite | PENDING |

## What is actually proven?

**VERIFIED:** an explicit unknown can be represented, targeted and resolved using evidence before planning.

**DESIGN INTENT:** the Knowledge Spine will provide multiple retrieval strategies and relation-aware context for this process.

**UNKNOWN:** the final ranking strategy for conflicting knowledge sources until real repositories provide enough examples.

## Broader industry usage

This resembles query planning, static analysis and incident diagnosis. Good systems narrow uncertainty before performing expensive actions. Database optimizers gather statistics before selecting plans. Compilers resolve symbols before generating machine code. SRE investigations establish service ownership and dependency paths before making production changes.

AI engineering should not be the exception where uncertainty is hidden because the model can produce plausible text.

## One line to remember

**Unknown is a valid state. Guessing is an action that requires permission.**

## What comes next

Article 4 looks at what happens after context is sufficient: how to keep implementation bounded when the first attempt fails.

## Source references

Incident: generalized engineering scenario.

Implementation status: design intent until linked to Knowledge Gap Resolver source, tests and retrieval evidence.
