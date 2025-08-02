import pandas as pd
import os

START_YEAR = 1900
END_YEAR = 2015

def process_global_temperatures(path="raw-dataset/GlobalTemperatures.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year
    df = df[(df['Year'] >= START_YEAR) & (df['Year'] <= END_YEAR)]

    grouped = df.groupby('Year').agg({
        'LandAverageTemperature': 'mean',
        'LandAndOceanAverageTemperature': 'mean'
    }).reset_index()

    grouped.rename(columns={
        'LandAverageTemperature': 'LandAvgTemp',
        'LandAndOceanAverageTemperature': 'LandOceanAvgTemp'
    }, inplace=True)

    grouped.to_csv("global_annual_temp.csv", index=False)
    print("Saved global_annual_temp.csv")

def process_country_temperatures(path="raw-dataset/GlobalLandTemperaturesByCountry.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year
    df = df[(df['Year'] >= START_YEAR) & (df['Year'] <= END_YEAR)]

    grouped = df.groupby(['Country', 'Year'])['AverageTemperature'].mean().reset_index()
    grouped.rename(columns={'AverageTemperature': 'AvgTemp'}, inplace=True)

    grouped.to_csv("country_annual_temp.csv", index=False)
    print("Saved country_annual_temp.csv")

def process_co2_data(input_path="raw-dataset/owid-co2-data.csv", output_path="global_co2_mt.csv"):
    if os.path.exists(input_path):
        print(f"Processing CO2 data from {input_path}")
        co2_df = pd.read_csv(input_path)

        # Filter only 'World' data
        co2_world = co2_df[co2_df['country'] == 'World']

        # Filter years between 1900 and 2015
        co2_world = co2_world[(co2_world['year'] >= START_YEAR) & (co2_world['year'] <= END_YEAR)]

        # Keep only necessary columns
        co2_clean = co2_world[['year', 'co2']].rename(columns={
                    'year': 'Year',
                    'co2': 'CO2_Mt'
        })

        # Drop rows with missing CO2
        co2_clean = co2_clean.dropna(subset=['CO2_Mt'])

        co2_clean.to_csv(output_path, index=False)
        print(f"Saved global CO2 data to {output_path}")
    else:
        print(f"File {input_path} not found. Skipping CO2 processing.")
# Run all
if __name__ == "__main__":
    process_global_temperatures()
    process_country_temperatures()
    process_co2_data()
