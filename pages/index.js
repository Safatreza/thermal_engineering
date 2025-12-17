import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tempData, setTempData] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Starting to load CSV...');

    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      step: function(row, parser) {
        // Sample every 5th row for faster loading
        if (parser.cursor % 5 !== 0) {
          return;
        }
      },
      complete: (results) => {
        console.log('CSV loaded, rows:', results.data.length);

        try {
          const csvData = results.data.filter(row => row.Date && row.Temp1);
          console.log('Filtered data:', csvData.length, 'rows');

          // Sample data - take every 10th point for performance
          const sampled = csvData.filter((_, i) => i % 10 === 0);
          console.log('Sampled data:', sampled.length, 'rows');

          // Temperature data
          const dates = sampled.map(row => row.Date);
          const tempColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

          const tempTraces = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'].map((temp, i) => ({
            x: dates,
            y: sampled.map(row => row[temp]),
            type: 'scatter',
            mode: 'lines',
            name: temp,
            line: { color: tempColors[i], width: 2 }
          }));

          // Pressure data
          const pressureTrace = [{
            x: dates,
            y: sampled.map(row => row.Pressure > 0 ? row.Pressure : null),
            type: 'scatter',
            mode: 'lines',
            name: 'Pressure',
            line: { color: '#E74C3C', width: 2 }
          }];

          setTempData(tempTraces);
          setPressureData(pressureTrace);
          setLoading(false);
          console.log('Charts ready!');
        } catch (err) {
          console.error('Error processing data:', err);
          setError(err.message);
          setLoading(false);
        }
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        setError(err.message);
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
        <div>
          <h1>Loading data...</h1>
          <p style={{ fontSize: '16px', marginTop: '10px' }}>Processing 32,000+ data points...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#ff4444',
        color: 'white',
        fontSize: '24px'
      }}>
        <div>
          <h1>Error loading data</h1>
          <p>{error}</p>
        </div>
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
          <p style={{ fontSize: '1.2em' }}>Interactive Temperature & Pressure Monitoring</p>
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
            borderBottom: '3px solid #667eea',
            paddingBottom: '10px'
          }}>
            🌡️ Temperature Sensors (Temp1-6)
          </h2>
          {tempData && (
            <Plot
              data={tempData}
              layout={{
                autosize: true,
                xaxis: {
                  title: 'Date/Time',
                  showgrid: true
                },
                yaxis: {
                  title: 'Temperature (°C)',
                  showgrid: true
                },
                hovermode: 'x unified',
                template: 'plotly_white',
                height: 600,
                margin: { l: 60, r: 40, t: 40, b: 80 },
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: -0.2,
                  xanchor: 'center',
                  x: 0.5
                }
              }}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
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
            borderBottom: '3px solid #667eea',
            paddingBottom: '10px'
          }}>
            📊 Pressure Over Time
          </h2>
          {pressureData && (
            <Plot
              data={pressureData}
              layout={{
                autosize: true,
                xaxis: {
                  title: 'Date/Time',
                  showgrid: true
                },
                yaxis: {
                  title: 'Pressure (mbar)',
                  type: 'log',
                  showgrid: true
                },
                hovermode: 'x unified',
                template: 'plotly_white',
                height: 600,
                margin: { l: 60, r: 40, t: 40, b: 80 }
              }}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          )}
        </div>

        <footer style={{
          textAlign: 'center',
          color: 'white',
          padding: '20px',
          opacity: 0.9
        }}>
          <p>Data: 20251211_LPE_CC_Data_Export.csv | Sampled for performance</p>
        </footer>
      </div>
    </div>
  );
}
