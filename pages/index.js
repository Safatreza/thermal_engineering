import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tvacData, setTvacData] = useState(null);
  const [simData, setSimData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('tvac'); // 'tvac' or 'simulation'

  // Load FULL RESOLUTION TVAC test data
  useEffect(() => {
    console.log('Loading FULL RESOLUTION TVAC data...');
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log('Full TVAC data loaded:', result.data.length, 'rows (FULL RESOLUTION)');
        if (result.data && result.data.length > 0) {
          setTvacData(result.data);
        } else {
          console.error('No data in full CSV');
        }
      },
      error: (error) => {
        console.error('Error loading full TVAC data:', error);
      }
    });
  }, []);

  // Load ALL simulation data at startup
  useEffect(() => {
    const allFiles = [
      'BASEPLATE_1105', 'BASEPLATE_1106', 'BASEPLATE_1109', 'BASEPLATE_1110',
      'SOLARPANNEL_BOTTOM_LEFT_2309', 'SOLARPANNEL_BOTTOM_LEFT_2310',
      'SOLARPANNEL_BOTTOM_LEFT_2313', 'SOLARPANNEL_BOTTOM_LEFT_2314',
      'BODY_1254', 'RADIATOR_1300',
      'PRESSURECHAMBER_8000', 'PRESSURECHAMBER_8150'
    ];

    let loadedCount = 0;
    const totalFiles = allFiles.length;

    allFiles.forEach(fileName => {
      console.log('Loading simulation file:', fileName);
      Papa.parse(`/${fileName}.csv`, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('Loaded', fileName, ':', result.data.length, 'rows');
          if (result.data && result.data.length > 0) {
            setSimData(prev => {
              const updated = { ...prev, [fileName]: result.data };
              loadedCount++;
              if (loadedCount === totalFiles) {
                console.log('All simulation files loaded');
                setLoading(false);
              }
              return updated;
            });
          } else {
            loadedCount++;
            if (loadedCount === totalFiles) {
              setLoading(false);
            }
          }
        },
        error: (err) => {
          console.error('Error loading', fileName, ':', err);
          loadedCount++;
          if (loadedCount === totalFiles) {
            setLoading(false);
          }
        }
      });
    });

    // Fallback to stop loading after 10 seconds
    setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached');
        setLoading(false);
      }
    }, 10000);
  }, []);

  // Create TVAC chart (full resolution)
  const createTvacChart = (columnName, title, unit = '°C') => {
    if (!tvacData) return null;

    const dates = tvacData.map(row => row.Date).filter(d => d != null);
    const values = tvacData.map(row => {
      const val = row[columnName];
      return (val != null && !isNaN(val)) ? val : null;
    }).filter(v => v != null);

    if (dates.length === 0 || values.length === 0) {
      return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ color: '#ef4444' }}>Error: No valid data for {title}</p>
        </div>
      );
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return (
      <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px' }}>
          <div><strong>Mean:</strong> {mean.toFixed(2)}{unit}</div>
          <div><strong>Min:</strong> {min.toFixed(2)}{unit}</div>
          <div><strong>Max:</strong> {max.toFixed(2)}{unit}</div>
          <div><strong>Range:</strong> {(max - min).toFixed(2)}{unit}</div>
          <div style={{ color: '#6b7280' }}><strong>Points:</strong> {values.length.toLocaleString()}</div>
        </div>
        <Plot
          data={[{
            x: dates,
            y: values,
            type: 'scatter',
            mode: 'lines',
            name: title,
            line: {
              color: '#3b82f6',
              width: 1.5,
              shape: 'linear'
            }
          }]}
          layout={{
            autosize: true,
            height: 450,
            margin: { t: 10, r: 10, b: 40, l: 60 },
            xaxis: {
              title: 'Time',
              showgrid: true,
              gridcolor: '#e5e7eb',
              gridwidth: 1
            },
            yaxis: {
              title: `${title} (${unit})`,
              showgrid: true,
              gridcolor: '#e5e7eb',
              gridwidth: 1
            },
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified'
          }}
          config={{ responsive: true, displayModeBar: true }}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  // Create simulation chart (full resolution) - convert Kelvin to Celsius
  const createSimChart = (fileName, title, unit = '°C') => {
    const data = simData[fileName];
    if (!data) {
      return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ color: '#6b7280' }}>Loading {title}...</p>
        </div>
      );
    }

    // Extract time and temperature data
    const times = data.map(row => row.Time).filter(t => t != null);
    const temps = data.map(row => {
      const kelvin = row['case2.sav'];
      if (kelvin != null && !isNaN(kelvin)) {
        return kelvin - 273.15; // Convert Kelvin to Celsius
      }
      return null;
    }).filter(t => t != null);

    if (times.length === 0 || temps.length === 0) {
      return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ color: '#ef4444' }}>Error: No valid data for {title}</p>
        </div>
      );
    }

    const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
    const min = Math.min(...temps);
    const max = Math.max(...temps);

    return (
      <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px' }}>
          <div><strong>Mean:</strong> {mean.toFixed(2)}{unit}</div>
          <div><strong>Min:</strong> {min.toFixed(2)}{unit}</div>
          <div><strong>Max:</strong> {max.toFixed(2)}{unit}</div>
          <div><strong>Range:</strong> {(max - min).toFixed(2)}{unit}</div>
          <div style={{ color: '#6b7280' }}><strong>Points:</strong> {temps.length.toLocaleString()}</div>
        </div>
        <Plot
          data={[{
            x: times,
            y: temps,
            type: 'scatter',
            mode: 'lines+markers',
            name: title,
            line: {
              color: '#ef4444',
              width: 2,
              shape: 'spline',
              smoothing: 1.0
            },
            marker: {
              color: '#ef4444',
              size: 4
            }
          }]}
          layout={{
            autosize: true,
            height: 450,
            margin: { t: 10, r: 10, b: 40, l: 60 },
            xaxis: {
              title: 'Time (seconds)',
              showgrid: true,
              gridcolor: '#e5e7eb',
              gridwidth: 1
            },
            yaxis: {
              title: `Temperature (${unit})`,
              showgrid: true,
              gridcolor: '#e5e7eb',
              gridwidth: 1
            },
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified'
          }}
          config={{ responsive: true, displayModeBar: true }}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  if (loading || !tvacData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'url(/background.jfif) center/cover fixed',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '40px', borderRadius: '10px' }}>
          <h2 style={{ color: '#1f2937' }}>Loading CubeSat Thermal Data...</h2>
        </div>
      </div>
    );
  }

  const renderTvacView = () => {
    return (
      <>
        {/* Temperature Charts */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>TVAC Temperature Sensors (Full Resolution - 32,448 points)</h2>
          {createTvacChart('Temp1', 'Top Plate (Temp1) - BASEPLATE_1106')}
          {createTvacChart('Temp2', 'Solar Panel (Temp2) - SOLARPANNEL_BOTTOM_LEFT_2309')}
          {createTvacChart('Temp3', 'Body under MLI (Temp3) - BODY_1254')}
          {createTvacChart('Temp4', 'Radiator Inside (Temp4) - RADIATOR_1300')}
          {createTvacChart('Temp5', 'TVAC Bottom (Temp5)')}
          {createTvacChart('Temp6', 'Outer Layer TVAC (Temp6)')}
        </div>

        {/* Pressure Chart */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Pressure Monitoring</h2>
          {createTvacChart('Pressure', 'Vacuum Chamber Pressure', 'mbar')}
        </div>
      </>
    );
  };

  const renderSimulationView = () => {
    return (
      <>
        {/* Base Plates */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Base Plate Simulations (Full Resolution - 101 points)</h2>
          {createSimChart('BASEPLATE_1105', 'Base Plate 1105')}
          {createSimChart('BASEPLATE_1106', 'Base Plate 1106')}
          {createSimChart('BASEPLATE_1109', 'Base Plate 1109')}
          {createSimChart('BASEPLATE_1110', 'Base Plate 1110')}
        </div>

        {/* Solar Panels */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Solar Panel Simulations</h2>
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2309', 'Solar Panel 2309')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2310', 'Solar Panel 2310')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2313', 'Solar Panel 2313')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2314', 'Solar Panel 2314')}
        </div>

        {/* Components */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Component Simulations</h2>
          {createSimChart('BODY_1254', 'Body 1254 (under MLI)')}
          {createSimChart('RADIATOR_1300', 'Radiator 1300')}
        </div>

        {/* Pressure Chambers */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Pressure Chamber Simulations</h2>
          {createSimChart('PRESSURECHAMBER_8000', 'Pressure Chamber 8000')}
          {createSimChart('PRESSURECHAMBER_8150', 'Pressure Chamber 8150')}
        </div>
      </>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'url(/background.jfif) center/cover fixed',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>
            CubeSat Thermal Desktop Validation
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            {activeView === 'tvac' ? 'TVAC Test Data Analysis (32,448 points)' : 'Thermal Desktop Simulation Results (101 points each)'}
          </p>

          {/* View Tabs */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveView('tvac')}
              style={{
                padding: '12px 24px',
                background: activeView === 'tvac' ? '#2563eb' : '#e5e7eb',
                color: activeView === 'tvac' ? '#fff' : '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              TVAC Test Data
            </button>
            <button
              onClick={() => setActiveView('simulation')}
              style={{
                padding: '12px 24px',
                background: activeView === 'simulation' ? '#2563eb' : '#e5e7eb',
                color: activeView === 'simulation' ? '#fff' : '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Our Simulation Results
            </button>
          </div>
        </div>

        {/* Active View */}
        {activeView === 'tvac' ? renderTvacView() : renderSimulationView()}
      </div>
    </div>
  );
}
