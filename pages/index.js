import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tempData, setTempData] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse('/data_moderate.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Date);

        // Temperature traces
        const tempColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const tempTraces = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'].map((temp, i) => ({
          x: data.map(row => row.Date),
          y: data.map(row => row[temp]),
          type: 'scatter',
          mode: 'lines',
          name: temp,
          line: { color: tempColors[i], width: 2 }
        }));

        // Pressure trace
        const pressureTrace = [{
          x: data.map(row => row.Date),
          y: data.map(row => row.Pressure),
          type: 'scatter',
          mode: 'lines',
          name: 'Pressure',
          line: { color: '#E74C3C', width: 2 }
        }];

        setTempData(tempTraces);
        setPressureData(pressureTrace);
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <header style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '30px',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px'
        }}>
          <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>
            Thermal Engineering Data Visualization
          </h1>
          <p style={{ fontSize: '1.2em' }}>Temperature & Pressure Monitoring</p>
        </header>

        {/* TEMPERATURE CHART */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.8em',
            color: '#333',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '3px solid #667eea'
          }}>
            Temperature Sensors (Temp1-6)
          </h2>
          {tempData && (
            <Plot
              data={tempData}
              layout={{
                xaxis: { title: 'Date/Time' },
                yaxis: { title: 'Temperature (°C)' },
                hovermode: 'closest',
                height: 600,
                margin: { l: 60, r: 40, t: 20, b: 60 }
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* PRESSURE CHART */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.8em',
            color: '#333',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '3px solid #667eea'
          }}>
            Pressure Over Time
          </h2>
          {pressureData && (
            <Plot
              data={pressureData}
              layout={{
                xaxis: { title: 'Date/Time' },
                yaxis: {
                  title: 'Pressure (mbar)',
                  type: 'log'
                },
                hovermode: 'closest',
                height: 600,
                margin: { l: 60, r: 40, t: 20, b: 60 }
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        <footer style={{
          textAlign: 'center',
          color: 'white',
          padding: '20px',
          opacity: 0.9
        }}>
          <p>Thermal Engineering Data - 3,245 data points (90% compression, ~1.7 min intervals)</p>
        </footer>
      </div>
    </div>
  );
}
