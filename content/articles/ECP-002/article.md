# Context Before Intelligence

*The fastest wrong answer is still wrong — it just arrives with lower latency.*

**Engineering Control Plane · Article 2 / 70**

## Engineering tension

AI engineering systems are constantly balancing **context completeness against context cost**. Give a worker too little information and it fills gaps with assumptions. Give it everything and the useful facts disappear inside a giant prompt, a huge retrieval result or a noisy repository dump.

This tension is not only about token cost. It is about decision quality. A worker asked to fix a service needs some runtime facts: which profile is active, which dependencies are actually running, whether a simulator is approved, what command started the process and which environment variables shaped the behavior. It does not need every document ever written about the service.

The wrong instinct is to treat context as a bag of text. The better model is to treat context as a **task-specific runtime contract**. Before intelligence is spent, the system should resolve the minimum set of facts required to make the next decision safely.

That makes runtime context retrieval a control-plane capability rather than a convenience function around an LLM.

## The real problem

Take a common debugging request:

**REQ-002 — API returns HTTP 500 locally, but the same commit passes in integration.**

A coding agent can inspect the controller, service and exception stack. But the behavior may have nothing to do with the code path it first sees. The local machine may be using a stale environment variable. Integration may have a feature flag enabled. A local dependency may be mocked while integration talks to a real service. The process may even be running an older JAR than the repository currently contains.

If the worker begins by reading code only, it is solving a source-code problem that may not exist.

The real engineering question is: **what is actually running right now, under which configuration, against which dependencies?**

## Of course this happened

**Incident type: generalized engineering scenario.**

A developer spends an hour tracing a null pointer through perfectly reasonable code. Eventually someone notices the terminal is running yesterday's JAR from another directory.

Naturally, the source code was innocent. It simply lacked the ability to walk over to the other terminal and introduce itself.

The lesson is simple: repository state and runtime state are related, but they are not the same thing.

## Why existing approaches fail

The first naive approach is "read the repository and infer the runtime." That works only when conventions are perfectly followed and no stale process, override or profile difference exists.

The second is "dump all environment variables and process output into the prompt." That improves visibility but replaces missing context with unstructured noise. Sensitive values may also leak into logs or model input.

The third is a manually maintained checklist. Useful for humans, but fragile when the system must automate across many services and environments.

What is missing is a typed runtime snapshot that the control plane can reason about deterministically before an AI worker interprets it.

## The system idea

A Runtime Context Resolver collects a bounded, normalized view of the current execution environment. It can expose facts such as:

- repository and current branch;
- build artifact path and hash;
- process ID and command line;
- selected profile;
- non-secret environment keys and resolved configuration sources;
- listening ports;
- known dependencies and their health;
- active simulators;
- recent relevant logs;
- test target and test environment.

The resolver is not an LLM. Most of this data is deterministic and should remain deterministic. The AI layer can interpret the snapshot later.

The resolver also does not need to know every possible service. Service-specific facts belong in profiles or capability adapters. The resolver orchestrates discovery through generic contracts.

## When this is useful

Use runtime context resolution when a task depends on the difference between what code says and what the machine is actually doing: local debugging, integration failures, service startup, flaky dependency behavior, simulator orchestration, multi-process development environments and test reproduction.

It is less valuable for isolated source transformations where runtime behavior is irrelevant, such as renaming a private helper or formatting a configuration file.

## Concrete task

**REQ-002 — Explain why `/orders/123` fails locally but succeeds in integration.**

Success means the system identifies the relevant runtime difference with evidence before authorizing a code modification.

## Task snapshot — before

```text
TASK              REQ-002
GOAL              Explain local/integration behavior difference
KNOWN             same Git commit reported by developer
                  local endpoint returns 500
                  integration returns 200
UNKNOWN           actual local artifact
                  active profile
                  dependency targets
                  feature flags
CONFIDENCE         0.34
VERDICT            CONTEXT_INCOMPLETE
NEXT CONTROL       Capture runtime snapshot
```

## Request journey

The control plane first captures repository metadata, then enumerates the running process associated with the service. It records the actual command line and artifact path. Configuration resolution identifies the active local profile and safe-to-expose environment metadata. Dependency probes show which upstreams are reachable.

