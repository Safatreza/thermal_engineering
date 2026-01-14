import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tvacData, setTvacData] = useState(null);
  const [simData, setSimData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('tvac'); // 'tvac', 'simulation', 'comparison', or 'overlay'

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
  const createSimChart = (fileName, title, unit = '°C', color = '#ef4444') => {
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

    // Convert time from seconds to hours for better readability
    const timesInHours = times.map(t => t / 3600);

    return (
      <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px', flexWrap: 'wrap' }}>
          <div><strong>Mean:</strong> {mean.toFixed(2)}{unit}</div>
          <div><strong>Min:</strong> {min.toFixed(2)}{unit}</div>
          <div><strong>Max:</strong> {max.toFixed(2)}{unit}</div>
          <div><strong>Range:</strong> {(max - min).toFixed(2)}{unit}</div>
          <div><strong>Start:</strong> {temps[0].toFixed(2)}{unit}</div>
          <div><strong>End:</strong> {temps[temps.length - 1].toFixed(2)}{unit}</div>
          <div style={{ color: '#6b7280' }}><strong>Points:</strong> {temps.length}</div>
        </div>
        <Plot
          data={[{
            x: timesInHours,
            y: temps,
            type: 'scatter',
            mode: 'lines+markers',
            name: title,
            line: {
              color: color,
              width: 2.5,
              shape: 'linear'  // Changed from spline to linear to show actual data points
            },
            marker: {
              color: color,
              size: 5,
              symbol: 'circle'
            }
          }]}
          layout={{
            autosize: true,
            height: 450,
            margin: { t: 10, r: 10, b: 40, l: 60 },
            xaxis: {
              title: 'Time (hours)',
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
          <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Base Plate Simulations</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Note: All 4 baseplate variants show nearly identical thermal profiles (within 0.02°C).
            Mean temp ~82.4°C, ranging from 20°C to 112.4°C over 48 hours.
          </p>
          {createSimChart('BASEPLATE_1105', 'Base Plate 1105', '°C', '#dc2626')}
          {createSimChart('BASEPLATE_1106', 'Base Plate 1106', '°C', '#ea580c')}
          {createSimChart('BASEPLATE_1109', 'Base Plate 1109', '°C', '#f59e0b')}
          {createSimChart('BASEPLATE_1110', 'Base Plate 1110', '°C', '#f97316')}
        </div>

        {/* Solar Panels */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Solar Panel Simulations</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Solar panel variants show slight differences (0.5-1.5°C variation in mean temperatures).
            Mean temps range from 74-75.5°C, all starting at 20°C and reaching peaks of 104-105°C.
          </p>
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2309', 'Solar Panel 2309', '°C', '#16a34a')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2310', 'Solar Panel 2310', '°C', '#059669')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2313', 'Solar Panel 2313', '°C', '#0891b2')}
          {createSimChart('SOLARPANNEL_BOTTOM_LEFT_2314', 'Solar Panel 2314', '°C', '#0284c7')}
        </div>

        {/* Components */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Component Simulations</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Body (MLI-protected) shows cooler profile (65°C mean, max 99°C) vs Radiator (81°C mean, max 111°C).
            Radiator reaches similar peak temperatures to baseplates.
          </p>
          {createSimChart('BODY_1254', 'Body 1254 (under MLI)', '°C', '#7c3aed')}
          {createSimChart('RADIATOR_1300', 'Radiator 1300', '°C', '#c026d3')}
        </div>

        {/* Pressure Chambers */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Pressure Chamber Simulations</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Both pressure chamber variants are IDENTICAL: Mean 38.6°C with thermal cycling between -20°C and +80°C.
            This represents the TVAC chamber wall temperature profile during testing.
          </p>
          {createSimChart('PRESSURECHAMBER_8000', 'Pressure Chamber 8000', '°C', '#0f766e')}
          {createSimChart('PRESSURECHAMBER_8150', 'Pressure Chamber 8150', '°C', '#0d9488')}
        </div>
      </>
    );
  };

  // Render comparison view with analytical summary
  const renderComparisonView = () => {
    if (!tvacData || Object.keys(simData).length === 0) {
      return (
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#1f2937' }}>Loading comparison data...</h2>
        </div>
      );
    }

    // Calculate TVAC statistics
    const tvacStats = {
      temp1: { data: tvacData.map(r => r.Temp1).filter(v => v != null), name: 'Top Plate (BASEPLATE_1106)' },
      temp2: { data: tvacData.map(r => r.Temp2).filter(v => v != null), name: 'Solar Panel (SOLARPANNEL_2309)' },
      temp3: { data: tvacData.map(r => r.Temp3).filter(v => v != null), name: 'Body under MLI (BODY_1254)' },
      temp4: { data: tvacData.map(r => r.Temp4).filter(v => v != null), name: 'Radiator (RADIATOR_1300)' }
    };

    // Calculate simulation statistics
    const getSimStats = (fileName) => {
      const data = simData[fileName];
      if (!data) return null;
      const temps = data.map(row => row['case2.sav'] - 273.15).filter(t => t != null);
      return {
        mean: temps.reduce((a, b) => a + b, 0) / temps.length,
        min: Math.min(...temps),
        max: Math.max(...temps)
      };
    };

    const simStats = {
      baseplate: getSimStats('BASEPLATE_1106'),
      solarpanel: getSimStats('SOLARPANNEL_BOTTOM_LEFT_2309'),
      body: getSimStats('BODY_1254'),
      radiator: getSimStats('RADIATOR_1300')
    };

    // Calculate comparisons
    const calculateComparison = (tvacArr, simStat) => {
      if (!simStat) return null;
      const tvacMean = tvacArr.reduce((a, b) => a + b, 0) / tvacArr.length;
      const tvacMin = Math.min(...tvacArr);
      const tvacMax = Math.max(...tvacArr);

      return {
        tvacMean: tvacMean.toFixed(2),
        simMean: simStat.mean.toFixed(2),
        tvacMin: tvacMin.toFixed(2),
        simMin: simStat.min.toFixed(2),
        tvacMax: tvacMax.toFixed(2),
        simMax: simStat.max.toFixed(2),
        meanDeviation: Math.abs(((simStat.mean - tvacMean) / tvacMean) * 100).toFixed(1),
        meanDiff: (simStat.mean - tvacMean).toFixed(2)
      };
    };

    const comparisons = {
      baseplate: calculateComparison(tvacStats.temp1.data, simStats.baseplate),
      solarpanel: calculateComparison(tvacStats.temp2.data, simStats.solarpanel),
      body: calculateComparison(tvacStats.temp3.data, simStats.body),
      radiator: calculateComparison(tvacStats.temp4.data, simStats.radiator)
    };

    const getStatusColor = (deviation) => {
      const dev = parseFloat(deviation);
      if (dev < 5) return '#10b981';
      if (dev < 10) return '#f59e0b';
      return '#ef4444';
    };

    const getStatusLabel = (deviation) => {
      const dev = parseFloat(deviation);
      if (dev < 5) return 'Valid (<5%)';
      if (dev < 10) return 'Acceptable (5-10%)';
      return 'Review (>10%)';
    };

    return (
      <>
        {/* Summary Overview */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Analytical Comparison Summary</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            This analysis compares TVAC test measurements (32,448 points over 3.76 days) with Thermal Desktop simulation predictions
            (101 points over 48 hours). Deviations indicate how well the thermal model matches actual hardware performance.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(comparisons).map(([key, comp]) => {
              if (!comp) return null;
              const status = getStatusLabel(comp.meanDeviation);
              const color = getStatusColor(comp.meanDeviation);

              return (
                <div key={key} style={{
                  background: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: `3px solid ${color}`
                }}>
                  <h3 style={{ color: '#1f2937', fontSize: '16px', marginBottom: '10px' }}>
                    {key === 'baseplate' && 'Top Plate / Baseplate'}
                    {key === 'solarpanel' && 'Solar Panel'}
                    {key === 'body' && 'Body (under MLI)'}
                    {key === 'radiator' && 'Radiator'}
                  </h3>
                  <div style={{
                    background: color,
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    {status}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Mean Deviation:</span>
                      <span style={{ color: color, fontWeight: 'bold' }}>{comp.meanDeviation}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Temperature Diff:</span>
                      <span style={{ fontWeight: 'bold' }}>{comp.meanDiff}°C</span>
                    </div>
                    <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#6b7280' }}>TVAC Mean:</span>
                      <span>{comp.tvacMean}°C</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#6b7280' }}>Sim Mean:</span>
                      <span>{comp.simMean}°C</span>
                    </div>
                    <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#6b7280' }}>TVAC Range:</span>
                      <span>{comp.tvacMin}°C to {comp.tvacMax}°C</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Sim Range:</span>
                      <span>{comp.simMin}°C to {comp.simMax}°C</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Analysis */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Detailed Component Analysis</h2>

          {/* Top Plate / Baseplate */}
          {comparisons.baseplate && (
            <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>1. Top Plate / Baseplate 1106</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <strong>Mean Temperature Comparison:</strong> TVAC measured {comparisons.baseplate.tvacMean}°C average,
                while simulation predicted {comparisons.baseplate.simMean}°C (difference: {comparisons.baseplate.meanDiff}°C,
                deviation: {comparisons.baseplate.meanDeviation}%).
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Analysis:</strong> {parseFloat(comparisons.baseplate.meanDeviation) < 5 ?
                  'Excellent agreement! Thermal model accurately represents baseplate thermal behavior.' :
                  parseFloat(comparisons.baseplate.meanDeviation) < 10 ?
                  'Acceptable agreement. Minor refinement of thermal properties recommended.' :
                  'Significant deviation detected. Review thermal desktop assumptions: contact conductances, material properties, or boundary conditions.'}
              </p>
            </div>
          )}

          {/* Solar Panel */}
          {comparisons.solarpanel && (
            <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>2. Solar Panel 2309</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <strong>Mean Temperature Comparison:</strong> TVAC measured {comparisons.solarpanel.tvacMean}°C average,
                while simulation predicted {comparisons.solarpanel.simMean}°C (difference: {comparisons.solarpanel.meanDiff}°C,
                deviation: {comparisons.solarpanel.meanDeviation}%).
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Analysis:</strong> {parseFloat(comparisons.solarpanel.meanDeviation) < 5 ?
                  'Excellent agreement! Solar panel thermal model is well-calibrated.' :
                  parseFloat(comparisons.solarpanel.meanDeviation) < 10 ?
                  'Acceptable agreement. Consider refining solar absorptivity/emissivity values.' :
                  'Significant deviation. Solar panels show highest variability - review optical properties, mounting interfaces, and solar flux assumptions.'}
              </p>
            </div>
          )}

          {/* Body under MLI */}
          {comparisons.body && (
            <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>3. Body under MLI (1254)</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <strong>Mean Temperature Comparison:</strong> TVAC measured {comparisons.body.tvacMean}°C average,
                while simulation predicted {comparisons.body.simMean}°C (difference: {comparisons.body.meanDiff}°C,
                deviation: {comparisons.body.meanDeviation}%).
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Analysis:</strong> {parseFloat(comparisons.body.meanDeviation) < 5 ?
                  'Excellent agreement! MLI insulation model is accurate.' :
                  parseFloat(comparisons.body.meanDeviation) < 10 ?
                  'Acceptable agreement. MLI performance within expected tolerances.' :
                  'MLI-protected body shows deviation - verify MLI layer count, effective emissivity, and internal heat generation assumptions.'}
              </p>
            </div>
          )}

          {/* Radiator */}
          {comparisons.radiator && (
            <div style={{ marginBottom: '0' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>4. Radiator 1300</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <strong>Mean Temperature Comparison:</strong> TVAC measured {comparisons.radiator.tvacMean}°C average,
                while simulation predicted {comparisons.radiator.simMean}°C (difference: {comparisons.radiator.meanDiff}°C,
                deviation: {comparisons.radiator.meanDeviation}%).
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Analysis:</strong> {parseFloat(comparisons.radiator.meanDeviation) < 5 ?
                  'Excellent agreement! Radiator thermal rejection model is validated.' :
                  parseFloat(comparisons.radiator.meanDeviation) < 10 ?
                  'Acceptable agreement. Radiator performing within expected range.' :
                  'Radiator shows deviation - review surface finish, view factors to space, and conductive coupling to hot components.'}
              </p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ marginBottom: '20px' }}>Recommendations for Thermal Model Improvement</h2>
          <ul style={{ lineHeight: '1.8', fontSize: '15px' }}>
            <li><strong>High Priority:</strong> Components with &gt;10% deviation require immediate attention to thermal desktop assumptions</li>
            <li><strong>Material Properties:</strong> Verify thermal conductivities, specific heats, and densities match as-built hardware</li>
            <li><strong>Contact Conductances:</strong> Review all mechanical interfaces -bolted joints typically range 500-5000 W/m²K</li>
            <li><strong>Optical Properties:</strong> Confirm solar absorptivity (α) and infrared emissivity (ε) match actual surface finishes</li>
            <li><strong>Boundary Conditions:</strong> Validate TVAC shroud temperatures, solar flux, and internal heat dissipation rates</li>
            <li><strong>MLI Performance:</strong> Effective emissivity should be 0.03-0.05 for well-installed multi-layer insulation</li>
            <li><strong>Transient Response:</strong> Large temperature swings suggest reviewing thermal mass and time constants</li>
          </ul>
        </div>
      </>
    );
  };

  // Render overlay comparison view - both datasets on same timeline
  const renderOverlayView = () => {
    if (!tvacData || Object.keys(simData).length === 0) {
      return (
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#1f2937' }}>Loading overlay comparison data...</h2>
        </div>
      );
    }

    // Create overlay chart for a component
    const createOverlayChart = (tvacColumn, simFileName, title) => {
      const simFile = simData[simFileName];
      if (!simFile) return null;

      // Get first 48 hours of TVAC data (17,280 points)
      const hours48 = 48 * 3600; // 48 hours in seconds
      const points48h = Math.floor(hours48 / 10); // TVAC samples every 10 seconds
      const tvac48h = tvacData.slice(0, points48h);

      // Extract TVAC data - convert to time in hours from start
      const tvacTimes = tvac48h.map((_, idx) => (idx * 10) / 3600); // Convert to hours
      const tvacTemps = tvac48h.map(row => row[tvacColumn]).filter(t => t != null);

      // Extract simulation data - convert to hours and Kelvin to Celsius
      const simTimes = simFile.map(row => row.Time / 3600).filter(t => t != null); // Convert to hours
      const simTemps = simFile.map(row => {
        const kelvin = row['case2.sav'];
        return (kelvin != null && !isNaN(kelvin)) ? kelvin - 273.15 : null;
      }).filter(t => t != null);

      if (tvacTimes.length === 0 || simTimes.length === 0) {
        return (
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px', marginBottom: '20px' }}>
            <p style={{ color: '#ef4444' }}>Error: No valid data for {title}</p>
          </div>
        );
      }

      // Calculate statistics
      const tvacMean = tvacTemps.reduce((a, b) => a + b, 0) / tvacTemps.length;
      const simMean = simTemps.reduce((a, b) => a + b, 0) / simTemps.length;
      const deviation = Math.abs(((simMean - tvacMean) / tvacMean) * 100);

      const getStatusColor = () => {
        if (deviation < 5) return '#10b981';
        if (deviation < 10) return '#f59e0b';
        return '#ef4444';
      };

      const getStatusLabel = () => {
        if (deviation < 5) return 'Valid (<5%)';
        if (deviation < 10) return 'Acceptable (5-10%)';
        return 'Review (>10%)';
      };

      return (
        <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ color: '#1f2937', margin: 0 }}>{title}</h3>
            <div style={{
              background: getStatusColor(),
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {getStatusLabel()} - {deviation.toFixed(1)}% Deviation
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', fontSize: '14px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: '#3b82f6' }}>TVAC Mean:</strong> {tvacMean.toFixed(2)}°C
              <span style={{ color: '#6b7280', marginLeft: '10px' }}>({tvacTemps.length.toLocaleString()} points)</span>
            </div>
            <div>
              <strong style={{ color: '#ef4444' }}>Simulation Mean:</strong> {simMean.toFixed(2)}°C
              <span style={{ color: '#6b7280', marginLeft: '10px' }}>({simTemps.length} points)</span>
            </div>
            <div>
              <strong>Difference:</strong> {(simMean - tvacMean).toFixed(2)}°C
            </div>
          </div>

          <Plot
            data={[
              {
                x: tvacTimes,
                y: tvacTemps,
                type: 'scatter',
                mode: 'lines',
                name: 'TVAC Test (Actual)',
                line: {
                  color: '#3b82f6',
                  width: 2
                }
              },
              {
                x: simTimes,
                y: simTemps,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Simulation (Predicted)',
                line: {
                  color: '#ef4444',
                  width: 2.5,
                  dash: 'dot'
                },
                marker: {
                  color: '#ef4444',
                  size: 6,
                  symbol: 'circle'
                }
              }
            ]}
            layout={{
              autosize: true,
              height: 500,
              margin: { t: 10, r: 10, b: 60, l: 60 },
              xaxis: {
                title: 'Time (hours) - First 48 Hours of Test',
                showgrid: true,
                gridcolor: '#e5e7eb',
                gridwidth: 1,
                range: [0, 48]
              },
              yaxis: {
                title: 'Temperature (°C)',
                showgrid: true,
                gridcolor: '#e5e7eb',
                gridwidth: 1
              },
              plot_bgcolor: '#f9fafb',
              paper_bgcolor: 'transparent',
              hovermode: 'x unified',
              legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: '#e5e7eb',
                borderwidth: 1
              }
            }}
            config={{ responsive: true, displayModeBar: true }}
            style={{ width: '100%' }}
          />
        </div>
      );
    };

    return (
      <>
        {/* Info Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>Time-Aligned Overlay Comparison</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '15px' }}>
            This view overlays TVAC test measurements with simulation predictions on the same timeline.
            <strong> Blue lines show actual TVAC test data</strong> (17,280 points over first 48 hours),
            while <strong>red dotted lines show simulation predictions</strong> (101 points over 48 hours).
          </p>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6' }}>
            Both datasets are aligned to start at time zero and span exactly 48 hours, allowing direct
            visual comparison of thermal behavior. Deviations between curves indicate model accuracy.
          </p>
        </div>

        {/* Overlay Charts */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Component Comparisons (48-Hour Window)</h2>
          {createOverlayChart('Temp1', 'BASEPLATE_1106', '1. Top Plate / Baseplate 1106')}
          {createOverlayChart('Temp2', 'SOLARPANNEL_BOTTOM_LEFT_2309', '2. Solar Panel 2309')}
          {createOverlayChart('Temp3', 'BODY_1254', '3. Body under MLI (1254)')}
          {createOverlayChart('Temp4', 'RADIATOR_1300', '4. Radiator 1300')}
        </div>

        {/* Key Insights */}
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '30px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ marginBottom: '20px' }}>Key Insights from Overlay Analysis</h2>
          <ul style={{ lineHeight: '1.8', fontSize: '15px' }}>
            <li><strong>Curve Shape:</strong> Compare thermal cycling patterns - do simulation and test follow similar heating/cooling profiles?</li>
            <li><strong>Peak Temperatures:</strong> Check if maximum temperatures align between test and simulation</li>
            <li><strong>Transient Response:</strong> Observe how quickly components heat up and cool down - simulation should match test dynamics</li>
            <li><strong>Steady-State Behavior:</strong> Look for plateaus where temperatures stabilize - verify thermal equilibrium matches</li>
            <li><strong>Phase Alignment:</strong> Hot and cold phases should occur at the same times in both datasets</li>
            <li><strong>Deviation Patterns:</strong> Consistent offset suggests systematic error (material properties), while shape differences indicate dynamic modeling issues (thermal mass, contact resistance)</li>
          </ul>
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
            {activeView === 'tvac' ? 'TVAC Test Data Analysis (32,448 points)' :
             activeView === 'simulation' ? 'Thermal Desktop Simulation Results (101 points each)' :
             activeView === 'comparison' ? 'Comparative Analysis: TVAC vs Simulation' :
             'Time-Aligned Overlay: Test vs Prediction'}
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
              Comparison & Analysis
            </button>
            <button
              onClick={() => setActiveView('overlay')}
              style={{
                padding: '12px 24px',
                background: activeView === 'overlay' ? '#2563eb' : '#e5e7eb',
                color: activeView === 'overlay' ? '#fff' : '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Overlay Graphs
            </button>
          </div>
        </div>

        {/* Active View */}
        {activeView === 'tvac' ? renderTvacView() :
         activeView === 'simulation' ? renderSimulationView() :
         activeView === 'comparison' ? renderComparisonView() :
         renderOverlayView()}
      </div>
    </div>
  );
}
