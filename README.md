# Thermal Engineering Data Visualization

A Flask web application for visualizing thermal engineering data with interactive charts.

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
pip install -r requirements.txt
```

## Usage

1. Run the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

## Data Format

The application reads CSV data with the following columns:
- Date: Timestamp in ISO format
- Temp1-Temp6: Temperature readings from 6 sensors
- Pressure: Pressure measurements in mbar
- Additional metadata columns

## Technologies Used

- **Flask 3.0.0**: Web framework
- **Pandas 2.1.4**: Data processing
- **Plotly 5.18.0**: Interactive visualizations
- **HTML/CSS**: Frontend interface

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
