# GymAI — Sinas Agent Configuration
# Copy-paste each section directly into the Sinas dashboard.

---

## SECTION 1 — SYSTEM PROMPT
Paste this into the Sinas agent "System Prompt" field:

```
You are an elite AI personal trainer for GymAI. You receive a user's daily check-in and return a structured workout plan as ONLY valid JSON — no markdown, no explanation outside the JSON.

AVAILABLE EXERCISES (id | muscles | equipment | injuryRisk):
dumbbell_bench_press | chest,triceps,shoulders | dumbbell | shoulder,wrist
incline_dumbbell_press | chest,shoulders,triceps | dumbbell | shoulder
cable_fly | chest | cable machine | shoulder
push_up | chest,triceps,shoulders | bodyweight | wrist,shoulder
barbell_row | back,biceps | barbell | lower back
cable_row | back,biceps | cable machine | none
dumbbell_row | back,biceps | dumbbell | lower back
lat_pulldown | back,biceps | cable machine | shoulder
pull_up | back,biceps | bodyweight | shoulder,wrist
deadlift | back,glutes,legs | barbell | lower back,hip
romanian_deadlift | back,glutes,legs | barbell | lower back,hip
overhead_press | shoulders,triceps | barbell | shoulder,neck
dumbbell_shoulder_press | shoulders,triceps | dumbbell | shoulder
lateral_raise | shoulders | dumbbell | shoulder
cable_lateral_raise | shoulders | cable machine | shoulder
face_pull | shoulders,back | cable machine | none
barbell_curl | biceps | barbell | wrist,elbow
dumbbell_curl | biceps | dumbbell | wrist
cable_curl | biceps | cable machine | elbow
hammer_curl | biceps | dumbbell | wrist
tricep_pushdown | triceps | cable machine | elbow
overhead_tricep_extension | triceps | dumbbell | elbow,shoulder
skull_crusher | triceps | barbell | elbow,shoulder
dips | triceps,chest,shoulders | bodyweight | shoulder,wrist
barbell_squat | legs,glutes,core | barbell | knee,lower back,hip
leg_press | legs,glutes | leg press machine | knee,lower back
goblet_squat | legs,glutes,core | dumbbell | knee
split_squat | legs,glutes | dumbbell | knee,hip
leg_extension | legs | leg press machine | knee
leg_curl | legs | leg press machine | knee
calf_raise | legs | bodyweight | none
hip_thrust | glutes,legs | barbell | lower back,hip
glute_bridge | glutes,legs | bodyweight | lower back
cable_kickback | glutes | cable machine | hip
plank | core | bodyweight | lower back
cable_crunch | core | cable machine | lower back,neck
dead_bug | core | bodyweight | none

DURATION → EXERCISE COUNT (STRICT):
- 30 min: exactly 3 exercises, 2 sets each
- 45 min: exactly 3-4 exercises, 3 sets each
- 60 min: exactly 4-5 exercises, 3-4 sets each
- 90 min: exactly 5-6 exercises, 4 sets each

PROGRESSIVE SETS (IMPORTANT):
- Never give all sets at the same weight. Always build up.
- 2 sets example at 30kg: 27.5, 30
- 3 sets example at 30kg: 25, 27.5, 30
- 4 sets example at 80kg: 70, 75, 77.5, 80
- suggestedWeightKg is always the FINAL (heaviest) set.
- Increment: 2.5kg per step for weights under 60kg, 5kg for 60kg+

INTENSITY BY ENERGY LEVEL:
- 5: Heavy. 85-95% effort. 4-6 reps. Big compound movements first.
- 4: Moderate-heavy. 75-85%. 6-10 reps. Standard hypertrophy.
- 3: Moderate. 65-75%. 10-12 reps. Longer rest periods.
- 2: Light. 50-65%. 12-15 reps. Pump-focused, machines preferred.
- 1: Active recovery only. Bodyweight, core, stretching. Very light.

YESTERDAY'S ACTIVITY ADJUSTMENTS:
- rest: No restrictions. Normal session.
- running/cycling: Legs fatigued. Avoid heavy leg work. Focus upper body.
- football: Full body fatigue. Upper body focus only. Reduce intensity 20%.
- swimming: Upper body fatigued. Focus legs and core.
- yoga: Minimal fatigue. No restrictions.
- gym: Day 2 in a row. Reduce total volume 30%. Focus antagonist muscles.
- other: Reduce intensity 10% as precaution.

SORENESS RULES:
- Score 0-1: Fine to train that region.
- Score 2: Reduce sets by 50% for that region.
- Score 3: Skip that muscle group entirely.

INJURY SUBSTITUTIONS (MANDATORY):
- knee: NO squats, leg press, split squats, leg extension, leg curl. Replace with hip_thrust, glute_bridge, calf_raise, upper body.
- lower back: NO deadlift, barbell_row, romanian_deadlift, barbell_squat. Replace with cable_row, lat_pulldown, leg_press.
- shoulder: NO overhead_press, lateral_raise, pull_up, dips, incline_dumbbell_press. Replace with cable work, cable_row, bicep work.
- wrist: NO barbell_curl, push_up, skull_crusher, dips. Replace with cable or machine alternatives.
- hip: NO hip_thrust, split_squat, barbell_squat, deadlift. Replace with leg_press, leg_extension, leg_curl.
- neck: NO overhead_press, cable_crunch. Replace with seated or lying alternatives.
- elbow: NO barbell_curl, skull_crusher, tricep_pushdown, overhead_tricep_extension. Replace with dumbbell alternatives.
- ankle: NO calf_raise. Focus upper body.

RECOVERY FEEDBACK RULES:
- overworked: Reduce sets by 1 per exercise. Drop intensity 10%.
- easy: Increase suggestedWeightKg by 5%. Add 1 set to main compound.
- tough: Keep same weights. Focus on form.
- great: Maintain or slightly increase.

SESSION RATING RULES:
- Last rating 1-2: Shorter session, machine work, reduce intensity.
- Last rating 4-5: Maintain intensity, compound-heavy.

WEEKLY GOAL:
If weeklyGoal is set, include at least one exercise that builds toward it. Mention it in reasoning.
- "pull up" → lat_pulldown, pull_up, cable_row
- "bench" → dumbbell_bench_press, cable_fly, tricep_pushdown
- "squat" → barbell_squat, goblet_squat, leg_press
- "deadlift" → romanian_deadlift, deadlift, glute_bridge
- "overhead" → dumbbell_shoulder_press, face_pull, lateral_raise

LAST KNOWN WEIGHTS:
The message includes a "LAST KNOWN WEIGHTS" block. Always use these for lastWeightKg. Use as base for suggestedWeightKg, then apply overload or deload rules.

PROGRESSIVE OVERLOAD:
- Same exercise 3+ sessions at same weight → suggest +2.5kg, note in reasoning.
- Never train same muscle group within 48 hours.

FAVOURITE SPLITS:
- push_pull_legs: Push = chest/shoulders/triceps. Pull = back/biceps. Legs = legs/glutes. Determine today's day from history.
- upper_lower: Alternate upper and lower based on last session.
- full_body: Hit all muscle groups, 1-2 exercises each.
- bro_split: One muscle group per day. Rotate: chest → back → shoulders → arms → legs.
- no_preference: AI chooses based on history and recovery.

WORKOUT NAMING: Creative and descriptive. Examples: "Push Day — Chest Heavy", "Leg Day — Volume Focus", "Full Body Recovery Flow".

REASONING: 2-3 sentences. Mention energy level, injury/activity adjustments, weekly goal if set. Be motivating.

Return ONLY this JSON:
{
  "workoutName": "string",
  "reasoning": "string",
  "exercises": [
    {
      "exerciseId": "exact_id_from_list",
      "sets": number,
      "reps": number,
      "suggestedWeightKg": number,
      "lastWeightKg": number or null,
      "substituteReason": "string (only if substituted)"
    }
  ]
}
```

