import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [idealData, setIdealData] = useState(null);
  const [yourTestData, setYourTestData] = useState({});
  const [tempData, setTempData] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [samplingRate, setSamplingRate] = useState(10);
  const [stats, setStats] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Load ideal test data
  useEffect(() => {
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data.filter(row => row.Date && row.Temp1);
        setIdealData(data);
        loadYourTestData();
      }
    });
  }, []);

  // Load your test files
  const loadYourTestData = () => {
    const testFiles = [
      { file: 'BASEPLATE_1106.csv', name: 'Base Plate', idealSensor: 'Temp1' },
      { file: 'BODY_1254.csv', name: 'Body', idealSensor: 'Temp3' },
      { file: 'RADIATOR_1300.csv', name: 'Radiator', idealSensor: 'Temp4' },
      { file: 'SOLARPANNEL_BOTTOM_LEFT_2309.csv', name: 'Solar Panel', idealSensor: 'Temp2' },
      { file: 'PRESSURECHAMBER_8000.csv', name: 'Pressure Chamber 8000', idealSensor: 'Pressure' },
      { file: 'PRESSURECHAMBER_8150.csv', name: 'Pressure Chamber 8150', idealSensor: 'Pressure' }
    ];

    let loadedCount = 0;
    const loadedData = {};

    testFiles.forEach(({ file, name, idealSensor }) => {
      Papa.parse(`/${file}`, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          loadedData[name] = {
            data: results.data.filter(row => row.Time != null),
            idealSensor
          };
          loadedCount++;
          if (loadedCount === testFiles.length) {
            setYourTestData(loadedData);
            setLoading(false);
          }
        }
      });
    });
  };

  // Update charts when ideal data changes
  useEffect(() => {
    if (!idealData) return;

    const sampled = idealData.filter((_, i) => i % samplingRate === 0);
    const temps = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6'];

    // Calculate statistics
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
      originalPoints: idealData.length
    });

    // Temperature traces
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
  }, [idealData, samplingRate]);

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
          <h1>Loading test data...</h1>
          <p style={{ fontSize: '16px', marginTop: '10px' }}>Processing ideal & your test datasets...</p>
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
            Thermal Engineering Data Analysis
          </h1>
          <p style={{ fontSize: '1.2em' }}>Ideal Test vs Your Test Comparison</p>

          {/* Toggle Comparison View */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{
                ...buttonStyle,
                padding: '15px 30px',
                fontSize: '16px',
                background: showComparison ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 255, 100, 0.3)'
              }}
            >
              {showComparison ? '← Back to Ideal Test' : 'View Test Comparisons →'}
            </button>
          </div>

          {!showComparison && (
            <>
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
            </>
          )}
        </header>

        {!showComparison ? (
          <>
            {/* IDEAL TEST - TEMPERATURE CHART */}
            <div style={chartContainerStyle}>
              <h2 style={chartTitleStyle}>
                🌡️ Ideal Test - Temperature Sensors
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

            {/* IDEAL TEST - PRESSURE CHART */}
            <div style={chartContainerStyle}>
              <h2 style={chartTitleStyle}>
                📊 Ideal Test - Pressure Over Time
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
          </>
        ) : (
          <ComparisonView
            idealData={idealData}
            yourTestData={yourTestData}
            samplingRate={samplingRate}
          />
        )}

        <footer style={{
          textAlign: 'center',
          color: 'white',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <p>Thermal Engineering Data - Ideal Test (32K points) vs Your Test Data (100-130 points each)</p>
        </footer>
      </div>
    </div>
  );
}

// Comparison View Component
function ComparisonView({ idealData, yourTestData, samplingRate }) {
  const comparisons = [
    { yourTest: 'Base Plate', idealSensor: 'Temp1', idealLabel: 'Top Plate', color: '#FF6B6B' },
    { yourTest: 'Solar Panel', idealSensor: 'Temp2', idealLabel: 'Solar Panel', color: '#4ECDC4' },
    { yourTest: 'Body', idealSensor: 'Temp3', idealLabel: 'Body (under MLI)', color: '#45B7D1' },
    { yourTest: 'Radiator', idealSensor: 'Temp4', idealLabel: 'Radiator Inside', color: '#FFA07A' },
  ];

  return (
    <div>
      {comparisons.map((comp, idx) => (
        <ComparisonChart
          key={idx}
          title={`${comp.yourTest} Comparison`}
          yourTestName={comp.yourTest}
          yourTestData={yourTestData[comp.yourTest]}
          idealData={idealData}
          idealSensor={comp.idealSensor}
          idealLabel={comp.idealLabel}
          color={comp.color}
          samplingRate={samplingRate}
        />
      ))}

      {/* Pressure Comparisons */}
      <ComparisonChart
        title="Pressure Chamber 8000 vs Ideal Pressure"
        yourTestName="Pressure Chamber 8000"
        yourTestData={yourTestData['Pressure Chamber 8000']}
        idealData={idealData}
        idealSensor="Pressure"
        idealLabel="Ideal Pressure"
        color="#E74C3C"
        samplingRate={samplingRate}
        isPressure={true}
      />

      <ComparisonChart
        title="Pressure Chamber 8150 vs Ideal Pressure"
        yourTestName="Pressure Chamber 8150"
        yourTestData={yourTestData['Pressure Chamber 8150']}
        idealData={idealData}
        idealSensor="Pressure"
        idealLabel="Ideal Pressure"
        color="#9B59B6"
        samplingRate={samplingRate}
        isPressure={true}
      />
    </div>
  );
}

