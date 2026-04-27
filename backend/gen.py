import pandas as pd
import random

rows = []

job_roles = ["Mason", "Electrician", "Supervisor", "Engineer"]
education_levels = ["None", "HighSchool", "Diploma", "Degree"]
site_types = ["Residential", "Commercial", "Infrastructure"]
city_tiers = ["Tier1", "Tier2", "Tier3"]
weather_conditions = ["Normal", "Rainy", "Extreme"]

for i in range(1000):
    gender = random.choice(["Male", "Female"])
    education = random.choice(education_levels)
    experience = random.randint(0, 20)
    skill = random.randint(40, 95)
    attendance = round(random.uniform(0.6, 1.0), 2)
    accidents = random.randint(0, 3)
    city = random.choice(city_tiers)

    # Base productivity
    productivity = (
        0.4 * skill +
        0.3 * experience +
        20 * attendance
    )

    # 🔴 Injected Bias
    if gender == "Male":
        productivity += 5
    else:
        productivity -= 3

    if education == "Degree":
        productivity += 7

    if city == "Tier1":
        productivity += 4
    elif city == "Tier3":
        productivity -= 4

    # Over-penalizing accidents (biased)
    productivity -= accidents * 6

    rows.append([
        i + 1,
        random.randint(18, 60),
        gender,
        education,
        experience,
        random.choice(job_roles),
        skill,
        random.randint(400, 1500),
        random.randint(6, 10),
        random.choice(site_types),
        city,
        random.choice(["Yes", "No"]),
        accidents,
        attendance,
        round(random.uniform(2.5, 5.0), 1),
        random.randint(10, 120),
        random.choice(weather_conditions),
        round(productivity, 2)
    ])

df = pd.DataFrame(rows, columns=[
    "worker_id", "age", "gender", "education_level",
    "experience_years", "job_role", "skill_score",
    "daily_wage", "work_hours", "site_type",
    "city_tier", "safety_training", "accident_history",
    "attendance_rate", "contractor_rating",
    "project_deadline_days", "weather_condition",
    "productivity_score"
])

df.to_csv("construction_biased_dataset.csv", index=False)