---

## SECTION 2 — PYTHON FUNCTIONS
Paste each function into the Sinas "Functions" editor (Python only).

---

### FUNCTION 1: get_last_weights
**Purpose:** Extracts the most recent weight per exercise from workout history. Always call this first — used to populate lastWeightKg and base for suggestedWeightKg.

```python
def get_last_weights(history: list) -> dict:
    """
    Args:
        history: list of workout summary dicts with keys:
                 date (str ISO), exercises (list of {exerciseId, maxWeightKg, totalSets, avgReps})
    Returns:
        dict mapping exerciseId -> lastWeightKg (most recent non-zero weight)
    """
    last_weight_map = {}

    # Sort newest first
    sorted_history = sorted(history, key=lambda w: w.get("date", ""), reverse=True)

    for workout in sorted_history:
        for ex in workout.get("exercises", []):
            ex_id = ex.get("exerciseId", "")
            weight = ex.get("maxWeightKg", 0)
            if ex_id and ex_id not in last_weight_map and weight > 0:
                last_weight_map[ex_id] = weight

    return last_weight_map
```

---

### FUNCTION 2: detect_plateaus
**Purpose:** Finds exercises where the user has been stuck at the same weight for 3+ sessions. Call this before generating a workout so the AI knows where to push harder.

```python
def detect_plateaus(history: list) -> list:
    """
    Args:
        history: list of workout summary dicts
    Returns:
        list of dicts: [{exerciseId, currentWeightKg, suggestion}]
    """
    from collections import defaultdict

    # Sort oldest first to get chronological order
    sorted_history = sorted(history, key=lambda w: w.get("date", ""))

    by_exercise = defaultdict(list)
    for workout in sorted_history:
        for ex in workout.get("exercises", []):
            ex_id = ex.get("exerciseId", "")
            weight = ex.get("maxWeightKg", 0)
            if ex_id and weight > 0:
                by_exercise[ex_id].append(weight)

    plateaus = []
    for ex_id, weights in by_exercise.items():
        if len(weights) < 3:
            continue
        last_3 = weights[-3:]
        if all(w == last_3[0] for w in last_3):
            plateaus.append({
                "exerciseId": ex_id,
                "currentWeightKg": last_3[0],
                "suggestion": f"Increase to {last_3[0] + 2.5}kg — stuck for 3+ sessions"
            })

    return plateaus
```

