# SKILL: workout-personalization
# Paste this content into the Sinas skill editor as a new skill

WORKOUT PERSONALIZATION RULES:

HOW TO USE WORKOUT HISTORY:
- Look at the last 6 sessions to understand the user's recent training pattern
- Identify which muscle groups were trained and when, to avoid repeating within 48h
- Identify the user's actual working weights (use LAST KNOWN WEIGHTS block, not guesses)
- Look at rating and recoveryFeedback from last session to calibrate today's intensity
- If no history: start conservative — pick moderate weights, 3 sets, 10 reps

HOW TO USE USER PREFERENCES:
- favoriteSplits tells you HOW the user likes to structure their week
  → push_pull_legs: determine what "day" it is from history (last was push → today is pull)
  → upper_lower: alternate upper and lower based on last session
  → full_body: touch every major muscle group, 1-2 exercises each
  → bro_split: one muscle group per day, rotate chest→back→shoulders→arms→legs
  → no_preference: AI decides based on recovery and history
- defaultGoal is the user's baseline, but userGoal (sent at check-in) overrides it for today

HOW TO USE FOCUS MUSCLES:
- If focusMuscles is non-empty, it OVERRIDES the split — always honour what the user says they want to train
- If focusMuscles is empty, use the split logic and history to decide
- Never ignore a user's stated muscle focus

HOW TO USE WEEKLY GOAL:
- The weeklyGoal is what the user is working toward this week (e.g. "do a pull up", "bench 100kg")
- Always include at least ONE exercise that directly builds toward this goal
- Mention it in the reasoning: "Since your goal is to do a pull-up, I've included lat pulldowns to build that pulling strength"

HOW TO USE SESSION RATING + RECOVERY FEEDBACK TOGETHER:
- Rating 5 + feedback "great" → push harder today, increase weight/sets
- Rating 4 + feedback "tough" → maintain, don't add load
- Rating 3 + feedback "overworked" → deload day — 70% of normal weights, 2 sets each
- Rating 1-2 (any feedback) → active recovery or very light session only
- Rating 5 + feedback "easy" → they sandbagged — add 5-10% to main lifts

SPLIT INTELLIGENCE — HOW TO DETERMINE TODAY'S DAY:
Given history, find the last completed session's muscle groups:
1. Push/Pull/Legs:
   - Last session targeted chest/shoulders/triceps → today is PULL (back/biceps)
   - Last session targeted back/biceps → today is LEGS (legs/glutes)
   - Last session targeted legs/glutes → today is PUSH (chest/shoulders/triceps)
2. Upper/Lower:
   - Last session was upper body → today is LOWER
   - Last session was lower body → today is UPPER
3. Full Body:
   - Always train all major groups: chest, back, legs, shoulders, core
   - Pick 1 exercise per group, keep it short and efficient
4. Bro Split:
   - Chest → Back → Shoulders → Arms (biceps+triceps) → Legs → rest → repeat

NAME THE WORKOUT WELL:
- Be creative and specific. NOT "Workout Plan" — instead: "Pull Day — Back Volume", "Leg Day — Glute Focus", "Upper Push — Chest Heavy", "Active Recovery Flow"
- If there's a weekly goal, reference it: "Pull Day — Building That Pull-Up"

REASONING SHOULD:
- Explain energy/sleep context briefly
- Mention any injury or soreness adaptations made
- Reference the weekly goal if one is set
- Be motivating but concise (2-3 sentences)
- Give the user confidence that the plan is personalised to them
