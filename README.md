<div align="center">

<br/>

```
███████╗ ██████╗ ██╗   ██╗██╗██╗     ███████╗███╗   ██╗███████╗
██╔════╝██╔═══██╗██║   ██║██║██║     ██╔════╝████╗  ██║██╔════╝
█████╗  ██║   ██║██║   ██║██║██║     █████╗  ██╔██╗ ██║███████╗
██╔══╝  ██║▄▄ ██║██║   ██║██║██║     ██╔══╝  ██║╚██╗██║╚════██║
███████╗╚██████╔╝╚██████╔╝██║███████╗███████╗██║ ╚████║███████║
╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
```

### **AI-Powered HR Bias Detection & Mitigation Platform**
*Because fair hiring shouldn't be a privilege — it should be the default.*

<br/>

[![Google Solution Challenge](https://img.shields.io/badge/Google_Solution_Challenge-2026-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/community/gdsc-solution-challenge)
[![Top 100](https://img.shields.io/badge/Top_100-Selected_Teams-34A853?style=for-the-badge&logo=trophy&logoColor=white)](#)
[![Vertex AI](https://img.shields.io/badge/Powered_by-Vertex_AI-FF6D00?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![License](https://img.shields.io/badge/License-MIT-EA4335?style=for-the-badge)](LICENSE)

<br/>

---

## 🎬 &nbsp; See It In Action

<br/>

> **[▶ &nbsp; Watch Full Demo Video](https://equilens.devarghya.in/demoVideo.mp4)**

<br/>

> **[📦 &nbsp; Download Test Dataset for Judges](https://github.com/Arghya-2007/solution-challenge/tree/main/processing-server/data)**
> *(Real biased HR hiring data — 3,500 rows — with injected bias across gender, age, and group identity)*

<br/>

---

</div>

<br/>

## 🧨 &nbsp; The Problem

<br/>

HR teams at companies of every size are making hiring, promotion, and compensation decisions using datasets that carry **decades of human bias baked in.** They don't know it. Their models learn it. Their decisions replicate it. Every quarter.

<br/>

```
A female candidate with the same qualifications as a male candidate
is statistically hired at 47% the rate in biased datasets.

That's not a data problem. That's a people problem hiding inside a CSV.
```

<br/>

| The Reality | The Scale |
|---|---|
| 📊 73% of Fortune 500 companies use algorithmic screening | Most with zero bias auditing |
| ⚖️ EEOC receives 90,000+ discrimination charges per year | Majority linked to hiring & compensation |
| 💸 Workplace discrimination costs US companies $64B annually | In turnover, litigation, and reputation |
| 🤖 AI hiring tools have been found to discriminate at scale | Amazon scrapped theirs after 5 years |

<br/>

**HR managers are not data scientists.** They cannot audit a Random Forest model. They have no tool to ask: *"Is my data treating everyone fairly?"* — until now.

<br/>

---

## 💡 &nbsp; What EquiLens Does

<br/>

EquiLens is an end-to-end **HR bias detection and mitigation platform**. You upload your HR dataset. We tell you exactly where bias lives, how severe it is, what the legal risk is, and we give you a fixed dataset where the bias has been algorithmically corrected.

<br/>

```
                     ┌─────────────────────────────────────────────┐
                     │                                             │
   Upload CSV  ──►   │   Statistical    ──►   Vertex AI   ──►     │  ──►  Risk Score
                     │   Pre-Processing       Gemini 1.5           │       + Report
                     │   Engine               Pro Analysis         │       + Fixed CSV
                     │                                             │
                     └─────────────────────────────────────────────┘
```

<br/>

### What You Get Back

<br/>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ● Overall Bias Risk Score  (0–100)                                        │
│   ● Per-Attribute Analysis   gender · age · race · group identity           │
│   ● Adverse Impact Ratio     EEOC 80% Rule compliance check                 │
│   ● Intersectionality Matrix minority female vs majority male breakdown      │
│   ● Missingness Disparity    unequal missing data across demographic groups  │
│   ● Fix Simulations          before/after score if a column is removed      │
│   ● Mitigated Dataset        downloadable CSV with bias corrected decisions  │
│   ● PDF Compliance Report    printable — ready for legal or board review     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

<br/>

---

## 🏗️ &nbsp; Architecture

<br/>

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              EQUILENS PLATFORM                                   │
│                                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────────────────┐  │
│  │              │    │                  │    │                                │  │
│  │   FRONTEND   │    │   NESTJS API     │    │    PYTHON ANALYSIS ENGINE      │  │
│  │              │    │   GATEWAY        │    │                                │  │
│  │  React/Vite  │◄──►│                  │◄──►│  ┌──────────────────────────┐ │  │
│  │              │    │  Firebase Auth   │    │  │  Statistical Pre-Processor│ │  │
│  │  Firebase    │    │  JWT Validation  │    │  │  pandas · scipy · aif360  │ │  │
│  │  Hosting     │    │  Signed URL Gen  │    │  └──────────────┬───────────┘ │  │
│  │              │    │  Job Dispatch    │    │                 │             │  │
│  └──────────────┘    │  Status Polling  │    │  ┌─────────────▼───────────┐ │  │
│                      │                  │    │  │   Vertex AI Gemini 1.5  │ │  │
│                      └─────────┬────────┘    │  │   Structured Analysis   │ │  │
│                                │             │  └─────────────┬───────────┘ │  │
│                      ┌─────────▼────────┐    │                 │             │  │
│                      │                  │    │  ┌─────────────▼───────────┐ │  │
│                      │   FIRESTORE      │◄──►│  │   Random Forest Model   │ │  │
│                      │   Job Status     │    │  │   Bias Mitigation Engine│ │  │
│                      │   Results Store  │    │  └─────────────────────────┘ │  │
│                      │   Org History    │    │                                │  │
│                      └──────────────────┘    └────────────────────────────────┘  │
│                                                                                  │
│                      ┌──────────────────────────────────────────────────────┐   │
│                      │  CLOUD STORAGE                                        │   │
│                      │  equilens-uploads  ·  equilens-reports  ·  demo-data  │   │
│                      └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

<br/>

---

## ⚙️ &nbsp; How It Works

<br/>

### Step 1 — Upload
HR analyst uploads a CSV dataset (hiring records, compensation data, promotion history). The frontend gets a 30-minute signed URL from our NestJS gateway and uploads directly to **Google Cloud Storage** — your data never passes through an insecure middleman.

<br/>

### Step 2 — Statistical Pre-Processing
Before touching the AI model, our Python engine runs a full statistical battery:

- **Adverse Impact Ratio** — EEOC 80% Rule calculation per protected attribute
- **Chi-Square Tests** — statistical significance of outcome disparities across groups
- **Proxy Detection** — Pearson correlation to find columns that *act like* protected attributes (zip code → race, university tier → socioeconomic class)
- **Intersectionality Matrix** — compound disadvantage across multiple identities (e.g. Minority Female vs Majority Male)
- **Missingness Disparity** — whether missing data is unevenly distributed across demographic groups

<br/>

### Step 3 — Vertex AI Analysis
The statistical summary (not the raw data) is sent to **Gemini 1.5 Pro via Vertex AI** with a structured output schema. The model returns:
- Plain-English explanation of each finding in compliance officer language
- Legal framework mapping (EEOC, EU AI Act, Equal Pay Act)
- Specific, actionable recommendation per finding

<br/>

### Step 4 — Mitigation
A **Random Forest classifier** is retrained with fairness constraints using `fairlearn` and `aif360`. The mitigated dataset is generated with corrected hiring decisions — preserving overall hire rates while eliminating statistically significant group disparities.

<br/>

### Step 5 — Results
Risk score dashboard, findings breakdown, intersectionality heatmap, fix simulations, PDF compliance report, and the mitigated CSV — all available within 30 seconds for a 3,500-row dataset.

<br/>

---

## 🔬 &nbsp; What We Detect

<br/>

| Bias Type | Detection Method | Legal Standard |
|---|---|---|
| **Gender Hiring Disparity** | Adverse Impact Ratio | EEOC 4/5ths Rule |
| **Race / Group Identity Bias** | Chi-Square + AIR | EEOC Title VII |
| **Age Discrimination** | Binned group selection rates | Age Discrimination in Employment Act |
| **Proxy Discrimination** | Pearson correlation matrix | EU AI Act High-Risk Category |
| **Intersectional Bias** | 2D cross-group heatmap | Kimberle Crenshaw intersectionality framework |
| **Missing Data Disparity** | Imputed vs provided mean comparison | ISO 30415:2021 |
| **Interview Score Bias** | Distribution shift analysis per group | Equal Employment Opportunity |

<br/>

---

## ☁️ &nbsp; Google Technology Stack

<br/>

Every Google Cloud service we use is load-bearing — not cosmetic.

<br/>

| Service | How We Use It | Why This Matters |
|---|---|---|
| ![Vertex AI](https://img.shields.io/badge/Vertex_AI-FF6D00?style=flat-square&logo=google-cloud&logoColor=white) **Vertex AI** | Gemini 1.5 Pro for structured bias analysis with JSON schema enforcement | Production-grade AI calls with explainability — not a raw API key wrapper |
| ![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black) **Firebase Auth** | JWT validation with org-scoped custom claims (`org_id`, `role`) | Multi-tenant data isolation — Org A cannot access Org B data |
| ![Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?style=flat-square&logo=google-cloud&logoColor=white) **Cloud Run** | NestJS API gateway + Python analysis engine, both containerised | Serverless auto-scaling, zero infrastructure management |
| ![Firestore](https://img.shields.io/badge/Firestore-FF6D00?style=flat-square&logo=firebase&logoColor=white) **Firestore** | Async job status, full result JSON, org history, user roles | Real-time polling, org-scoped security rules at database level |
| ![Cloud Storage](https://img.shields.io/badge/Cloud_Storage-4285F4?style=flat-square&logo=google-cloud&logoColor=white) **Cloud Storage** | CSV uploads (signed URL), PDF reports, demo datasets | Direct browser-to-GCS upload — data never touches our servers insecurely |
| ![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-FFCA28?style=flat-square&logo=firebase&logoColor=black) **Firebase Hosting** | React frontend CDN deployment | Global CDN, instant rollbacks, preview channels per PR |
| ![Cloud Build](https://img.shields.io/badge/Cloud_Build-34A853?style=flat-square&logo=google-cloud&logoColor=white) **Cloud Build** | CI/CD — auto-deploy both services on push to `main` | Zero-touch deployment pipeline |
| ![Secret Manager](https://img.shields.io/badge/Secret_Manager-EA4335?style=flat-square&logo=google-cloud&logoColor=white) **Secret Manager** | All credentials and API keys | No secrets in environment variables or code |
| ![Cloud Monitoring](https://img.shields.io/badge/Cloud_Monitoring-4285F4?style=flat-square&logo=google-cloud&logoColor=white) **Cloud Monitoring** | Uptime checks, error alerts, latency dashboards | Production observability — we know before users do |

<br/>

---

## 📊 &nbsp; Dataset Format

EquiLens accepts any HR CSV. For best results, your dataset should contain columns covering:

<br/>

```
REQUIRED ──────────────────────────────────────────────────────
  outcome column     hiring_decision · promoted · salary_band

PROTECTED ATTRIBUTES (auto-detected) ──────────────────────────
  gender_code        0=Male · 1=Female · 2=Non-Binary
  grp_identity       0=Majority · 1=Minority
  age_group_code     0=20-29 · 1=30-39 · 2=40-49 · 3=50-59 · 4=60+

LEGITIMATE FEATURES ────────────────────────────────────────────
  years_experience   integer
  interview_score    float  (0–100)
  education_code     0=HighSchool → 4=PhD
  gpa                float  (0.0–4.0)
  referral_flag      0 or 1
```

<br/>

> All column detection is **automatic**. You do not need to label anything manually. EquiLens auto-detects protected attributes by column name pattern matching and then confirms via statistical analysis.

<br/>

---

## 🚀 &nbsp; Local Development

<br/>

### Prerequisites
```
Node.js 20+      (NestJS API Gateway)
Python 3.11+     (Analysis Engine)
Firebase CLI     (Frontend + Auth)
gcloud CLI       (GCP services)
```

<br/>

### Clone & Setup

```bash
git clone https://github.com/Arghya-2007/solution-challenge.git
cd solution-challenge
```

<br/>

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local    # fill in your Firebase config
npm run dev
```

<br/>

**NestJS API Gateway**
```bash
cd api-gateway
npm install
cp .env.example .env          # fill in GCP project + Firebase admin credentials
npm run start:dev
```

<br/>

**Python Analysis Engine**
```bash
cd processing-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in Vertex AI project + region
uvicorn main:app --reload --port 8081
```

<br/>

---

## 📁 &nbsp; Repository Structure

```
solution-challenge/
│
├── frontend/                    # React + Vite — Firebase Hosting
│   ├── src/
│   │   ├── components/          # Dashboard, findings cards, charts
│   │   ├── pages/               # Upload, Results, History, Report
│   │   └── lib/                 # Firebase client, API calls
│   └── firebase.json
│
├── api-gateway/                 # NestJS — Cloud Run
│   ├── src/
│   │   ├── auth/                # Firebase JWT validation
│   │   ├── jobs/                # Job create, status, results endpoints
│   │   ├── storage/             # GCS signed URL generation
│   │   └── report/              # PDF signed URL endpoint
│   └── Dockerfile
│
├── processing-server/           # Python FastAPI — Cloud Run
│   ├── core/
│   │   ├── preprocessor.py      # CSV cleaning + column detection
│   │   ├── statistical_engine.py# AIR, chi-square, proxy detection
│   │   ├── vertex_client.py     # Vertex AI Gemini integration
│   │   ├── scoring.py           # 0-100 risk score calculator
│   │   └── mitigator.py         # Random Forest + fairness constraints
│   ├── report/
│   │   └── generator.py         # ReportLab PDF builder
│   ├── data/                    # 📦 Test datasets for judges
│   └── Dockerfile
│
└── cloudbuild.yaml              # CI/CD — auto deploy on push
```

<br/>

---

## 👥 &nbsp; The Team

<br/>

Built in 72 hours of concentrated effort for **Google Solution Challenge 2026** — selected Top 100 globally.

<br/>

| Role | Owns |
|---|---|
| **AI / ML + Python Backend** | Bias detection algorithms · Vertex AI integration · Random Forest mitigation · PDF report generation |
| **Cloud / DevOps + Frontend** | Firebase Auth · Cloud Run deployment · Firestore architecture · CI/CD pipeline · React dashboard |

<br/>

---

## 📜 &nbsp; Bias Frameworks We Reference

<br/>

- **EEOC 4/5ths Rule** — Adverse Impact Ratio threshold for US hiring law
- **EU AI Act (2024)** — High-risk AI system classification for employment screening tools
- **Equal Pay Act** — Compensation gap analysis standards
- **ISO 30415:2021** — International HR diversity and inclusion metrics
- **DPDP Act (India)** — Data minimization and demographic data handling

<br/>

---

<div align="center">

<br/>

---

*EquiLens — Google Solution Challenge 2026*

[![Made with ❤️ for Google Solution Challenge](https://img.shields.io/badge/Made_for-Google_Solution_Challenge_2026-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/community/gdsc-solution-challenge)

---

<br/>

</div>