---

### FUNCTION 3: calculate_suggested_weight
**Purpose:** Given last weight, goal, and energy, returns the optimal weight and reps for today's session.

```python
def calculate_suggested_weight(
    last_weight_kg: float,
    goal: str,
    energy_level: int,
    is_plateaued: bool = False,
    recovery_feedback: str = None
) -> dict:
    """
    Args:
        last_weight_kg: most recent working weight
        goal: 'strength' | 'hypertrophy' | 'endurance'
        energy_level: 1-5
        is_plateaued: whether stuck at same weight 3+ sessions
        recovery_feedback: 'great' | 'tough' | 'overworked' | 'easy' | None
    Returns:
        dict: {suggestedWeightKg, suggestedReps, reason}
    """
    if not last_weight_kg or last_weight_kg == 0:
        return {"suggestedWeightKg": None, "suggestedReps": None, "reason": "No previous data"}

    # Base reps by goal
    reps_by_goal = {
        "strength": max(4, 6 - (5 - energy_level)),
        "hypertrophy": max(8, 12 - (5 - energy_level) * 2),
        "endurance": max(12, 15 - (5 - energy_level))
    }
    reps = reps_by_goal.get(goal, 10)

    # Base weight multiplier by goal and energy
    multipliers = {
        "strength": 0.85 + energy_level * 0.025,
        "hypertrophy": 0.70 + energy_level * 0.04,
        "endurance": 0.55 + energy_level * 0.03
    }
    multiplier = multipliers.get(goal, 0.75)

    # Clamp for low energy
    if energy_level <= 2:
        multiplier = min(multiplier, 0.65)

    # Plateau = bump up
    if is_plateaued:
        suggested = last_weight_kg + 2.5
        reason = f"Progressive overload: +2.5kg from {last_weight_kg}kg — stuck 3+ sessions"
    else:
        raw = last_weight_kg * multiplier
        suggested = round(raw / 2.5) * 2.5  # Round to nearest 2.5kg
        reason = f"{round(multiplier * 100)}% of last weight ({last_weight_kg}kg), energy {energy_level}/5"

    # Recovery feedback adjustments
    if recovery_feedback == "overworked":
        suggested = max(0, suggested - 2.5)
        reason += " — reduced due to overworked feedback"
    elif recovery_feedback == "easy":
        suggested = suggested + 2.5
        reps = max(reps - 1, 3)
        reason += " — increased due to easy feedback"

    return {
        "suggestedWeightKg": max(0, suggested),
        "suggestedReps": reps,
        "reason": reason
    }
```

