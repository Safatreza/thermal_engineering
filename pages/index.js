import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tvacData, setTvacData] = useState(null);
  const [simData, setSimData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataScope, setDataScope] = useState(10); // Start with 10% for faster initial load
  const [activeView, setActiveView] = useState('tvac'); // 'tvac' or 'comparison'
  const [activeSection, setActiveSection] = useState('baseplates');

  // Load FULL RESOLUTION TVAC test data - no sampling for real thermal cycles
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
          setLoading(false);
        } else {
          console.error('No data in full CSV, trying moderate');
          loadModerateTvacData();
        }
      },
      error: (error) => {
        console.error('Error loading full TVAC data:', error);
        loadModerateTvacData();
      }
    });

    function loadModerateTvacData() {
      Papa.parse('/data_moderate.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('Fallback: Moderate TVAC data loaded:', result.data.length, 'rows');
          setTvacData(result.data);
          setLoading(false);
        },
        error: (err) => {
          console.error('Critical error loading TVAC data:', err);
          setLoading(false);
        }
      });
    }
  }, []);

  // Load simulation data lazily based on active section
  useEffect(() => {
    const sectionsMap = {
      baseplates: ['BASEPLATE_1105', 'BASEPLATE_1106', 'BASEPLATE_1109', 'BASEPLATE_1110'],
      solarpanels: ['SOLARPANNEL_BOTTOM_LEFT_2309', 'SOLARPANNEL_BOTTOM_LEFT_2310', 'SOLARPANNEL_BOTTOM_LEFT_2313', 'SOLARPANNEL_BOTTOM_LEFT_2314'],
      components: ['BODY_1254', 'RADIATOR_1300'],
      pressure: ['PRESSURECHAMBER_8000', 'PRESSURECHAMBER_8150']
    };

    const filesToLoad = sectionsMap[activeSection] || [];
    console.log('Loading section:', activeSection, 'Files:', filesToLoad);

    filesToLoad.forEach(fileName => {
      // Skip if already loaded
      if (simData[fileName]) {
        console.log('Already loaded:', fileName);
        return;
      }

      console.log('Loading simulation file:', fileName);
      Papa.parse(`/${fileName}.csv`, { // Files are in public/ root
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('Loaded', fileName, ':', result.data.length, 'rows');
          if (result.data && result.data.length > 0) {
            setSimData(prev => ({ ...prev, [fileName]: result.data }));
          }
        },
        error: (err) => {
          console.error('Error loading', fileName, ':', err);
        }
      });
    });

    if (loading && tvacData) {
      console.log('Data ready, hiding loading screen');
      setLoading(false);
    }
  }, [activeSection, tvacData, loading, simData]);

  // Memoize sampled data to prevent recalculation
  const sampleData = useMemo(() => {
    return (data, percentage) => {
      if (!data || percentage === 100) return data;
      const step = Math.floor(100 / percentage);
      return data.filter((_, index) => index % step === 0);
    };
  }, []);

  // Calculate statistics with validation
  const calculateStats = (simValues, tvacValues) => {
    const validSimValues = simValues.filter(v => v != null && !isNaN(v) && isFinite(v));
    const validTvacValues = tvacValues.filter(v => v != null && !isNaN(v) && isFinite(v));

    if (validSimValues.length === 0 || validTvacValues.length === 0) {
      return { simMean: 0, tvacMean: 0, deviation: 0 };
    }

    const simMean = validSimValues.reduce((a, b) => a + b, 0) / validSimValues.length;
    const tvacMean = validTvacValues.reduce((a, b) => a + b, 0) / validTvacValues.length;
    const deviation = Math.abs(((simMean - tvacMean) / tvacMean) * 100);
    return { simMean, tvacMean, deviation };
  };

  // Get validation status
  const getValidationStatus = (deviation) => {
    if (deviation < 5) return { symbol: '✓', color: '#10b981', label: 'Valid' };
    if (deviation < 10) return { symbol: '⚠', color: '#f59e0b', label: 'Acceptable' };
    return { symbol: '⚠', color: '#ef4444', label: 'Review' };
  };

  // Create TVAC-only chart (no comparison) - FULL RESOLUTION
  const createTvacChart = (columnName, title, unit = '°C') => {
    if (!tvacData) return null;

    // Use FULL data for TVAC charts - no sampling for real thermal cycles
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

    // Calculate statistics
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

  // Create comparison chart
  const createComparisonChart = (simName, simDataInput, tvacTempColumn, title) => {
    if (!tvacData || !simDataInput) return (
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280' }}>Loading {title}...</p>
      </div>
    );

    const sampledTvac = sampleData(tvacData, dataScope);
    const sampledSim = simDataInput; // Simulation data is small (101 points)

    // Extract TVAC data with validation
    const tvacDates = sampledTvac.map(row => row.Date).filter(d => d != null);
    const tvacTemps = sampledTvac.map(row => {
      const val = row[tvacTempColumn];
      return (val != null && !isNaN(val)) ? val : null;
    }).filter(t => t != null);

    // Extract simulation data - convert Kelvin to Celsius
    const simTimes = sampledSim.map(row => row.Time).filter(t => t != null);
    const simTemps = sampledSim.map(row => {
      const kelvin = row['case2.sav'];
      if (kelvin != null && !isNaN(kelvin)) {
        return kelvin - 273.15;
      }
      return null;
    }).filter(t => t != null);

    // Ensure we have data
    if (tvacDates.length === 0 || simTimes.length === 0 || tvacTemps.length === 0 || simTemps.length === 0) {
      return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ color: '#ef4444' }}>Error: No valid data for {title}</p>
        </div>
      );
    }

    // Calculate statistics
    const stats = calculateStats(
      simTemps.filter(v => v !== null),
      tvacTemps.filter(v => v !== null && !isNaN(v))
    );
    const validation = getValidationStatus(stats.deviation);

    return (
      <div key={simName} style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px' }}>
          <div>
            <strong>Simulation Mean:</strong> {stats.simMean.toFixed(2)}°C
          </div>
          <div>
            <strong>TVAC Mean:</strong> {stats.tvacMean.toFixed(2)}°C
          </div>
          <div>
            <strong>Deviation:</strong> {stats.deviation.toFixed(2)}%
          </div>
          <div style={{ color: validation.color, fontWeight: 'bold' }}>
            {validation.symbol} {validation.label}
          </div>
        </div>
        <Plot
          data={[
            {
              x: tvacDates,
              y: tvacTemps,
              type: 'scatter',
              mode: 'lines',
              name: 'TVAC Test',
              line: {
                color: '#3b82f6',
                width: 2,
                shape: 'linear'
              }
            },
            {
              x: simTimes,
              y: simTemps,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Simulation (101 pts)',
              line: {
                color: '#ef4444',
                width: 2.5,
                shape: 'spline',
                smoothing: 1.0
              },
              marker: {
                color: '#ef4444',
                size: 4,
                symbol: 'circle'
              }
            }
          ]}
          layout={{
            autosize: true,
            height: 400,
            margin: { t: 10, r: 10, b: 40, l: 50 },
            xaxis: {
              title: 'Time',
              showgrid: true,
              gridcolor: '#e5e7eb'
            },
            yaxis: {
              title: 'Temperature (°C)',
              showgrid: true,
              gridcolor: '#e5e7eb'
            },
            legend: { orientation: 'h', y: -0.2 },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified'
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  // Create pressure comparison chart
  const createPressureChart = (simName, simDataInput, title) => {
    if (!tvacData || !simDataInput) return (
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ color: '#6b7280' }}>Loading {title}...</p>
      </div>
    );

    const sampledTvac = sampleData(tvacData, dataScope);
    const sampledSim = simDataInput;

    // Extract TVAC pressure data with validation
    const tvacDates = sampledTvac.map(row => row.Date).filter(d => d != null);
    const tvacPressure = sampledTvac.map(row => {
      const val = row.Pressure;
      return (val != null && !isNaN(val)) ? val : null;
    }).filter(p => p != null);

    // Extract simulation pressure - convert Kelvin to Celsius
    const simTimes = sampledSim.map(row => row.Time).filter(t => t != null);
    const simTemps = sampledSim.map(row => {
      const kelvin = row['case2.sav'];
      if (kelvin != null && !isNaN(kelvin)) {
        return kelvin - 273.15;
      }
      return null;
    }).filter(t => t != null);

    // Ensure we have data
    if (tvacDates.length === 0 || simTimes.length === 0 || tvacPressure.length === 0 || simTemps.length === 0) {
      return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ color: '#ef4444' }}>Error: No valid data for {title}</p>
        </div>
      );
    }

    // For pressure chambers, we'll compare temperature profiles
    const stats = calculateStats(
      simTemps.filter(v => v !== null),
      tvacPressure.filter(v => v !== null && !isNaN(v))
    );
    const validation = getValidationStatus(stats.deviation);

    return (
      <div key={simName} style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px' }}>
          <div>
            <strong>Simulation Mean:</strong> {stats.simMean.toFixed(2)}
          </div>
          <div>
            <strong>TVAC Mean:</strong> {stats.tvacMean.toFixed(2)} mbar
          </div>
          <div>
            <strong>Deviation:</strong> {stats.deviation.toFixed(2)}%
          </div>
          <div style={{ color: validation.color, fontWeight: 'bold' }}>
            {validation.symbol} {validation.label}
          </div>
        </div>
        <Plot
          data={[
            {
              x: tvacDates,
              y: tvacPressure,
              type: 'scatter',
              mode: 'lines',
              name: 'TVAC Pressure',
              line: {
                color: '#3b82f6',
                width: 2,
                shape: 'linear'
              }
            },
            {
              x: simTimes,
              y: simTemps,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Simulation Temp (101 pts)',
              line: {
                color: '#ef4444',
                width: 2.5,
                shape: 'spline',
                smoothing: 1.0
              },
              marker: {
                color: '#ef4444',
                size: 4
              },
              yaxis: 'y2'
            }
          ]}
          layout={{
            autosize: true,
            height: 400,
            margin: { t: 10, r: 50, b: 40, l: 50 },
            xaxis: {
              title: 'Time',
              showgrid: true,
              gridcolor: '#e5e7eb'
            },
            yaxis: {
              title: 'Pressure (mbar)',
              showgrid: true,
              gridcolor: '#e5e7eb'
            },
            yaxis2: {
              title: 'Temp (°C)',
              overlaying: 'y',
              side: 'right',
              showgrid: false
            },
            legend: { orientation: 'h', y: -0.2 },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified'
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'url(/background.jfif) center/cover',
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
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Temperature Sensors</h2>
          {createTvacChart('Temp1', 'Top Plate (Temp1)')}
          {createTvacChart('Temp2', 'Solar Panel (Temp2)')}
          {createTvacChart('Temp3', 'Body under MLI (Temp3)')}
          {createTvacChart('Temp4', 'Radiator Inside (Temp4)')}
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

  const renderComparisonSection = () => {
    switch(activeSection) {
      case 'baseplates':
        return (
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Base Plate Variants</h2>
            {createComparisonChart('BASEPLATE_1105', simData.BASEPLATE_1105, 'Temp1', 'Base Plate 1105 vs TVAC Top Plate')}
            {createComparisonChart('BASEPLATE_1106', simData.BASEPLATE_1106, 'Temp1', 'Base Plate 1106 vs TVAC Top Plate')}
            {createComparisonChart('BASEPLATE_1109', simData.BASEPLATE_1109, 'Temp1', 'Base Plate 1109 vs TVAC Top Plate')}
            {createComparisonChart('BASEPLATE_1110', simData.BASEPLATE_1110, 'Temp1', 'Base Plate 1110 vs TVAC Top Plate')}
          </div>
        );
      case 'solarpanels':
        return (
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Solar Panel Variants</h2>
            {createComparisonChart('SOLARPANNEL_2309', simData.SOLARPANNEL_BOTTOM_LEFT_2309, 'Temp2', 'Solar Panel 2309 vs TVAC Solar Panel')}
            {createComparisonChart('SOLARPANNEL_2310', simData.SOLARPANNEL_BOTTOM_LEFT_2310, 'Temp2', 'Solar Panel 2310 vs TVAC Solar Panel')}
            {createComparisonChart('SOLARPANNEL_2313', simData.SOLARPANNEL_BOTTOM_LEFT_2313, 'Temp2', 'Solar Panel 2313 vs TVAC Solar Panel')}
            {createComparisonChart('SOLARPANNEL_2314', simData.SOLARPANNEL_BOTTOM_LEFT_2314, 'Temp2', 'Solar Panel 2314 vs TVAC Solar Panel')}
          </div>
        );
      case 'components':
        return (
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Other Components</h2>
            {createComparisonChart('BODY_1254', simData.BODY_1254, 'Temp3', 'Body 1254 vs TVAC Body (under MLI)')}
            {createComparisonChart('RADIATOR_1300', simData.RADIATOR_1300, 'Temp4', 'Radiator 1300 vs TVAC Radiator Inside')}
          </div>
        );
      case 'pressure':
        return (
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Pressure Chamber Variants</h2>
            {createPressureChart('PRESSURECHAMBER_8000', simData.PRESSURECHAMBER_8000, 'Pressure Chamber 8000 vs TVAC Pressure')}
            {createPressureChart('PRESSURECHAMBER_8150', simData.PRESSURECHAMBER_8150, 'Pressure Chamber 8150 vs TVAC Pressure')}
          </div>
        );
      default:
        return null;
    }
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
            {activeView === 'tvac' ? 'TVAC Test Data Analysis' : 'Thermal Desktop Simulation Comparison'}
          </p>

          {/* View Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
              onClick={() => setActiveView('comparison')}
              style={{
                padding: '12px 24px',
                background: activeView === 'comparison' ? '#2563eb' : '#e5e7eb',
                color: activeView === 'comparison' ? '#fff' : '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Simulation Comparison
            </button>
          </div>

          {/* Comparison Section Tabs - only show in comparison view */}
          {activeView === 'comparison' && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { key: 'baseplates', label: 'Base Plates (4)' },
                { key: 'solarpanels', label: 'Solar Panels (4)' },
                { key: 'components', label: 'Components (2)' },
                { key: 'pressure', label: 'Pressure (2)' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  style={{
                    padding: '10px 20px',
                    background: activeSection === key ? '#3b82f6' : '#e5e7eb',
                    color: activeSection === key ? '#fff' : '#1f2937',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: activeSection === key ? 'bold' : 'normal'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Data Scope Control */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ color: '#1f2937', marginRight: '10px' }}>
              TVAC Data Detail: {dataScope}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={dataScope}
              onChange={(e) => setDataScope(parseInt(e.target.value))}
              style={{ width: '300px' }}
            />
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6b7280' }}>
              ({dataScope === 10 ? 'Fast' : dataScope === 50 ? 'Balanced' : 'Detailed'})
            </span>
          </div>
        </div>

        {/* Active View */}
        {activeView === 'tvac' ? renderTvacView() : renderComparisonSection()}
      </div>
    </div>
  );
}
