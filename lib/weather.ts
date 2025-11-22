// Weather utility using National Weather Service API (free, US only)

interface Coordinates {
  lat: number
  lon: number
}

interface WeatherPeriod {
  name: string
  temperature: number
  temperatureUnit: string
  shortForecast: string
  detailedForecast: string
  icon: string
  isDaytime: boolean
  precipitationChance: number | null
}

export interface WeatherForecast {
  location: string
  current: WeatherPeriod | null
  forecast: WeatherPeriod[]
  error?: string
}

// Geocode address to coordinates using Nominatim (OpenStreetMap)
async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'TextLoop-Contractor-App', // Nominatim requires User-Agent
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (!data || data.length === 0) return null

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Get weather forecast from National Weather Service
export async function getWeatherForecast(address: string): Promise<WeatherForecast> {
  const result: WeatherForecast = {
    location: address,
    current: null,
    forecast: []
  }

  try {
    // Step 1: Geocode the address
    const coords = await geocodeAddress(address)
    if (!coords) {
      result.error = 'Unable to find location'
      return result
    }

    // Step 2: Get forecast URL from NWS points endpoint
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`,
      {
        headers: {
          'User-Agent': 'TextLoop-Contractor-App',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!pointsResponse.ok) {
      result.error = 'Weather service unavailable'
      return result
    }

    const pointsData = await pointsResponse.json()
    const forecastUrl = pointsData.properties.forecast

    // Step 3: Get the actual forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'User-Agent': 'TextLoop-Contractor-App',
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    })

    if (!forecastResponse.ok) {
      result.error = 'Forecast unavailable'
      return result
    }

    const forecastData = await forecastResponse.json()
    const periods = forecastData.properties.periods

    // Current conditions (first period)
    if (periods && periods.length > 0) {
      result.current = {
        name: periods[0].name,
        temperature: periods[0].temperature,
        temperatureUnit: periods[0].temperatureUnit,
        shortForecast: periods[0].shortForecast,
        detailedForecast: periods[0].detailedForecast,
        icon: periods[0].icon,
        isDaytime: periods[0].isDaytime,
        precipitationChance: periods[0].probabilityOfPrecipitation?.value ?? null
      }

      // Next 7 days (skip first, take next 14 periods = 7 days of day/night)
      result.forecast = periods.slice(1, 15).map((period: any) => ({
        name: period.name,
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
        icon: period.icon,
        isDaytime: period.isDaytime,
        precipitationChance: period.probabilityOfPrecipitation?.value ?? null
      }))
    }

    return result
  } catch (error) {
    console.error('Weather fetch error:', error)
    result.error = 'Unable to fetch weather'
    return result
  }
}

// Helper to format address for weather lookup
export function formatAddressForWeather(
  street?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): string {
  const parts = []
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (zip) parts.push(zip)
  return parts.join(', ') || 'United States'
}
