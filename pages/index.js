import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const csvData = results.data.filter(row => row.Date);

        const temps = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'];
        const tempValues = temps.flatMap(t => csvData.map(row => row[t]).filter(v => v != null));
        const pressureValues = csvData.map(row => row.Pressure).filter(v => v != null && v > 0);

        setStats({
          tempMin: Math.min(...tempValues).toFixed(2),
          tempMax: Math.max(...tempValues).toFixed(2),
          tempMean: (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(2),
          pressureMin: Math.min(...pressureValues).toFixed(2),
          pressureMax: Math.max(...pressureValues).toFixed(2),
          pressureMean: (pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length).toFixed(2),
          totalRecords: csvData.length,
        });

        setData(csvData);
        setLoading(false);
      },
    });
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h1>Loading thermal engineering data...</h1>
      </div>
    );
  }

  const tempColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const tempTraces = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'].map((temp, i) => ({
    x: data.map(row => row.Date),
    y: data.map(row => row[temp]),
    type: 'scatter',
    mode: 'lines',
    name: temp,
    line: { color: tempColors[i], width: 2 }
  }));

  const pressureTrace = {
    x: data.map(row => row.Date),
    y: data.map(row => row.Pressure),
    type: 'scatter',
    mode: 'lines',
    name: 'Pressure',
    fill: 'tozeroy',
    fillcolor: 'rgba(231, 76, 60, 0.2)',
    line: { color: '#E74C3C', width: 2 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.title}>Thermal Engineering Data Visualization</h1>
          <div style={styles.subtitle}>Total Records: {stats.totalRecords} data points</div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Temperature Range</h3>
              <p>{stats.tempMin}°C to {stats.tempMax}°C</p>
            </div>
            <div style={styles.statCard}>
              <h3>Avg Temperature</h3>
              <p>{stats.tempMean}°C</p>
            </div>
            <div style={styles.statCard}>
              <h3>Pressure Range</h3>
              <p>{stats.pressureMin} to {stats.pressureMax} mbar</p>
            </div>
            <div style={styles.statCard}>
              <h3>Avg Pressure</h3>
              <p>{stats.pressureMean} mbar</p>
            </div>
          </div>
        </header>

        <div style={styles.chartContainer}>
          <h2 style={styles.chartTitle}>Temperature Sensors (Temp1-6) Over Time</h2>
          <Plot
            data={tempTraces}
            layout={{
              autosize: true,
              xaxis: { title: 'Date' },
              yaxis: { title: 'Temperature (°C)' },
              hovermode: 'x unified',
              template: 'plotly_white',
              height: 600,
              margin: { l: 60, r: 40, t: 40, b: 60 }
            }}
            config={{ responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>

        <div style={styles.chartContainer}>
          <h2 style={styles.chartTitle}>Pressure Over Time (Log Scale)</h2>
          <Plot
            data={[pressureTrace]}
            layout={{
              autosize: true,
              xaxis: { title: 'Date' },
              yaxis: {
                title: 'Pressure (mbar)',
                type: 'log'
              },
              hovermode: 'x unified',
              template: 'plotly_white',
              height: 600,
              margin: { l: 60, r: 40, t: 40, b: 60 }
            }}
            config={{ responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>

        <footer style={styles.footer}>
          <p>Data from: 20251211_LPE_CC_Data_Export.csv</p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: 'white',
  },
  container: {
    padding: '20px',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '30px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: '2.5em',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  subtitle: {
    fontSize: '1.1em',
    opacity: 0.9,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    padding: '15px',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)',
  },
  chartContainer: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  chartTitle: {
    fontSize: '1.5em',
    color: '#333',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '3px solid #667eea',
  },
  footer: {
    textAlign: 'center',
    color: 'white',
    marginTop: '20px',
    padding: '15px',
    opacity: 0.8,
  },
};
