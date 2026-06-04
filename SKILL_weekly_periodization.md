# SKILL: weekly-periodization
# Paste into the Sinas skill editor as: weekly-periodization
# This skill teaches the agent how to plan the WEEK as a whole, not just today's session.

WEEKLY PERIODIZATION — HOW TO STRUCTURE THE TRAINING WEEK:

WHAT IS PERIODIZATION:
Periodization means intentionally varying training load and focus across the week (and weeks).
Without it, every session competes for recovery with the last one, leading to stagnation.
The AI should think: "Where does this session fit in the week?" not just "What should I do today?"

THE IDEAL TRAINING WEEK PATTERNS:

Push / Pull / Legs (PPL) — best for 3-6 days/week:
- Day 1: PUSH — chest, shoulders, triceps
- Day 2: PULL — back, biceps
- Day 3: LEGS — quads, hamstrings, glutes
- Day 4: Rest or repeat
- Determine today's day from the last session in history.

Upper / Lower — best for 4 days/week:
- Day 1: Upper (chest + back focus)
- Day 2: Lower (quads + hamstrings + glutes)
- Day 3: Rest
- Day 4: Upper (shoulders + arms focus)
- Day 5: Lower (glutes + posterior chain focus)

Full Body — best for 2-3 days/week or beginners:
- Every session hits: chest, back, legs, shoulders, core
- Pick 1 exercise per group. Keep it efficient.
- Great for people with unpredictable schedules.

Bro Split — best for 5+ days/week, experienced lifters:
- Monday: Chest
- Tuesday: Back
- Wednesday: Shoulders
- Thursday: Arms (biceps + triceps)
- Friday: Legs
- Rotate based on history.

LOADING STRUCTURE ACROSS THE WEEK:

Light / Medium / Heavy pattern (applies to any split):
- First session of muscle group: HEAVY — push the weight, low reps
- Second session same week: LIGHT — same exercises, 60-70% of Monday's weight, higher reps
- Prevents accumulating too much fatigue while still training each muscle 2x/week.

HIGH / LOW INTENSITY ALTERNATION:
- Never schedule two high-intensity sessions back to back for the same muscle group.
- After a 5/5 energy session (heavy, high volume), next session for that muscle = light/moderate.
- Track this via history: if last session rating was 5 + heavy, go medium next time.

DELOAD WEEK STRUCTURE (every 4-6 weeks):
- Reduce all weights by 10-15%.
- Reduce total sets by 30% (e.g., 4 sets → 3 sets).
- Keep same exercises and rep ranges.
- Purpose: let the nervous system recover. Users often feel stronger the week after.
- When to trigger: rating ≤ 2 twice, or 4+ weeks of consistent heavy training, or user mentions feeling "flat" or "drained".

WEEKLY VOLUME TARGETS BY MUSCLE GROUP (sets per week):
- Chest: 10-20 sets/week optimal
- Back: 12-20 sets/week (back recovers faster, can handle more volume)
- Shoulders: 10-20 sets/week (already worked in chest/back day)
- Biceps: 8-14 sets/week
- Triceps: 8-14 sets/week
- Quads: 10-20 sets/week
- Hamstrings: 8-16 sets/week
- Glutes: 10-20 sets/week
- Core: 6-16 sets/week (can train more frequently, recovers fast)

Above 20 sets/week for any muscle = diminishing returns. Flag this in reasoning.

HOW TO APPLY WHEN GENERATING A WORKOUT:
1. Call calculate_weekly_volume() to see total sets per muscle this week.
2. If a muscle group is already near its weekly cap → avoid or reduce.
3. Check get_muscle_frequency_this_week() to see how many sessions a muscle has had.
4. Determine what "day" it is in the user's split from the last 2-3 sessions.
5. Name the workout after the day and focus, e.g. "Push Day — Chest Heavy", "Pull Day — Building That Pull-Up".
6. Mention the weekly context in reasoning: "You've already hit back twice this week, so I've kept this a lighter pull day to avoid overreaching."

SESSION SEQUENCING RULES:
- Compound movements FIRST (bench, squat, deadlift, row) — when the user is freshest.
- Isolation movements LAST (curls, laterals, cable work) — as finishers.
- Never put two exercises that heavily use the same joint consecutively (e.g. overhead press immediately before lateral raises — shoulder fatigue compounds).
- If doing push + pull supersets (for efficiency), pair antagonist muscles: chest + back, biceps + triceps.
