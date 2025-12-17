'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load and parse CSV
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const csvData = results.data;

        // Calculate statistics
        const temps = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'];
        const tempValues = temps.flatMap(t => csvData.map(row => row[t]).filter(v => v != null));
        const pressureValues = csvData.map(row => row.Pressure).filter(v => v != null);

        setStats({
          tempMin: Math.min(...tempValues).toFixed(2),
          tempMax: Math.max(...tempValues).toFixed(2),
          tempMean: (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(2),
          pressureMin: Math.min(...pressureValues).toFixed(2),
          pressureMax: Math.max(...pressureValues).toFixed(2),
          pressureMean: (pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length).toFixed(2),
          totalRecords: csvData.length,
          dateRange: `${csvData[0]?.Date} to ${csvData[csvData.length - 1]?.Date}`
        });

        setData(csvData);
        setLoading(false);
      },
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
        Loading thermal engineering data...
      </div>
    );
  }

  // Prepare temperature chart data
  const tempColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const tempTraces = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'].map((temp, i) => ({
    x: data.map(row => row.Date),
    y: data.map(row => row[temp]),
    type: 'scatter',
    mode: 'lines',
    name: temp,
    line: { color: tempColors[i], width: 2 }
  }));

  // Prepare pressure chart data
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
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{
            fontSize: '2.5em',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Thermal Engineering Data Visualization
          </h1>
          <div style={{ fontSize: '1.1em', opacity: 0.9 }}>
            Total Records: {stats.totalRecords} data points | {stats.dateRange}
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '15px',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '0.9em', marginBottom: '5px', opacity: 0.8 }}>Temperature Range</h3>
              <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{stats.tempMin}°C to {stats.tempMax}°C</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '15px',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '0.9em', marginBottom: '5px', opacity: 0.8 }}>Avg Temperature</h3>
              <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{stats.tempMean}°C</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '15px',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '0.9em', marginBottom: '5px', opacity: 0.8 }}>Pressure Range</h3>
              <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{stats.pressureMin} to {stats.pressureMax} mbar</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '15px',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '0.9em', marginBottom: '5px', opacity: 0.8 }}>Avg Pressure</h3>
              <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{stats.pressureMean} mbar</p>
            </div>
          </div>
        </header>

        {/* Temperature Chart */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.5em',
            color: '#333',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '3px solid #667eea'
          }}>
            Temperature Sensors (Temp1-6) Over Time
          </h2>
          <Plot
            data={tempTraces}
            layout={{
              xaxis: { title: 'Date' },
              yaxis: { title: 'Temperature (°C)' },
              hovermode: 'x unified',
              template: 'plotly_white',
              height: 700,
              legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'right',
                x: 1
              }
            }}
            config={{ responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Pressure Chart */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.5em',
            color: '#333',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '3px solid #667eea'
          }}>
            Pressure Over Time
          </h2>
          <Plot
            data={[pressureTrace]}
            layout={{
              xaxis: { title: 'Date' },
              yaxis: {
                title: 'Pressure (mbar) - Log Scale',
                type: 'log'
              },
              hovermode: 'x unified',
              template: 'plotly_white',
              height: 700
            }}
            config={{ responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          color: 'white',
          marginTop: '20px',
          padding: '15px',
          opacity: 0.8
        }}>
          <p>Data from: 20251211_LPE_CC_Data_Export.csv</p>
        </footer>
      </div>
    </div>
  );
}