The resulting context reveals that the repository and process are not aligned: the process is running an older artifact. That is enough to change the plan. Instead of authorizing a code investigation, the control plane authorizes a rebuild and controlled restart.

After restart, the endpoint still fails. A second snapshot now shows a different fact: the local profile targets a simulator that does not implement a recently introduced response field. The system can now distinguish two separate issues instead of treating everything as one vague "local failure."

## Decision point

```text
QUESTION
Is there evidence that application code is the cause?

Repository commit matches expected        PASS
Running artifact matches repository       FAIL
Active profile identified                  PASS
Dependencies identified                    PASS
Code defect demonstrated                   NO

DECISION
DO NOT EDIT CODE

NEXT ACTION
Rebuild and restart the correct artifact
```

After restart the gate is evaluated again with new evidence.

## Implementation shape

The resolver should be adapter-based and data-driven. A generic process adapter can inspect PID, command line and ports. A Git adapter can identify repository state. A profile adapter resolves configured environment metadata. Dependency health adapters use configured probes rather than hardcoded service names.

The canonical output is a typed `RuntimeContext` object. It should distinguish values from evidence references. For example, `artifact.path` is a fact; `artifact.sha256` and the command line that launched it are evidence. Secrets should be masked or omitted by policy before any AI worker receives the context.

A context policy determines what must be known for a particular task category. Debugging a startup failure may require process, profile and dependencies. Refactoring a pure function may require none of those. This is how the system stays dynamic instead of loading everything for every prompt.

## Trade-offs

The benefit is fewer false starts, reproducibility and a clear boundary between observed reality and model interpretation.

The cost is building reliable discovery adapters across operating systems and runtimes. Process inspection differs between Windows, Linux and containers. Configuration may come from files, environment variables, secrets managers or platform injection. The context model must be extensible without becoming a giant universal schema.

There is also a privacy/security trade-off. More runtime visibility can expose sensitive data, so redaction is not optional.

## Failure path

Suppose the process cannot be uniquely matched to the repository because several instances are running.

```text
DISCOVERY          3 candidate Java processes
MATCH CONFIDENCE   insufficient

CONTROL            do not guess PID
                    request discriminator or use profile metadata

NOT ALLOWED        attach to first java.exe
                    kill every candidate
                    claim runtime captured
```

Ambiguity is a state to resolve, not an invitation to choose the first row in `ps` output.

## Task snapshot — after

```text
TASK              REQ-002
GOAL              Explain local/integration behavior difference
KNOWN             correct process identified
                  stale artifact discovered and replaced
                  active local simulator missing response field
UNKNOWN           whether simulator contract is outdated or intentionally limited
CONFIDENCE         0.91
EVIDENCE           process-command.txt
                  artifact-hash.txt
                  resolved-profile.json
                  dependency-probe.json
VERDICT            ROOT_CAUSE_CANDIDATE
NEXT CONTROL       Verify simulator contract against source documentation
```

## Verification and evidence

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| Runtime process identified | PID + command line | PASS |
| Artifact matches repository | artifact hash after rebuild | PASS |
| Active profile known | resolved profile snapshot | PASS |
| Dependency difference identified | simulator probe/response | PASS |
| Root cause verified against contract | contract/source reference | PENDING |

The task remains open until the final claim is grounded.

## What is actually proven?

**VERIFIED:** runtime facts can be collected independently from source interpretation and used to block incorrect next actions.

**DESIGN INTENT:** the Control Plane will dynamically resolve only the context required by the current task category.

**UNKNOWN:** the final cross-platform adapter set and performance overhead until exercised across real development environments.

## Broader industry usage

This pattern is familiar in incident response and observability. Operators rely on actual process state, configuration, traces and dependency health instead of assuming deployment intent equals runtime reality. Kubernetes distinguishes desired state from observed state. Configuration management systems detect drift. Reproducible builds exist because "same source" does not automatically mean "same artifact."

AI engineering needs the same discipline. A language model should interpret observed context, not invent the environment from repository conventions.

## One line to remember

**Resolve reality before spending intelligence on interpretation.**

## What comes next

Article 3 focuses on the next boundary: what the system should do when required knowledge is still missing after runtime context has been captured.

## Source references

Incident: generalized engineering scenario.

Implementation status: design intent until linked to concrete runtime-context source, tests and captured execution evidence.
