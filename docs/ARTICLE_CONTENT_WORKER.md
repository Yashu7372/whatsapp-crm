# Article Content Worker

The article worker is intentionally configuration-driven. Article structure, series length, tone, validation rules and visual composition are data, not hardcoded renderer behavior.

## Canonical flow

`source context -> article model -> section generation -> claim/evidence validation -> canonical markdown -> platform variants -> visual model -> HTML/CSS render -> publication gate`

## Fixed intellectual rhythm, configurable implementation

The default `engineering-deep-dive-v1` pattern follows this rhythm:

1. Hero — title, tension, one-line promise and visual concept.
2. Engineering tension — the two forces pulling against each other.
3. Real problem — concrete consequence of that tension.
4. Incident — real/generalized/hypothetical scenario, explicitly labelled. Dry sarcasm is allowed only to illuminate the engineering lesson.
5. Why existing approaches fail.
6. System idea — responsibility, inputs, outputs and what it deliberately does not do.
7. Usage — where the pattern helps and where it is overkill.
8. Concrete task.
9. Task snapshot before.
10. Request journey.
11. Decision point.
12. Implementation — source-grounded when implementation claims are made.
13. Trade-offs.
14. Failure path.
15. Task snapshot after.
16. Verification/evidence.
17. Proof status — VERIFIED / DESIGN_INTENT / UNKNOWN / NOT_IMPLEMENTED.
18. Architecture reference when useful.
19. Broader industry usage.
20. One line to remember.
21. Next article.
22. Source references.

The sequence can be changed by editing the pattern JSON. The worker iterates sections from configuration and does not contain article-specific section limits or series numbers.

## Authority boundary

Facts are deterministic: branch, commits, files, test results, task snapshots, evidence tables and verdicts.

Interpretation is AI-assisted: tension explanation, incident narrative, why naive approaches fail, trade-offs and transitions.

Verdicts are deterministic: unsupported claims, missing evidence or missing required sections block DONE.

## Incident policy

An incident must declare `real`, `generalized` or `hypothetical`. Never invent a real production incident. Humor is limited to dry engineering sarcasm and must never mock people or teams.

## Definition of DONE

DONE means every configured validation flag passes. A model returning prose is not completion.
