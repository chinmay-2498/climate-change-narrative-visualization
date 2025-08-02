import pandas as pd
import os

# Define range to include in the final dataset
START_YEAR = 1900
END_YEAR = 2015

# 1. GLOBAL ANNUAL TEMPERATURES
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

# 2. COUNTRY ANNUAL TEMPERATURES
def process_country_temperatures(path="raw-dataset/GlobalLandTemperaturesByCountry.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year
    df = df[(df['Year'] >= START_YEAR) & (df['Year'] <= END_YEAR)]

    grouped = df.groupby(['Country', 'Year'])['AverageTemperature'].mean().reset_index()
    grouped.rename(columns={'AverageTemperature': 'AvgTemp'}, inplace=True)

    grouped.to_csv("country_annual_temp.csv", index=False)
    print("Saved country_annual_temp.csv")

# 3. MAJOR CITY TEMPERATURES (Top 10 hottest cities based on 2015 average)
def process_major_city_temperatures(path="raw-dataset/GlobalLandTemperaturesByMajorCity.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year

    # Filter only rows with valid (non-null) temperature
    df = df[df['AverageTemperature'].notna()]

    # Step 1: Find latest usable year with sufficient data
    year_counts = df['Year'].value_counts().sort_index(ascending=False)
    for year in year_counts.index:
        year_df = df[df['Year'] == year]
        if year_df['City'].nunique() >= 50:  # At least 50 cities with data
            print(f"Using year {year} with {year_df['City'].nunique()} cities")
            break

    # Step 2: Aggregate city-level temperature for that year
    year_df = year_df.copy()
    grouped = year_df.groupby('City')['AverageTemperature'].mean().reset_index()
    top10 = grouped.sort_values(by='AverageTemperature', ascending=False).head(10)

    # Save to CSV
    top10.to_csv(f"major_city_top10_{year}.csv", index=False)
    print(f"Saved major_city_top10_{year}.csv")


# 4. U.S. STATES TEMPERATURES
def process_state_temperatures(path="raw-dataset/GlobalLandTemperaturesByState.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year
    df = df[(df['Year'] >= START_YEAR) & (df['Year'] <= END_YEAR) & (df['Country'] == "United States")]

    grouped = df.groupby(['State', 'Year'])['AverageTemperature'].mean().reset_index()
    grouped.rename(columns={'AverageTemperature': 'AvgTemp'}, inplace=True)

    grouped.to_csv("us_states_annual_temp.csv", index=False)
    print("Saved us_states_annual_temp.csv")

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
    process_major_city_temperatures()
    process_state_temperatures()
    process_co2_data()
