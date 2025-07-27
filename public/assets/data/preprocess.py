import pandas as pd

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
    df = df[df['Year'] == 2015]  # Last full year

    grouped = df.groupby('City')['AverageTemperature'].mean().reset_index()
    grouped = grouped.rename(columns={'AverageTemperature': 'AvgTemp'})
    top10 = grouped.sort_values(by='AvgTemp', ascending=False).head(10)

    top10.to_csv("major_city_top10_2015.csv", index=False)
    print("Saved major_city_top10_2015.csv")

# 4. U.S. STATES TEMPERATURES
def process_state_temperatures(path="raw-dataset/GlobalLandTemperaturesByState.csv"):
    df = pd.read_csv(path, parse_dates=['dt'])
    df['Year'] = df['dt'].dt.year
    df = df[(df['Year'] >= START_YEAR) & (df['Year'] <= END_YEAR) & (df['Country'] == "United States")]

    grouped = df.groupby(['State', 'Year'])['AverageTemperature'].mean().reset_index()
    grouped.rename(columns={'AverageTemperature': 'AvgTemp'}, inplace=True)

    grouped.to_csv("us_states_annual_temp.csv", index=False)
    print("Saved us_states_annual_temp.csv")

# Run all
if __name__ == "__main__":
    process_global_temperatures()
    process_country_temperatures()
    process_major_city_temperatures()
    process_state_temperatures()