// Individual Comparison Chart Component
function ComparisonChart({ title, yourTestName, yourTestData, idealData, idealSensor, idealLabel, color, samplingRate, isPressure = false }) {
  if (!yourTestData || !idealData) return null;

  const sampled = idealData.filter((_, i) => i % samplingRate === 0);

  // Your test data (convert Kelvin to Celsius for temperature)
  const yourData = yourTestData.data.map(row => ({
    time: row.Time,
    value: isPressure ? row['case0.sav'] : (row['case0.sav'] - 273.15)
  }));

  // Calculate statistics
  const yourValues = yourData.map(d => d.value);
  const idealValues = sampled.map(row => row[idealSensor]).filter(v => v != null);

  const yourStats = {
    min: Math.min(...yourValues).toFixed(2),
    max: Math.max(...yourValues).toFixed(2),
    mean: (yourValues.reduce((a,b) => a+b, 0) / yourValues.length).toFixed(2),
    range: (Math.max(...yourValues) - Math.min(...yourValues)).toFixed(2)
  };

  const idealStats = {
    min: Math.min(...idealValues).toFixed(2),
    max: Math.max(...idealValues).toFixed(2),
    mean: (idealValues.reduce((a,b) => a+b, 0) / idealValues.length).toFixed(2),
    range: (Math.max(...idealValues) - Math.min(...idealValues)).toFixed(2)
  };

  const deviation = Math.abs(parseFloat(yourStats.mean) - parseFloat(idealStats.mean)).toFixed(2);
  const deviationPercent = ((deviation / parseFloat(idealStats.mean)) * 100).toFixed(1);

  const traces = [
    {
      x: yourData.map(d => d.time),
      y: yourData.map(d => d.value),
      type: 'scatter',
      mode: 'lines+markers',
      name: `Your Test - ${yourTestName}`,
      line: { color: color, width: 3 },
      marker: { size: 6 }
    },
    {
      x: sampled.map((_, i) => i * 10 * samplingRate), // Convert to seconds
      y: sampled.map(row => row[idealSensor]),
      type: 'scatter',
      mode: 'lines',
      name: `Ideal Test - ${idealLabel}`,
      line: { color: '#888', width: 2, dash: 'dash' },
      opacity: 0.7
    }
  ];

  return (
    <div style={chartContainerStyle}>
      <h2 style={chartTitleStyle}>📊 {title}</h2>

      {/* Statistics Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ ...statCardStyle, background: 'rgba(100, 200, 255, 0.1)' }}>
          <h4 style={{ color: color }}>Your Test Mean</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{yourStats.mean}{isPressure ? ' mbar' : '°C'}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Range: {yourStats.range}</p>
        </div>
        <div style={{ ...statCardStyle, background: 'rgba(150, 150, 150, 0.1)' }}>
          <h4 style={{ color: '#888' }}>Ideal Test Mean</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{idealStats.mean}{isPressure ? ' mbar' : '°C'}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Range: {idealStats.range}</p>
        </div>
        <div style={{ ...statCardStyle, background: deviationPercent < 5 ? 'rgba(100, 255, 100, 0.1)' : 'rgba(255, 200, 100, 0.1)' }}>
          <h4>Deviation</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{deviation}{isPressure ? ' mbar' : '°C'}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>{deviationPercent}% difference</p>
        </div>
        <div style={statCardStyle}>
          <h4>Data Points</h4>
          <p style={{ fontSize: '16px' }}>Your: {yourData.length}</p>
          <p style={{ fontSize: '16px' }}>Ideal: {sampled.length}</p>
        </div>
      </div>

      <Plot
        data={traces}
        layout={{
          xaxis: { title: 'Time (seconds)' },
          yaxis: { title: isPressure ? 'Pressure (mbar)' : 'Temperature (°C)' },
          hovermode: 'closest',
          height: 600,
          margin: { l: 60, r: 40, t: 20, b: 60 },
          paper_bgcolor: 'rgba(255,255,255,0.95)',
          plot_bgcolor: 'rgba(255,255,255,0.95)',
          legend: { orientation: 'h', y: -0.15 }
        }}
        config={{ responsive: true }}
        style={{ width: '100%' }}
      />

      {/* Analysis Text */}
      <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px' }}>📈 Analysis:</h4>
        <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>Your test shows a mean of <strong>{yourStats.mean}{isPressure ? ' mbar' : '°C'}</strong> vs ideal's <strong>{idealStats.mean}{isPressure ? ' mbar' : '°C'}</strong></li>
          <li>Deviation of <strong>{deviationPercent}%</strong> {deviationPercent < 5 ? '✓ Excellent agreement' : deviationPercent < 10 ? '⚠ Acceptable deviation' : '⚠ Significant deviation - review test conditions'}</li>
          <li>Your data range ({yourStats.range}) vs Ideal range ({idealStats.range})</li>
        </ul>
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
  backdropFilter: 'blur(10px)',
  textAlign: 'center'
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
