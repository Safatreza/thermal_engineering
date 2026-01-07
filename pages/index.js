import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Home() {
  const [tvacData, setTvacData] = useState(null);
  const [simData, setSimData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataScope, setDataScope] = useState(100);

  // Load TVAC test data
  useEffect(() => {
    Papa.parse('/20251211_LPE_CC_Data_Export.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setTvacData(result.data);
      }
    });
  }, []);

  // Load all test_2 simulation variants
  useEffect(() => {
    const simFiles = [
      'BASEPLATE_1105', 'BASEPLATE_1106', 'BASEPLATE_1109', 'BASEPLATE_1110',
      'SOLARPANNEL_BOTTOM_LEFT_2309', 'SOLARPANNEL_BOTTOM_LEFT_2310',
      'SOLARPANNEL_BOTTOM_LEFT_2313', 'SOLARPANNEL_BOTTOM_LEFT_2314',
      'BODY_1254', 'RADIATOR_1300',
      'PRESSURECHAMBER_8000', 'PRESSURECHAMBER_8150'
    ];

    const loadPromises = simFiles.map(fileName =>
      new Promise((resolve) => {
        Papa.parse(`/test_2/${fileName}.csv`, {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: (result) => {
            resolve({ name: fileName, data: result.data });
          }
        });
      })
    );

    Promise.all(loadPromises).then(results => {
      const dataObj = {};
      results.forEach(({ name, data }) => {
        dataObj[name] = data;
      });
      setSimData(dataObj);
      setLoading(false);
    });
  }, []);

  // Apply data scope sampling
  const sampleData = (data, percentage) => {
    if (!data || percentage === 100) return data;
    const step = Math.floor(100 / percentage);
    return data.filter((_, index) => index % step === 0);
  };

  // Calculate statistics
  const calculateStats = (simValues, tvacValues) => {
    const simMean = simValues.reduce((a, b) => a + b, 0) / simValues.length;
    const tvacMean = tvacValues.reduce((a, b) => a + b, 0) / tvacValues.length;
    const deviation = Math.abs(((simMean - tvacMean) / tvacMean) * 100);
    return { simMean, tvacMean, deviation };
  };

  // Get validation status
  const getValidationStatus = (deviation) => {
    if (deviation < 5) return { symbol: '✓', color: '#10b981', label: 'Valid' };
    if (deviation < 10) return { symbol: '⚠', color: '#f59e0b', label: 'Acceptable' };
    return { symbol: '⚠', color: '#ef4444', label: 'Review' };
  };

  // Create comparison chart
  const createComparisonChart = (simName, simData, tvacTempColumn, title) => {
    if (!tvacData || !simData) return null;

    const sampledTvac = sampleData(tvacData, dataScope);
    const sampledSim = sampleData(simData, 100); // Use all simulation data (101 points)

    // Extract TVAC data
    const tvacDates = sampledTvac.map(row => row.Date);
    const tvacTemps = sampledTvac.map(row => row[tvacTempColumn]);

    // Extract simulation data - convert Kelvin to Celsius
    const simTimes = sampledSim.map(row => row.Time);
    const simTemps = sampledSim.map(row => row['case2.sav'] ? row['case2.sav'] - 273.15 : null);

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
              line: { color: '#3b82f6', width: 2 }
            },
            {
              x: simTimes,
              y: simTemps,
              type: 'scatter',
              mode: 'lines',
              name: 'Thermal Desktop Simulation',
              line: { color: '#ef4444', width: 2, dash: 'dash' }
            }
          ]}
          layout={{
            autosize: true,
            height: 400,
            margin: { t: 20, r: 20, b: 40, l: 50 },
            xaxis: { title: 'Time' },
            yaxis: { title: 'Temperature (°C)' },
            legend: { orientation: 'h', y: -0.15 },
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'transparent'
          }}
          config={{ responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  // Create pressure comparison chart
  const createPressureChart = (simName, simData, title) => {
    if (!tvacData || !simData) return null;

    const sampledTvac = sampleData(tvacData, dataScope);
    const sampledSim = sampleData(simData, 100);

    // Extract TVAC pressure data
    const tvacDates = sampledTvac.map(row => row.Date);
    const tvacPressure = sampledTvac.map(row => row.Pressure);

    // Extract simulation pressure - convert Kelvin to Celsius (treating as temperature proxy)
    const simTimes = sampledSim.map(row => row.Time);
    const simTemps = sampledSim.map(row => row['case2.sav'] ? row['case2.sav'] - 273.15 : null);

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
              name: 'TVAC Test Pressure',
              line: { color: '#3b82f6', width: 2 }
            },
            {
              x: simTimes,
              y: simTemps,
              type: 'scatter',
              mode: 'lines',
              name: 'Simulation Temperature',
              line: { color: '#ef4444', width: 2, dash: 'dash' },
              yaxis: 'y2'
            }
          ]}
          layout={{
            autosize: true,
            height: 400,
            margin: { t: 20, r: 50, b: 40, l: 50 },
            xaxis: { title: 'Time' },
            yaxis: { title: 'Pressure (mbar)' },
            yaxis2: {
              title: 'Temperature (°C)',
              overlaying: 'y',
              side: 'right'
            },
            legend: { orientation: 'h', y: -0.15 },
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'transparent'
          }}
          config={{ responsive: true }}
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
            Comparing Thermal Desktop simulation results with TVAC test data
          </p>

          {/* Data Scope Control */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ color: '#1f2937', marginRight: '10px' }}>
              TVAC Data Scope: {dataScope}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={dataScope}
              onChange={(e) => setDataScope(parseInt(e.target.value))}
              style={{ width: '300px' }}
            />
          </div>
        </div>

        {/* Base Plates Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Base Plate Variants</h2>
          {createComparisonChart('BASEPLATE_1105', simData.BASEPLATE_1105, 'Temp1', 'Base Plate 1105 vs TVAC Top Plate')}
          {createComparisonChart('BASEPLATE_1106', simData.BASEPLATE_1106, 'Temp1', 'Base Plate 1106 vs TVAC Top Plate')}
          {createComparisonChart('BASEPLATE_1109', simData.BASEPLATE_1109, 'Temp1', 'Base Plate 1109 vs TVAC Top Plate')}
          {createComparisonChart('BASEPLATE_1110', simData.BASEPLATE_1110, 'Temp1', 'Base Plate 1110 vs TVAC Top Plate')}
        </div>

        {/* Solar Panels Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Solar Panel Variants</h2>
          {createComparisonChart('SOLARPANNEL_2309', simData.SOLARPANNEL_BOTTOM_LEFT_2309, 'Temp2', 'Solar Panel 2309 vs TVAC Solar Panel')}
          {createComparisonChart('SOLARPANNEL_2310', simData.SOLARPANNEL_BOTTOM_LEFT_2310, 'Temp2', 'Solar Panel 2310 vs TVAC Solar Panel')}
          {createComparisonChart('SOLARPANNEL_2313', simData.SOLARPANNEL_BOTTOM_LEFT_2313, 'Temp2', 'Solar Panel 2313 vs TVAC Solar Panel')}
          {createComparisonChart('SOLARPANNEL_2314', simData.SOLARPANNEL_BOTTOM_LEFT_2314, 'Temp2', 'Solar Panel 2314 vs TVAC Solar Panel')}
        </div>

        {/* Other Components Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Other Components</h2>
          {createComparisonChart('BODY_1254', simData.BODY_1254, 'Temp3', 'Body 1254 vs TVAC Body (under MLI)')}
          {createComparisonChart('RADIATOR_1300', simData.RADIATOR_1300, 'Temp4', 'Radiator 1300 vs TVAC Radiator Inside')}
        </div>

        {/* Pressure Chamber Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Pressure Chamber Variants</h2>
          {createPressureChart('PRESSURECHAMBER_8000', simData.PRESSURECHAMBER_8000, 'Pressure Chamber 8000 vs TVAC Pressure')}
          {createPressureChart('PRESSURECHAMBER_8150', simData.PRESSURECHAMBER_8150, 'Pressure Chamber 8150 vs TVAC Pressure')}
        </div>
      </div>
    </div>
  );
}
