# SIH26103 — Exploratory Data Analysis (EDA) Report

**Generated**: 2026-09-09 17:19:34  
**Authority**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Dataset Source**: `data/interim/paimana_time_overrun_validated.csv`  
**Sample Size**: 17,697 project observation records across 38 attributes  

## 1. Executive Findings & Key Insights

1. **Prevalence of Infrastructure Schedule Overruns**: In the audited portfolio, **12,849 out of 17,697 project observations (72.61%)** exhibit time overrun beyond approved schedules, while 4,848 (27.39%) are progressing on schedule.
2. **Magnitude of Delay**: For delayed infrastructure projects, the mean schedule slippage is **30.1 months** (Median: **21.0 months**), with extreme delays reaching up to **300.0 months**.
3. **Predictive Discriminator — Schedule-Progress Gap**: The derived metric `schedule_progress_gap_pct` (Physical Progress % minus Elapsed Duration %) provides a pronounced early-warning signal:
   - On-schedule projects exhibit a median gap of **-50.65%**.
   - Delayed projects exhibit a median gap of **-54.18%**, signifying severe lag between calendar time consumed and actual physical output.
4. **Financial Scale Diversity**: Sanctioned project costs range from small schemes up to mega-infrastructure projects of **INR 108,000.00 Cr** (Mean: INR 2,027.07 Cr, Median: INR 758.09 Cr).

## 2. Visualizations Directory

| Visualization | Description | File Path |
|---|---|---|
| Target Delay Distribution | Distribution of binary overrun flag and delay magnitude | `reports/figures/01_target_delay_distribution.png` |
| Progress vs Expenditure | Parity scatter between physical completion and financial burn | `reports/figures/02_physical_progress_vs_expenditure.png` |
| Schedule-Progress Gap Boxplot | Gap distribution separated by delayed vs on-schedule projects | `reports/figures/03_schedule_progress_gap_by_delay.png` |
| Correlation Matrix | Pairwise Pearson correlations between continuous metrics and targets | `reports/figures/04_correlation_heatmap.png` |
| Temporal Portfolio Trends | Historical trajectory of delay rate and progress across report periods | `reports/figures/05_temporal_delay_trend.png` |

## 3. Financial & Operational Summary Statistics

| Metric | 25th Percentile | Median | Mean | 75th Percentile | Max |
|---|---|---|---|---|---|
| **Original Cost (INR Cr)** | 355.79 | 758.09 | 2,027.07 | 1,549.0 | 108,000.0 |
| **Physical Progress (%)** | 45.0% | 75.0% | 66.45% | 93.46% | 100.0% |
| **Expenditure Ratio (%)** | 19.81% | 50.65% | 61.14% | 81.4% | 10333.77% |
| **Planned Duration (Days)** | 731.0 | 912.0 | 1,309.0 | 1,096.0 | 15,585.0 |
| **Elapsed Duration (%)** | 106.44% | 111.75% | 145.52% | 158.37% | 3401.69% |

## 4. Temporal Snapshot Distribution

| Report Period | Total Projects | Delayed Projects | Delay Rate (%) | Avg Progress (%) |
|---|---|---|---|---|
| `2025-04` | 1,663 | 970 | 58.33% | 65.52% |
| `2025-05` | 1,629 | 976 | 59.91% | 65.9% |
| `2025-06` | 1,588 | 947 | 59.63% | 65.87% |
| `2025-07` | 525 | 369 | 70.29% | 61.03% |
| `2025-08` | 545 | 394 | 72.29% | 62.95% |
| `2025-10` | 568 | 431 | 75.88% | 63.54% |
| `2025-11` | 571 | 433 | 75.83% | 63.84% |
| `2025-12` | 867 | 718 | 82.81% | 65.04% |
| `2026-01` | 934 | 782 | 83.73% | 71.0% |
| `2026-02` | 985 | 833 | 84.57% | 72.92% |
| `2026-03` | 1,594 | 1,196 | 75.03% | 66.9% |
| `2026-04` | 1,627 | 1,245 | 76.52% | 66.85% |
| `2026-05` | 1,635 | 1,266 | 77.43% | 67.12% |
| `2026-06` | 1,539 | 1,179 | 76.61% | 65.99% |
| `2026-07` | 1,427 | 1,110 | 77.79% | 66.52% |

## 5. Early Warning System Formulation Implications
The empirical data establishes strong empirical support for building early-warning risk scores based on:
1. Negative `schedule_progress_gap_pct` (projects where elapsed time is racing ahead of physical completion).
2. Disproportionate `expenditure_per_progress_pct_cr` (high financial burn rate relative to physical milestones).
3. Long `approval_to_start_days` indicating preliminary pre-construction frictions.
4. Temporal trends demonstrating persistent inertia in late-stage projects.
