# SKILL: progressive-overload-coach
# Paste this content into the Sinas skill editor as a new skill

PROGRESSIVE OVERLOAD — COMPLETE GUIDE:

WHAT IS PROGRESSIVE OVERLOAD:
Progressive overload means consistently giving the body a slightly harder stimulus than last time.
Without it, the body adapts and stops growing stronger or bigger.
The AI must apply this principle every session — never suggest the exact same workout twice.

THE HIERARCHY OF PROGRESSION (use in this order):
1. Add reps (if under target rep range, hit target first)
2. Add weight (+2.5kg for upper body, +5kg for lower body)
3. Add a set (go from 3 sets to 4 sets)
4. Reduce rest time (harder without adding weight)
5. Improve form/range of motion (only if really needed)

Never add weight AND sets AND reps at the same time — one variable at a time.

PLATEAU DETECTION:
- Same exercise, same weight, 3+ sessions → PLATEAU. Time to add 2.5kg.
- Same exercise, same weight, reps going DOWN → too heavy. Drop 5% and rebuild.
- User rating consistently 1-2 → systemic overtraining. Deload immediately.
- User rating consistently 4-5 + "easy" feedback → sandbagging. Push harder.

DELOAD PROTOCOL:
Trigger: user rates 2 sessions in a row at 1-2, OR same weight for 4+ sessions, OR user says they feel burnt out.
Action: Reduce ALL weights by 10-15%. Keep same number of sets. Duration: 1 week.
Purpose: Let the nervous system recover so you can come back stronger.
After deload: return to previous weights and progress normally.

WEIGHT SUGGESTION FORMULA BY GOAL:
- Strength (4-6 reps): 85-90% of estimated 1RM. Big jumps, long rest (3-5 min).
- Hypertrophy (8-12 reps): 70-80% of estimated 1RM. Moderate rest (60-90s).
- Endurance (12-15+ reps): 55-65% of estimated 1RM. Short rest (30-60s).

PROGRESSIVE SETS (WITHIN A SESSION):
Build up to the working weight — never start at max weight.
- 2 sets: 1 warm-up at -2.5kg, 1 working set at target
- 3 sets: 2 warm-ups building up, 1 working set at target
- 4 sets: 3 progressive warm-ups, 1 heavy working set at target
Increment: 2.5kg per step for light weights (<60kg), 5kg per step for heavy (≥60kg)

Examples:
- Target 30kg × 3 sets → 25kg, 27.5kg, 30kg
- Target 80kg × 3 sets → 70kg, 75kg, 80kg
- Target 100kg × 4 sets → 85kg, 90kg, 95kg, 100kg
- Target 15kg × 2 sets → 12.5kg, 15kg

BEGINNER VS INTERMEDIATE VS ADVANCED:
- Beginner (0-6 months, or no history in app): add weight every session. Start light. Learn the movement.
- Intermediate (6-24 months): add weight every 1-2 weeks. Focus on compound lifts.
- Advanced (2+ years): add weight monthly. Technique and programming matter more.
Infer level from history: if user has lots of sessions with consistent progression = intermediate/advanced.

HOW TO APPLY IN WORKOUT GENERATION:
1. Pull LAST KNOWN WEIGHTS for each exercise
2. Run plateau detection
3. For plateaued exercises: suggest +2.5kg
4. For non-plateaued: use goal + energy formula to set today's weight
5. Build progressive sets around that working weight
6. Note any progressions in the reasoning field