---

### FUNCTION 4: check_muscle_recovery
**Purpose:** Checks if a muscle group is recovered and ready to train based on time since last session, soreness, and feedback.

```python
def check_muscle_recovery(
    muscle_group: str,
    last_session_date: str,
    soreness_score: int,
    recovery_feedback: str = None
) -> dict:
    """
    Args:
        muscle_group: e.g. 'chest', 'back', 'legs'
        last_session_date: ISO date string or None
        soreness_score: 0-3
        recovery_feedback: 'great' | 'tough' | 'overworked' | 'easy' | None
    Returns:
        dict: {ready: bool, hoursUntilReady: int, reason: str}
    """
    from datetime import datetime

    if not last_session_date:
        return {"ready": True, "hoursUntilReady": 0, "reason": "No recent training data"}

    try:
        last_dt = datetime.fromisoformat(last_session_date.replace("Z", "+00:00"))
        hours_since = (datetime.now(last_dt.tzinfo) - last_dt).total_seconds() / 3600
    except Exception:
        return {"ready": True, "hoursUntilReady": 0, "reason": "Could not parse date"}

    required_hours = 48  # standard recovery baseline

    # Adjust for recovery feedback
    feedback_adjustments = {
        "overworked": 72,
        "tough": 56,
        "easy": 36,
        "great": 42
    }
    if recovery_feedback in feedback_adjustments:
        required_hours = max(required_hours, feedback_adjustments[recovery_feedback])

    # Adjust for soreness
    if soreness_score == 3:
        required_hours = max(required_hours, 72)
    elif soreness_score == 2:
        required_hours = max(required_hours, 56)

    ready = hours_since >= required_hours and soreness_score < 3
    hours_until_ready = max(0, int(required_hours - hours_since)) if not ready else 0

    if ready:
        reason = f"{int(hours_since)}h since last {muscle_group} session — fully recovered"
    else:
        reason = f"Only {int(hours_since)}h since last {muscle_group} session, needs {hours_until_ready}h more"

    return {"ready": ready, "hoursUntilReady": hours_until_ready, "reason": reason}
```

---

### FUNCTION 5: filter_exercises_by_injury
**Purpose:** Returns which exercises to exclude and which are safe, given a list of injuries. Call this before selecting any exercises for the workout.

```python
def filter_exercises_by_injury(injuries: list) -> dict:
    """
    Args:
        injuries: list of injury strings e.g. ['knee', 'shoulder']
    Returns:
        dict: {excluded: list, allowed: list, rules: list}
    """
    INJURY_EXCLUSIONS = {
        "knee": ["barbell_squat", "goblet_squat", "split_squat", "leg_extension", "leg_curl", "leg_press"],
        "lower back": ["deadlift", "romanian_deadlift", "barbell_row", "barbell_squat", "cable_crunch", "plank"],
        "shoulder": ["overhead_press", "dumbbell_shoulder_press", "lateral_raise", "cable_lateral_raise", "pull_up", "dips", "incline_dumbbell_press"],
        "wrist": ["barbell_curl", "push_up", "skull_crusher", "dips"],
        "hip": ["hip_thrust", "split_squat", "barbell_squat", "deadlift", "romanian_deadlift"],
        "neck": ["overhead_press", "cable_crunch"],
        "elbow": ["barbell_curl", "skull_crusher", "tricep_pushdown", "cable_curl", "overhead_tricep_extension"],
        "ankle": ["calf_raise"],
    }

    ALL_EXERCISES = [
        "dumbbell_bench_press", "incline_dumbbell_press", "cable_fly", "push_up",
        "barbell_row", "cable_row", "dumbbell_row", "lat_pulldown", "pull_up",
        "deadlift", "romanian_deadlift", "overhead_press", "dumbbell_shoulder_press",
        "lateral_raise", "cable_lateral_raise", "face_pull", "barbell_curl",
        "dumbbell_curl", "cable_curl", "hammer_curl", "tricep_pushdown",
        "overhead_tricep_extension", "skull_crusher", "dips", "barbell_squat",
        "leg_press", "goblet_squat", "split_squat", "leg_extension", "leg_curl",
        "calf_raise", "hip_thrust", "glute_bridge", "cable_kickback",
        "plank", "cable_crunch", "dead_bug",
    ]

    excluded = set()
    rules = []

    for injury in (injuries or []):
        key = injury.lower().strip()
        to_exclude = INJURY_EXCLUSIONS.get(key, [])
        excluded.update(to_exclude)
        if to_exclude:
            rules.append(f"{injury}: excluding {', '.join(to_exclude)}")

    return {
        "excluded": list(excluded),
        "allowed": [e for e in ALL_EXERCISES if e not in excluded],
        "rules": rules
    }
```

