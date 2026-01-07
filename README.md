# CubeSat Thermal Desktop Test Analysis

Comprehensive thermal analysis and visualization system for CubeSat satellite thermal desktop testing.

## Overview

This application provides analytical comparison between:
- **Ideal Test Data**: Reference thermal vacuum (TVAC) test results
- **Your Test Data**: CubeSat thermal desktop simulation results

## CubeSat Components Analyzed

### Temperature Sensors
1. **Top Plate** (Temp1) - BASEPLATE_1106
2. **Solar Panel** (Temp2) - SOLARPANNEL_BOTTOM_LEFT_2309  
3. **Body (under MLI)** (Temp3) - BODY_1254
4. **Radiator Inside** (Temp4) - RADIATOR_1300
5. **TVAC Bottom** (Temp5)
6. **Outer Layer TVAC** (Temp6)

### Pressure Monitoring
- **PRESSURECHAMBER_8000** - Thermal vacuum chamber pressure
- **PRESSURECHAMBER_8150** - Secondary pressure monitoring

## Features

### 1. Ideal Test Visualization
- 32,448 data points from TVAC testing
- Real-time adjustable data sampling (1x to 100x)
- Interactive temperature and pressure charts
- Statistical analysis dashboard

### 2. Thermal Desktop Comparison
- Side-by-side comparison of simulation vs actual test
- Automated deviation analysis
- Color-coded performance indicators:
  - ✓ Green: <5% deviation (Excellent)
  - ⚠ Yellow: 5-10% deviation (Acceptable)
  - ⚠ Red: >10% deviation (Review needed)

### 3. Analytical Metrics
For each component:
- Mean temperature/pressure values
- Min/Max ranges
- Absolute and percentage deviation
- Data quality assessment

## Installation

```bash
git clone https://github.com/Safatreza/thermal_engineering.git
cd thermal_engineering
npm install
```

## Usage

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production
```bash
npm run build
npm start
```

## Data Format

### Ideal Test Data
- Format: CSV with timestamp
- Sampling: 10-second intervals
- Duration: ~4 days continuous testing
- Sensors: 6 temperature + pressure

### Thermal Desktop Results
- Format: XLS (converted to CSV)
- Time: Simulation time steps (seconds)
- Temperature: Kelvin (auto-converted to Celsius)
- Pressure: mbar

## Test Conditions

- **Environment**: Thermal Vacuum Chamber
- **Satellite Type**: CubeSat
- **Test Type**: Thermal Desktop Simulation Validation
- **Pressure Range**: 0 to 993 mbar (space vacuum simulation)
- **Temperature Range**: -18.51°C to 111.29°C

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Safatreza/thermal_engineering)

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## Tech Stack

- **Next.js 14** - React framework
- **Plotly.js** - Interactive charts
- **PapaParse** - CSV processing
- **React 18** - UI components

## Use Cases

1. **Thermal Model Validation**: Compare thermal desktop predictions with actual test data
2. **Mission Planning**: Verify satellite thermal performance before launch
3. **Design Iteration**: Identify components needing thermal redesign
4. **Documentation**: Generate reports for mission reviews

## Analysis Interpretation

### Temperature Deviations
- **<5%**: Thermal model accurately represents physical system
- **5-10%**: Acceptable for preliminary design, may need refinement
- **>10%**: Investigate model assumptions, material properties, or test setup

### Pressure Analysis
- Validates thermal vacuum chamber performance
- Ensures proper space environment simulation
- Confirms pump-down procedures

## Contributing

This is a CubeSat mission-critical tool. For modifications:
1. Maintain data accuracy
2. Preserve analytical rigor
3. Document changes thoroughly

## License

Mission use - Educational and Research

## Contact

For CubeSat thermal analysis questions or collaboration:
- Repository: https://github.com/Safatreza/thermal_engineering
- Issues: https://github.com/Safatreza/thermal_engineering/issues

---

**Note**: This tool processes real satellite thermal test data. Handle with appropriate mission data security protocols.
