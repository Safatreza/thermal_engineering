# Thermal Engineering Data Visualization

A Next.js web application for visualizing thermal engineering data with interactive charts.

## Features

- Interactive visualization of 6 temperature sensors (Temp1-6) over time
- Pressure monitoring and visualization
- Real-time data exploration with zoom, pan, and hover capabilities
- Responsive design with modern UI
- Processing of 32,000+ data points

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Safatreza/thermal_engineering.git
cd thermal_engineering
```

2. Install required dependencies:
```bash
npm install
```

## Project Structure

```
thermal_engineering/
├── app/
│   ├── page.js              # Main page component
│   └── layout.js            # Root layout
├── public/
│   └── 20251211_LPE_CC_Data_Export.csv  # Data file
├── package.json             # Node dependencies
├── next.config.js           # Next.js configuration
├── vercel.json              # Vercel configuration
└── README.md
```

## Usage

1. Run the Next.js development server:
```bash
npm run dev
```

2. Open your web browser and navigate to:
```
http://localhost:3000
```

## Data Format

The application reads CSV data with the following columns:
- Date: Timestamp in ISO format
- Temp1-Temp6: Temperature readings from 6 sensors
- Pressure: Pressure measurements in mbar
- Additional metadata columns

## Technologies Used

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **Plotly.js**: Interactive visualizations
- **PapaParse**: CSV parsing
- **Vercel**: Hosting platform

## Screenshots

### Temperature Sensors Chart
Interactive line chart showing all 6 temperature sensors over time.

### Pressure Chart
Area chart displaying pressure variations with filled gradient.

## Deployment

### Deploy to Vercel

This project is configured for easy deployment to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Safatreza/thermal_engineering)

For detailed deployment instructions, see [DEPLOY.md](DEPLOY.md)

### Quick Deploy Steps

1. Fork or clone this repository
2. Push to your GitHub account
3. Connect to Vercel
4. Deploy with one click

## Data Overview

The visualization processes real thermal engineering data with:
- **Temperature Range**: -18.51°C to 111.29°C across 6 sensors
- **Pressure Range**: 0 to 993 mbar (logarithmic scale)
- **Time Period**: December 11-15, 2025
- **Data Points**: 32,448 measurements

## License

This project is open source and available for educational and research purposes.