---

### FUNCTION 6: estimate_1rm
**Purpose:** Estimates 1-rep max using the Epley formula. Use to gauge true strength and scale training weights.

```python
def estimate_1rm(weight_kg: float, reps: int) -> dict:
    """
    Args:
        weight_kg: working set weight
        reps: reps performed
    Returns:
        dict: {estimated1rmKg, strength95pct, hypertrophy75pct, endurance60pct}
    """
    if reps == 1:
        one_rm = weight_kg
    else:
        one_rm = weight_kg * (1 + reps / 30)

    # Round to nearest 2.5
    one_rm = round(one_rm / 2.5) * 2.5

    return {
        "estimated1rmKg": one_rm,
        "strength95pct": round((one_rm * 0.95) / 2.5) * 2.5,   # heavy strength work
        "hypertrophy75pct": round((one_rm * 0.75) / 2.5) * 2.5, # hypertrophy range
        "endurance60pct": round((one_rm * 0.60) / 2.5) * 2.5    # endurance/pump
    }
```

---

### FUNCTION 7: get_goal_exercises
**Purpose:** Maps a user's plain-text weekly goal (e.g. "do a pull up") to relevant exercise IDs and returns a training tip.

```python
def get_goal_exercises(weekly_goal: str) -> dict:
    """
    Args:
        weekly_goal: free text e.g. 'do a pull up', 'bench 100kg', 'run 5k'
    Returns:
        dict: {exercises: list[str], tip: str}
    """
    if not weekly_goal:
        return {"exercises": [], "tip": ""}

    goal = weekly_goal.lower()

    GOAL_MAP = [
        {
            "keywords": ["pull up", "pull-up", "chin up", "chinup"],
            "exercises": ["lat_pulldown", "cable_row", "dumbbell_row", "pull_up"],
            "tip": "Lat pulldowns and rows build the exact back strength needed for pull-ups. Aim to lat pulldown your bodyweight first."
        },
        {
            "keywords": ["bench", "chest press"],
            "exercises": ["dumbbell_bench_press", "cable_fly", "tricep_pushdown", "dips"],
            "tip": "Bench variations and tricep accessories build pressing strength. Log your dumbbell bench and aim to progress every session."
        },
        {
            "keywords": ["squat", "100kg squat"],
            "exercises": ["barbell_squat", "goblet_squat", "leg_press", "split_squat"],
            "tip": "Consistent squat practice with progressive overload gets you there. Goblet squats build form, barbell squats build strength."
        },
        {
            "keywords": ["deadlift"],
            "exercises": ["romanian_deadlift", "deadlift", "barbell_row", "glute_bridge"],
            "tip": "Romanian deadlifts build hamstring and hip hinge strength that transfers directly to conventional deadlifts."
        },
        {
            "keywords": ["overhead", "shoulder press", "ohp"],
            "exercises": ["dumbbell_shoulder_press", "lateral_raise", "face_pull"],
            "tip": "Shoulder pressing and face pulls build overhead strength while keeping the shoulder joint healthy."
        },
        {
            "keywords": ["run", "5k", "10k", "cardio", "endurance"],
            "exercises": ["leg_press", "calf_raise", "dead_bug", "plank"],
            "tip": "Strong legs and core stability directly improve running economy and reduce injury risk."
        },
        {
            "keywords": ["glute", "bum", "booty", "hip thrust"],
            "exercises": ["hip_thrust", "glute_bridge", "cable_kickback", "split_squat"],
            "tip": "Hip thrusts are the single most effective glute exercise — prioritise them and add load consistently."
        },
        {
            "keywords": ["abs", "core", "six pack"],
            "exercises": ["plank", "dead_bug", "cable_crunch"],
            "tip": "Core exercises done 3x per week alongside a good diet will reveal your abs. Consistency beats intensity here."
        },
    ]

    for entry in GOAL_MAP:
        if any(kw in goal for kw in entry["keywords"]):
            return {"exercises": entry["exercises"], "tip": entry["tip"]}

    return {"exercises": [], "tip": f"Training toward: {weekly_goal}"}
```

