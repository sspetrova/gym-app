# GymAI — The 4 Must-Have Python Functions
# Both Input and Output are JSON Schema format (as required by Sinas).

---

## 1. get_last_weights

```python
def get_last_weights(history: list) -> dict:
    last_weight_map = {}
    sorted_history = sorted(history, key=lambda w: w.get("date", ""), reverse=True)
    for workout in sorted_history:
        for ex in workout.get("exercises", []):
            ex_id = ex.get("exerciseId", "")
            weight = ex.get("maxWeightKg", 0)
            if ex_id and ex_id not in last_weight_map and weight > 0:
                last_weight_map[ex_id] = weight
    return last_weight_map
```

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "history": {
      "type": "array",
      "description": "List of past workout summaries",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "description": "ISO date string e.g. 2025-01-10T10:00:00Z" },
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "exerciseId": { "type": "string" },
                "maxWeightKg": { "type": "number" }
              },
              "required": ["exerciseId", "maxWeightKg"]
            }
          }
        },
        "required": ["date", "exercises"]
      }
    }
  },
  "required": ["history"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "JSON string of { exerciseId: lastWeightKg } — e.g. {\"barbell_bench_press\": 80, \"lat_pulldown\": 60}"
    }
  },
  "required": ["result"]
}
```

---

## 2. detect_plateaus

```python
def detect_plateaus(history: list) -> list:
    from collections import defaultdict
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

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "history": {
      "type": "array",
      "description": "List of past workout summaries",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "description": "ISO date string" },
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "exerciseId": { "type": "string" },
                "maxWeightKg": { "type": "number" }
              },
              "required": ["exerciseId", "maxWeightKg"]
            }
          }
        },
        "required": ["date", "exercises"]
      }
    }
  },
  "required": ["history"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "JSON string of [{exerciseId: string, currentWeightKg: number, suggestion: string}] — e.g. [{\"exerciseId\": \"lat_pulldown\", \"currentWeightKg\": 60, \"suggestion\": \"Increase to 62.5kg — stuck for 3+ sessions\"}]"
    }
  },
  "required": ["result"]
}
```

---

## 3. filter_exercises_by_injury

```python
def filter_exercises_by_injury(injuries: list, exercise_definitions: list) -> dict:
    excluded = set()
    rules = []
    for injury in (injuries or []):
        key = injury.lower().strip()
        to_exclude = [
            e["id"] for e in exercise_definitions
            if key in [r.lower() for r in e.get("injuryRisk", [])]
        ]
        excluded.update(to_exclude)
        if to_exclude:
            rules.append(f"{injury}: excluding {', '.join(to_exclude)}")
    all_ids = [e["id"] for e in exercise_definitions]
    return {
        "excluded": list(excluded),
        "allowed": [ex_id for ex_id in all_ids if ex_id not in excluded],
        "rules": rules
    }
```

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "injuries": {
      "type": "array",
      "description": "List of injury strings e.g. shoulder, knee, wrist",
      "items": { "type": "string" }
    },
    "exercise_definitions": {
      "type": "array",
      "description": "Full exercise library",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "muscleGroups": { "type": "array", "items": { "type": "string" } },
          "injuryRisk": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["id", "injuryRisk"]
      }
    }
  },
  "required": ["injuries", "exercise_definitions"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "JSON string of {excluded: string[], allowed: string[], rules: string[]} — e.g. {\"excluded\": [\"overhead_press\"], \"allowed\": [\"cable_row\"], \"rules\": [\"shoulder: excluding overhead_press\"]}"
    }
  },
  "required": ["result"]
}
```

---

## 4. calculate_suggested_weight

```python
def calculate_suggested_weight(
    last_weight_kg: float,
    goal: str,
    energy_level: int,
    is_plateaued: bool = False,
    recovery_feedback: str = None
) -> dict:
    if not last_weight_kg or last_weight_kg == 0:
        return {"suggestedWeightKg": None, "suggestedReps": None, "reason": "No previous data"}
    reps_by_goal = {
        "strength": max(4, 6 - (5 - energy_level)),
        "hypertrophy": max(8, 12 - (5 - energy_level) * 2),
        "endurance": max(12, 15 - (5 - energy_level))
    }
    reps = reps_by_goal.get(goal, 10)
    suggested = last_weight_kg
    reason = f"Matching last weight ({last_weight_kg}kg)"
    if is_plateaued:
        suggested = last_weight_kg + 2.5
        reason = f"Progressive overload: +2.5kg from {last_weight_kg}kg — stuck 3+ sessions"
    if energy_level == 1:
        suggested = max(0, last_weight_kg - 10)
        reason = f"Active recovery: -10kg from last ({last_weight_kg}kg), energy 1/5"
    elif energy_level == 2:
        suggested = max(0, last_weight_kg - 5)
        reason = f"Low energy: -5kg from last ({last_weight_kg}kg), energy 2/5"
    elif energy_level == 5 and not is_plateaued:
        suggested = last_weight_kg + 2.5
        reason = f"High energy: +2.5kg from last ({last_weight_kg}kg), energy 5/5"
    suggested = round(suggested / 2.5) * 2.5
    if recovery_feedback == "overworked":
        suggested = max(0, suggested - 2.5)
        reason += " — reduced: overworked last session"
    elif recovery_feedback == "easy":
        suggested += 2.5
        reps = max(reps - 1, 3)
        reason += " — increased: felt easy last session"
    return {
        "suggestedWeightKg": max(0, suggested),
        "suggestedReps": reps,
        "reason": reason
    }
```

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "last_weight_kg": { "type": "number", "description": "Most recent working weight in kg" },
    "goal": { "type": "string", "description": "strength | hypertrophy | endurance" },
    "energy_level": { "type": "integer", "description": "1-5 scale from user check-in" },
    "is_plateaued": { "type": "boolean", "description": "True if stuck at same weight 3+ sessions" },
    "recovery_feedback": { "type": "string", "description": "great | tough | overworked | easy | null" }
  },
  "required": ["last_weight_kg", "goal", "energy_level"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "JSON string of {suggestedWeightKg: number, suggestedReps: number, reason: string} — e.g. {\"suggestedWeightKg\": 65, \"suggestedReps\": 12, \"reason\": \"Low energy: -5kg from last (70kg), energy 2/5\"}"
    }
  },
  "required": ["result"]
}
```
