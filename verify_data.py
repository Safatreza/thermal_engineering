import pandas as pd
import numpy as np

# Read the CSV file
df = pd.read_csv('20251211_LPE_CC_Data_Export.csv')

# Convert Date column to datetime
df['Date'] = pd.to_datetime(df['Date'])

print("=" * 80)
print("DATA VERIFICATION REPORT")
print("=" * 80)

print(f"\nTotal Records: {len(df)}")
print(f"Date Range: {df['Date'].min()} to {df['Date'].max()}")

print("\n" + "=" * 80)
print("TEMPERATURE DATA ANALYSIS")
print("=" * 80)

temp_columns = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5', 'Temp6']
for temp_col in temp_columns:
    print(f"\n{temp_col}:")
    print(f"  Min: {df[temp_col].min():.2f}°C")
    print(f"  Max: {df[temp_col].max():.2f}°C")
    print(f"  Mean: {df[temp_col].mean():.2f}°C")
    print(f"  Std Dev: {df[temp_col].std():.2f}°C")

print("\n" + "=" * 80)
print("PRESSURE DATA ANALYSIS")
print("=" * 80)
print(f"\nPressure:")
print(f"  Min: {df['Pressure'].min():.4f} mbar")
print(f"  Max: {df['Pressure'].max():.4f} mbar")
print(f"  Mean: {df['Pressure'].mean():.4f} mbar")
print(f"  Std Dev: {df['Pressure'].std():.4f} mbar")

print("\n" + "=" * 80)
print("SAMPLE DATA (First 10 rows)")
print("=" * 80)
print(df[['Date'] + temp_columns + ['Pressure']].head(10).to_string())

print("\n" + "=" * 80)
print("SAMPLE DATA (Rows with interesting pressure changes)")
print("=" * 80)
# Find rows where pressure changes significantly
pressure_change_idx = df[df['Pressure'] < 100].head(10).index
print(df.loc[pressure_change_idx, ['Date'] + temp_columns + ['Pressure']].to_string())

print("\n" + "=" * 80)
print("DATA QUALITY CHECK")
print("=" * 80)
print("\nMissing Values:")
print(df[['Date'] + temp_columns + ['Pressure']].isnull().sum())

print("\n" + "=" * 80)
