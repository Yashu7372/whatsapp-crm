# Why Engineering Needs a Control Plane

*The agent can act. The harder question is who decides when it is allowed to act.*

**Engineering Control Plane · Article 1 / 70**

## Engineering tension

Modern coding assistants are very good at turning intent into action. Give one a repository, a failing test, a terminal and enough context and it can inspect code, suggest a plan, edit files, run commands and iterate. That creates an obvious temptation: if the model can do all of those things, why not let one loop own the entire task?

Because capability and authority are not the same thing.

The engineering tension is **autonomy versus control**. We want the speed of an autonomous worker, but we also need deterministic boundaries around what it may touch, when it may continue, what it must verify and what happens when information is missing. The more open-ended the loop becomes, the harder it is to explain why a particular action happened. The more tightly we constrain every step, the more we risk turning the system into a slow collection of approval forms.

A useful control plane sits between those extremes. It does not make the worker less intelligent. It makes the surrounding system more explicit. The worker may know how to modify a service, query a database or run a test suite. The control plane decides whether enough context exists, which capability is authorized, how many attempts are allowed, what evidence is required and whether the task has actually reached a valid terminal state.

That distinction becomes more important as engineering automation expands from code completion into repository-scale changes, migrations, runtime diagnosis, simulation and production-adjacent workflows.

## The real problem

Consider a task that sounds almost trivial:

**REQ-001 — Fix a service that starts locally but fails when one dependency is unavailable.**

A free-form agent can inspect the startup exception, identify the dependency, change configuration and keep trying until the process stays alive. But the task contains hidden questions. Is the dependency optional in this environment? Is there already a simulator profile? Is the failure expected? Does another service depend on the same configuration? Is changing the code even the correct action, or should the runtime profile start a simulator instead?

If those questions are not represented explicitly, the model has only two choices: ask the user every time or silently make assumptions. Neither scales well. Constant questioning removes most of the automation benefit. Silent assumptions create the much more dangerous situation where the system looks productive while steadily moving away from the intended architecture.

The real problem is therefore not "can AI fix the startup error?" It is "can the engineering system keep facts, assumptions, authority, execution and evidence separate while still moving quickly?"

## Of course this happened

**Incident type: generalized engineering scenario.**

A service fails because a downstream dependency is unavailable. Someone adds a fallback, the process starts, the test turns green and everybody goes home happy. The next environment already had an approved simulator for that dependency, so the new fallback bypasses the exact behavior the simulator was meant to validate.

Naturally, the service was considered "fixed" because the console stopped being red. The architecture apparently forgot to submit a support ticket to the console first.

The lesson is not that fallbacks are bad. The lesson is that an execution result is not enough to explain whether the action was correct.

## Why the usual approaches fail

The simplest agent loop is attractive:

1. understand the request;
2. inspect the repository;
3. generate a plan;
4. edit code;
5. run tests;
6. repeat until green.

For small tasks this can be perfectly reasonable. The problem begins when the same loop owns every decision. A missing runtime fact becomes a planning assumption. A failing command becomes a reason to try another command. A passing test becomes evidence that the entire engineering outcome is complete. None of those transitions are necessarily wrong, but they are implicit.

Another common approach is to encode a giant system prompt describing every rule, environment, dependency, architectural pattern and test expectation. That improves context but creates a different problem: every task pays the cost of the entire knowledge base, and rules become prose rather than executable state.

A third approach is to wrap the agent in a workflow engine but still let the agent decide what every workflow node means. The boxes look deterministic while the semantics remain open-ended.

The pattern we need is narrower: deterministic control around non-deterministic capability.

## The system idea

The Engineering Control Plane treats an engineering task as a durable stateful record rather than a conversation.

At minimum the task carries:

- goal and success condition;
- known facts;
- unknown facts;
- selected environment/profile;
- authorized capabilities;
- plan and attempt count;
- outputs and errors;
- evidence;
- current verdict.

Workers perform capabilities. They do not own the lifecycle.

A repository worker may search code. A process worker may start a service. A simulator worker may start a dependency substitute. A test worker may execute a suite. An AI worker may interpret evidence or propose the next bounded action. The control plane owns the transitions between those actions.

That means the control plane can say:

- context insufficient — retrieve before planning;
- plan authorized — execution may begin;
- attempt limit reached — stop and diagnose;
- tests passed but required evidence missing — do not declare done;
- task verified — close.

It deliberately does **not** try to become the smartest worker. Its value is authority, state and policy.

## When this is useful

This pattern becomes valuable when tasks cross more than one engineering boundary: code plus runtime, code plus infrastructure, multiple services, simulations, migrations, external dependencies, compliance evidence or multiple workers contributing to the same outcome.

It is especially useful for AI-assisted engineering because a capable model can move faster than a human can manually inspect every intermediate assumption.

It is probably overkill for a throwaway script, a tiny isolated refactor or a task where one deterministic command already proves success. A control plane should reduce operational ambiguity, not manufacture ceremony where none exists.

## Concrete task

**REQ-001 — Start Order Service in an isolated development profile when Payment Gateway is unavailable.**

Success means the service starts against an approved simulator, the runtime profile records which dependency was substituted, the smoke test passes and the final task evidence shows that no production configuration was changed.

## Task snapshot — before