---

### FUNCTION 8: build_progressive_sets
**Purpose:** Builds ascending-weight sets instead of flat weights. Use this when constructing the final workout output.

```python
def build_progressive_sets(target_weight_kg: float, num_sets: int, reps: int) -> list:
    """
    Args:
        target_weight_kg: the final (heaviest) working set weight
        num_sets: total number of sets
        reps: reps per set
    Returns:
        list of {weightKg, reps} dicts — ascending weights
    Example:
        build_progressive_sets(30, 3, 10) → [{25, 10}, {27.5, 10}, {30, 10}]
        build_progressive_sets(80, 4, 6)  → [{70, 6}, {75, 6}, {77.5, 6}, {80, 6}]
    """
    if not target_weight_kg or target_weight_kg == 0:
        return [{"weightKg": 0, "reps": reps} for _ in range(num_sets)]

    # Increment per step: smaller for light, larger for heavy
    increment = 5.0 if target_weight_kg >= 60 else 2.5

    sets = []
    for i in range(num_sets):
        steps_from_end = num_sets - 1 - i
        raw_weight = target_weight_kg - (steps_from_end * increment)
        # Round to nearest 2.5
        weight = round(max(0, raw_weight) / 2.5) * 2.5
        sets.append({"weightKg": weight, "reps": reps})

    return sets
```

---

## SECTION 3 — SQL QUERY TEMPLATES
If your Sinas instance is connected to a database, paste these into the SQL Query editor.

---

### get_user_recent_workouts
```sql
SELECT
  w.id, w.date, w.name, w.user_goal, w.rating, w.recovery_feedback, w.injuries,
  json_agg(json_build_object(
    'exerciseId', we.exercise_id,
    'maxWeightKg', we.max_weight_kg,
    'totalSets', we.total_sets,
    'avgReps', we.avg_reps
  )) AS exercises
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
WHERE w.user_id = :userId AND w.completed = true
GROUP BY w.id
ORDER BY w.date DESC
LIMIT 10;
```

### get_plateau_exercises
```sql
WITH ranked AS (
  SELECT exercise_id, max_weight_kg, w.date,
         ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY w.date DESC) AS rn
  FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE w.user_id = :userId AND w.completed = true
),
last3 AS (SELECT exercise_id, max_weight_kg FROM ranked WHERE rn <= 3)
SELECT exercise_id, MAX(max_weight_kg) AS weight_kg
FROM last3
GROUP BY exercise_id
HAVING COUNT(DISTINCT max_weight_kg) = 1 AND COUNT(*) = 3;
```

### get_weekly_summary
```sql
SELECT
  DATE_TRUNC('week', w.date) AS week_start,
  COUNT(DISTINCT w.id) AS sessions,
  SUM(we.total_sets) AS total_sets,
  AVG(w.rating) AS avg_rating,
  MODE() WITHIN GROUP (ORDER BY w.recovery_feedback) AS most_common_feeling
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
WHERE w.user_id = :userId AND w.completed = true
  AND w.date >= NOW() - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', w.date)
ORDER BY week_start DESC;
```

---

## SECTION 4 — DASHBOARD SETTINGS

| Setting | Value |
|---|---|
| Model | claude-sonnet (latest) |
| Max tokens | 2000 |
| Temperature | 0.3 |
| Response format | JSON only |
| System prompt | Section 1 above |
| Functions | All 8 from Section 2 (Python) |
| Workout chat ID | Separate session from substitute chat |
| Substitute chat ID | Separate session from workout chat |
