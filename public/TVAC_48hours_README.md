# TVAC 48-Hour Cleaned Dataset

## File Information

**Filename:** `TVAC_48hours_cleaned.csv`

**Description:** Time-aligned TVAC test data matching simulation duration (48 hours)

## Dataset Specifications

| Property | Value |
|----------|-------|
| **Total Data Points** | 17,280 |
| **Test Duration** | 48 hours (2 days) |
| **Sampling Rate** | Every 10 seconds |
| **Start Time** | 2025-12-11 15:31:29 |
| **End Time** | 2025-12-13 16:02:35 |
| **File Size** | ~2.5 MB |
| **Columns** | 15 |

## Column Descriptions

### Temperature Sensors (°C)
- **Temp1**: Top Plate (BASEPLATE_1106)
- **Temp2**: Solar Panel (SOLARPANNEL_BOTTOM_LEFT_2309)
- **Temp3**: Body under MLI (BODY_1254)
- **Temp4**: Radiator Inside (RADIATOR_1300)
- **Temp5**: TVAC Bottom
- **Temp6**: Outer Layer TVAC

### Control & Monitoring
- **Date**: ISO 8601 timestamp
- **TempSet**: Temperature setpoint (°C)
- **TempChamber**: Chamber temperature (°C)
- **CS**: Control state
- **PSUC1I**: Power supply 1 current (A)
- **PSUC1U**: Power supply 1 voltage (V)
- **PSUC2I**: Power supply 2 current (A)
- **PSUC2U**: Power supply 2 voltage (V)
- **Pressure**: Vacuum chamber pressure (mbar)

## Data Quality

- **Completeness**: 100% (zero missing data points)
- **Consistency**: All timestamps sequential with 10-second intervals
- **Validity**: All sensor readings within expected ranges

## Time Alignment with Simulation

This cleaned dataset is specifically prepared for direct comparison with Thermal Desktop simulation results:

| Dataset | Points | Duration | Sampling |
|---------|--------|----------|----------|
| **TVAC Test (This File)** | 17,280 | 48 hours | 10 seconds |
| **Thermal Desktop Simulation** | 101 | 48 hours | 1,728 seconds (28.8 min) |

Both datasets:
- Start at time zero (relative time)
- Span exactly 48 hours
- Enable direct overlay comparison

## Temperature Ranges

Based on this 48-hour window:

| Sensor | Mean (°C) | Min (°C) | Max (°C) | Range (°C) |
|--------|-----------|----------|----------|------------|
| **Temp1** (Top Plate) | 63.64 | 19.54 | 99.71 | 80.17 |
| **Temp2** (Solar Panel) | 42.82 | -0.52 | 87.00 | 87.52 |
| **Temp3** (Body MLI) | 77.29 | 21.02 | 111.29 | 90.26 |
| **Temp4** (Radiator) | 69.22 | 20.65 | 104.33 | 83.68 |
| **Temp5** (TVAC Bottom) | 35.06 | -14.47 | 83.55 | 98.03 |
| **Temp6** (Outer TVAC) | 31.47 | -18.51 | 80.95 | 99.46 |

## Vacuum Conditions

- **Mean Pressure**: 0.70 mbar
- **Vacuum Time**: 99.9% at < 1 mbar
- **Min Pressure**: 0.00 mbar
- **Max Pressure**: 993.00 mbar (initial pump-down)

## Usage

### Python (Pandas)
```python
import pandas as pd

# Load cleaned dataset
df = pd.read_csv('TVAC_48hours_cleaned.csv')

# Access temperature data
temp_top_plate = df['Temp1']
temp_solar_panel = df['Temp2']

# Get timestamps
timestamps = df['Date']
```

### Direct Comparison
This file is synchronized with simulation data for overlay analysis:
- TVAC data: High resolution (17,280 points)
- Simulation: Lower resolution (101 points)
- Both aligned to 0-48 hour timeline

## Differences from Full Dataset

**Original File:** `20251211_LPE_CC_Data_Export.csv`
- Total duration: 90.1 hours (3.76 days)
- Total points: 32,448

**This Cleaned File:** `TVAC_48hours_cleaned.csv`
- Duration: 48 hours (first 2 days)
- Points: 17,280 (53.2% of original)
- **Removed:** Last 42.1 hours (15,168 points)

## File Location

**Path:** `/public/TVAC_48hours_cleaned.csv`

**Web Access:** Available at `/TVAC_48hours_cleaned.csv` when deployed

## Related Files

- **Full Dataset**: `20251211_LPE_CC_Data_Export.csv` (32,448 points, 90 hours)
- **Moderate Dataset**: `data_moderate.csv` (3,245 points, 90% compressed)
- **Simulation Data**: `BASEPLATE_1106.csv`, `SOLARPANNEL_BOTTOM_LEFT_2309.csv`, etc. (101 points each)

---

**Generated**: 2026-01-14
**Purpose**: Time-aligned thermal validation for CubeSat Thermal Desktop model