```text
TASK              REQ-001
GOAL              Start Order Service in isolated development
KNOWN             service jar exists; payment dependency required
UNKNOWN           approved simulator/profile for payment
ENVIRONMENT       local
ATTEMPTS          0
EVIDENCE          —
VERDICT           BLOCKED_ON_CONTEXT
NEXT CONTROL      Resolve dependency strategy
```

The important field is not the service name. It is `UNKNOWN`. The system can run commands already, but it is not authorized to invent the dependency strategy.

## Request journey

The request enters the control plane and becomes a task record. Runtime context resolution identifies the target service and dependency. The context resolver discovers that the payment endpoint is unavailable. Instead of immediately changing code, the knowledge layer searches configured environment profiles and finds an approved payment simulator.

The plan becomes bounded: start simulator, start service with the isolated profile, run smoke test, collect process and test evidence, then verify that the runtime used the simulator configuration.

Execution is delegated to workers, but every completed step updates the same task record. If the simulator fails to start, the service step never runs. If the service starts but the smoke test fails, the task moves to diagnosis instead of blindly repeating the whole plan.

## Decision point

```text
QUESTION
Do we know enough to change application code?

Runtime profile resolved        PASS
Approved simulator found        PASS
Application defect proven       NO
Production config change needed NO

DECISION
DO NOT MODIFY CODE

NEXT ACTION
Start approved simulator and validate runtime behavior
```

This is a small decision, but it demonstrates why authority matters. A coding worker was capable of changing the application. The control plane chose not to authorize that capability.

## Implementation shape

The implementation should stay generic. The task contract knows nothing about "payment" specifically. A profile describes services, commands, environment variables and dependency substitutes. A worker registry exposes capabilities such as `process.start`, `simulator.start`, `test.run` and `context.inspect`. A planner builds steps from resolved task context. A state machine validates which transitions are legal.

Changeable values belong in profile/configuration data. The orchestration code should not contain environment-specific URLs, fixed service lists or assumptions about the number of dependencies. The same contracts must support a Java service today, a Python worker tomorrow or a front-end process later.

The first implementation can remain terminal-first. That is actually useful: process IDs, exit codes, stdout, stderr and test results are concrete evidence. A UI can come later without becoming the source of truth.

The article's implementation claim should only move to `VERIFIED` when source files, tests and runtime evidence are linked. Until then, the architecture described here is `DESIGN_INTENT`.

## Trade-offs

What we gain is explicit authority, resumable state, bounded execution, explainability and a natural place to attach evidence.

What we pay for is more modeling. A task needs lifecycle states. Workers need typed contracts. Configuration needs schemas. The system must distinguish an execution failure from a context gap and a verification failure.

There is also a latency cost. A control plane may perform context resolution before acting, while an unconstrained agent might immediately try the obvious change. The trade is deliberate: a few seconds of control is often cheaper than several iterations of correcting the wrong assumption.

## Failure path

Assume the simulator starts but the service still fails because another dependency is missing.

The bounded behavior should be:

```text
Attempt 1    simulator PASS
             service FAIL: inventory endpoint unavailable

CONTROL      stop current plan
             update UNKNOWN facts
             resolve new dependency

NOT ALLOWED  edit random timeout values
             retry same command indefinitely
             mark task complete because simulator worked
```

Failure adds information to the task. It does not erase the plan and start another conversation from scratch.

## Task snapshot — after

```text
TASK              REQ-001
GOAL              Start Order Service in isolated development
KNOWN             payment simulator approved and running
                  inventory dependency also required
UNKNOWN           inventory dependency strategy
ENVIRONMENT       isolated-local
ATTEMPTS          1
EVIDENCE          payment-simulator.log
                  service-startup.log
VERDICT           BLOCKED_ON_CONTEXT
NEXT CONTROL      Resolve inventory dependency
```

The task is not "failed" in the generic sense. The system knows exactly why progress stopped.

## Verification and evidence

A completion gate for this task could require:

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| Approved simulator used | resolved profile + simulator startup log | PASS |
| Service starts | process health check | PENDING |
| Smoke test succeeds | smoke-test result | PENDING |
| Production configuration unchanged | git diff / config comparison | PENDING |
| Runtime dependency substitutions recorded | task evidence record | PASS |

The overall verdict remains **NOT VERIFIED** until every required assertion has evidence.

## What is actually proven?

**VERIFIED:** the article's control rules can be represented deterministically as task state, transitions and evidence requirements.

**DESIGN INTENT:** the full Engineering Control Plane will orchestrate repository, process, simulator, test and AI workers through the same lifecycle.

**UNKNOWN:** production-scale performance and the final worker/plugin boundaries until the implementation is exercised across several real repositories.

**NOT IMPLEMENTED:** autonomous production changes. The purpose of the foundation is controlled engineering work, not unattended production mutation.

## Broader industry usage

The same pattern appears under different names. Kubernetes has a control plane separating desired state from the controllers and workloads that realize it. CI/CD platforms separate pipeline policy from individual build tools. SRE practices use release criteria and error budgets to prevent a successful build from becoming the only definition of readiness. Policy engines separate authorization from the applications requesting action.

The AI-specific difference is that the worker itself can reason and propose new actions. That increases capability but makes the authority boundary more important, not less.

## One line to remember

**The agent is a capability. The control plane owns authority.**

## What comes next

Article 2 moves from authority to runtime: why profile-driven environments should exist before the control plane starts managing processes.

## Source references

Incident: generalized engineering scenario.

Implementation status for this article: architecture/design intent until linked to the Engineering Control Plane source branch, tests and runtime evidence.
