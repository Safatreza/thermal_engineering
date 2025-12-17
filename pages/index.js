import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [allData, setAllData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [samplingRate, setSamplingRate] = useState(10); // Every 10th point
  const [stats, setStats] = useState(null);

  // Load full dataset once
  useEffect(() => {
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Date && row.Temp1);
        setAllData(data);
        setLoading(false);
      }
    });
  }, []);

  // Update charts when data or sampling rate changes
  useEffect(() => {
    if (!allData) return;

    // Sample data based on user selection
    const sampled = allData.filter((_, i) => i % samplingRate === 0);

    // Calculate statistics
    const temps = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'];
    const tempValues = temps.flatMap(t => sampled.map(row => row[t]).filter(v => v != null));
    const pressureValues = sampled.map(row => row.Pressure).filter(v => v != null);

    setStats({
      tempMin: Math.min(...tempValues).toFixed(2),
      tempMax: Math.max(...tempValues).toFixed(2),
      tempMean: (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(2),
      pressureMin: Math.min(...pressureValues).toFixed(2),
      pressureMax: Math.max(...pressureValues).toFixed(2),
      pressureMean: (pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length).toFixed(2),
      totalPoints: sampled.length,
      originalPoints: allData.length
    });

    // Temperature traces with proper labels
    const tempColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const tempLabels = [
      'Top Plate',
      'Solar Panel',
      'Body (under MLI)',
      'Radiator Inside',
      'TVAC Bottom',
      'Outer Layer TVAC'
    ];
    const tempTraces = temps.map((temp, i) => ({
      x: sampled.map(row => row.Date),
      y: sampled.map(row => row[temp]),
      type: 'scatter',
      mode: 'lines',
      name: tempLabels[i],
      line: { color: tempColors[i], width: 2 }
    }));

    // Pressure trace
    const pressureTrace = [{
      x: sampled.map(row => row.Date),
      y: sampled.map(row => row.Pressure),
      type: 'scatter',
      mode: 'lines',
      name: 'Pressure',
      line: { color: '#E74C3C', width: 2 }
    }];

    setTempData(tempTraces);
    setPressureData(pressureTrace);
  }, [allData, samplingRate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundImage: 'url(/background.jfif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '40px',
          borderRadius: '15px'
        }}>
          <h1>Loading all data...</h1>
          <p style={{ fontSize: '16px', marginTop: '10px' }}>Processing 32,000+ data points...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundImage: 'url(/background.jfif)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <header style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '30px',
          padding: '30px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>
            Thermal Engineering Data Visualization
          </h1>
          <p style={{ fontSize: '1.2em' }}>Interactive Temperature & Pressure Monitoring</p>

          {/* Data Scope Control */}
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1.2em' }}>Data Scope Control</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '1em', marginRight: '10px' }}>
                Sampling Rate: Every {samplingRate} point{samplingRate > 1 ? 's' : ''}
              </label>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={samplingRate}
              onChange={(e) => setSamplingRate(parseInt(e.target.value))}
              style={{
                width: '100%',
                maxWidth: '500px',
                cursor: 'pointer'
              }}
            />
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setSamplingRate(1)} style={buttonStyle}>All Data (32K)</button>
              <button onClick={() => setSamplingRate(5)} style={buttonStyle}>High (6.5K)</button>
              <button onClick={() => setSamplingRate(10)} style={buttonStyle}>Medium (3.2K)</button>
              <button onClick={() => setSamplingRate(50)} style={buttonStyle}>Low (650)</button>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginTop: '20px'
            }}>
              <div style={statCardStyle}>
                <h4>Showing</h4>
                <p>{stats.totalPoints.toLocaleString()} / {stats.originalPoints.toLocaleString()}</p>
              </div>
              <div style={statCardStyle}>
                <h4>Temp Range</h4>
                <p>{stats.tempMin}°C - {stats.tempMax}°C</p>
              </div>
              <div style={statCardStyle}>
                <h4>Avg Temp</h4>
                <p>{stats.tempMean}°C</p>
              </div>
              <div style={statCardStyle}>
                <h4>Pressure Range</h4>
                <p>{stats.pressureMin} - {stats.pressureMax} mbar</p>
              </div>
            </div>
          )}
        </header>

        {/* TEMPERATURE CHART */}
        <div style={chartContainerStyle}>
          <h2 style={chartTitleStyle}>
            🌡️ Temperature Sensors
          </h2>
          <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
            Top Plate • Solar Panel • Body (MLI) • Radiator Inside • TVAC Bottom • Outer Layer TVAC
          </p>
          {tempData && (
            <Plot
              data={tempData}
              layout={{
                xaxis: { title: 'Date/Time' },
                yaxis: { title: 'Temperature (°C)' },
                hovermode: 'closest',
                height: 600,
                margin: { l: 60, r: 40, t: 20, b: 60 },
                paper_bgcolor: 'rgba(255,255,255,0.95)',
                plot_bgcolor: 'rgba(255,255,255,0.95)'
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* PRESSURE CHART */}
        <div style={chartContainerStyle}>
          <h2 style={chartTitleStyle}>
            📊 Pressure Over Time
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
                margin: { l: 60, r: 40, t: 20, b: 60 },
                paper_bgcolor: 'rgba(255,255,255,0.95)',
                plot_bgcolor: 'rgba(255,255,255,0.95)'
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
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <p>Thermal Engineering Data - Full Dataset Available</p>
        </footer>
      </div>
    </div>
  );
}

const chartContainerStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '15px',
  padding: '25px',
  marginBottom: '30px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)'
};

const chartTitleStyle = {
  fontSize: '1.8em',
  color: '#333',
  marginBottom: '20px',
  paddingBottom: '10px',
  borderBottom: '3px solid #667eea'
};

const statCardStyle = {
  background: 'rgba(255, 255, 255, 0.15)',
  padding: '15px',
  borderRadius: '10px',
  backdropFilter: 'blur(10px)'
};

const buttonStyle = {
  padding: '10px 20px',
  background: 'rgba(255, 255, 255, 0.2)',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.3s',
};
