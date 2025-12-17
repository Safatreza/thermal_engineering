# Thermal Engineering Data Visualization

Interactive Next.js web application for visualizing thermal engineering data with real-time charts.

## Features

- 📊 **Temperature Monitoring**: 6 temperature sensors (Temp1-6) visualized over time
- 📈 **Pressure Tracking**: Logarithmic scale pressure visualization (0-993 mbar range)
- 📉 **Interactive Charts**: Zoom, pan, and hover with Plotly.js
- 📱 **Responsive Design**: Works on desktop and mobile
- ⚡ **Fast Performance**: Client-side data processing with 32,000+ data points

## Live Demo

Deploy your own:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Safatreza/thermal_engineering)

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

### Production Build

```bash
npm run build
npm start
```

## Data Overview

- **Temperature Range**: -18.51°C to 111.29°C across 6 sensors
- **Pressure Range**: 0 to 993 mbar (logarithmic scale)
- **Data Points**: 32,448 measurements
- **Time Period**: December 11-15, 2025

## Tech Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **Plotly.js** - Interactive charts
- **PapaParse** - CSV parsing

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

See [DEPLOY.md](DEPLOY.md) for detailed instructions.

## Project Structure

```
thermal_engineering/
├── pages/
│   ├── index.js          # Main page with charts
│   └── _app.js          # App wrapper
├── public/
│   └── 20251211_LPE_CC_Data_Export.csv
├── styles/
│   └── globals.css
├── package.json
└── next.config.js
```

## License

Open source - Educational and research purposes

## Repository

https://github.com/Safatreza/thermal_engineering
