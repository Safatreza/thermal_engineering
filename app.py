from flask import Flask, render_template
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.utils
import json

app = Flask(__name__)

@app.route('/')
def index():
    # Read the CSV file
    df = pd.read_csv('20251211_LPE_CC_Data_Export.csv')

    # Convert Date column to datetime
    df['Date'] = pd.to_datetime(df['Date'])

    # Create first figure: Date vs Temp1-6
    fig_temp = go.Figure()

    # Add traces for each temperature sensor
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
    temp_columns = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6']

    for i, temp_col in enumerate(temp_columns):
        fig_temp.add_trace(go.Scatter(
            x=df['Date'],
            y=df[temp_col],
            mode='lines',
            name=temp_col,
            line=dict(color=colors[i], width=2)
        ))

    fig_temp.update_layout(
        title='Temperature Sensors Over Time',
        xaxis_title='Date',
        yaxis_title='Temperature (°C)',
        hovermode='x unified',
        template='plotly_white',
        height=600,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )

    # Create second figure: Date vs Pressure
    fig_pressure = go.Figure()

    fig_pressure.add_trace(go.Scatter(
        x=df['Date'],
        y=df['Pressure'],
        mode='lines',
        name='Pressure',
        line=dict(color='#E74C3C', width=2),
        fill='tozeroy',
        fillcolor='rgba(231, 76, 60, 0.2)'
    ))

    fig_pressure.update_layout(
        title='Pressure Over Time',
        xaxis_title='Date',
        yaxis_title='Pressure (mbar)',
        hovermode='x unified',
        template='plotly_white',
        height=600
    )

    # Convert figures to JSON for rendering in HTML
    graph_temp_json = json.dumps(fig_temp, cls=plotly.utils.PlotlyJSONEncoder)
    graph_pressure_json = json.dumps(fig_pressure, cls=plotly.utils.PlotlyJSONEncoder)

    return render_template('index.html',
                         graph_temp_json=graph_temp_json,
                         graph_pressure_json=graph_pressure_json,
                         total_records=len(df))

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
