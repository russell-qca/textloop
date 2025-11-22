import { getWeatherForecast, type WeatherForecast } from '@/lib/weather'

interface WeatherWidgetProps {
  address: string
}

// Simple symbolic weather icons
function WeatherIcon({ forecast, size = 'large' }: { forecast: string, size?: 'large' | 'small' }) {
  const iconSize = size === 'large' ? 'w-12 h-12' : 'w-8 h-8'
  const forecastLower = forecast.toLowerCase()

  // Determine which icon to show based on forecast text
  if (forecastLower.includes('thunder') || forecastLower.includes('storm')) {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" className="text-gray-600" />
        <polyline points="13 11 9 17 15 17 11 23" className="text-yellow-500" fill="currentColor" />
      </svg>
    )
  }

  if (forecastLower.includes('rain') || forecastLower.includes('shower')) {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" className="text-blue-500" fill="currentColor" />
      </svg>
    )
  }

  if (forecastLower.includes('snow') || forecastLower.includes('flurr')) {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" className="text-blue-400" />
        <line x1="2" y1="12" x2="22" y2="12" className="text-blue-400" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" className="text-blue-400" />
        <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" className="text-blue-400" />
        <circle cx="12" cy="12" r="2" className="text-blue-400" fill="currentColor" />
      </svg>
    )
  }

  if (forecastLower.includes('cloud') || forecastLower.includes('overcast')) {
    if (forecastLower.includes('partly') || forecastLower.includes('mostly sunny')) {
      return (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" className="text-yellow-500" fill="currentColor" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" className="text-yellow-500" />
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" className="text-gray-500" opacity="0.7" />
        </svg>
      )
    }
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="text-gray-600" />
      </svg>
    )
  }

  if (forecastLower.includes('fog') || forecastLower.includes('mist') || forecastLower.includes('haze')) {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15h18M3 9h18M3 18h18M3 12h18M3 6h18" className="text-gray-500" opacity="0.6" />
      </svg>
    )
  }

  // Default: sunny/clear
  return (
    <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" className="text-yellow-500" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="3" className="text-yellow-500" />
      <line x1="12" y1="21" x2="12" y2="23" className="text-yellow-500" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" className="text-yellow-500" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" className="text-yellow-500" />
      <line x1="1" y1="12" x2="3" y2="12" className="text-yellow-500" />
      <line x1="21" y1="12" x2="23" y2="12" className="text-yellow-500" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" className="text-yellow-500" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" className="text-yellow-500" />
    </svg>
  )
}

export default async function WeatherWidget({ address }: WeatherWidgetProps) {
  const weather = await getWeatherForecast(address)

  if (weather.error || !weather.current) {
    return null // Silently fail if weather unavailable
  }

  // Group forecast into day/night pairs to get high/low temps and precipitation
  const forecastDays = []
  for (let i = 0; i < weather.forecast.length - 1; i += 2) {
    const dayPeriod = weather.forecast[i]
    const nightPeriod = weather.forecast[i + 1]

    // Use daytime period if available, otherwise use night period
    if (dayPeriod.isDaytime) {
      // Use the higher precipitation chance between day and night
      const precipChance = Math.max(
        dayPeriod.precipitationChance ?? 0,
        nightPeriod?.precipitationChance ?? 0
      )

      forecastDays.push({
        name: dayPeriod.name,
        forecast: dayPeriod.shortForecast,
        high: dayPeriod.temperature,
        low: nightPeriod ? nightPeriod.temperature : null,
        precipitationChance: precipChance > 0 ? precipChance : null
      })
    } else {
      // If we start with a night period, use next day's data
      const precipChance = Math.max(
        dayPeriod.precipitationChance ?? 0,
        nightPeriod?.precipitationChance ?? 0
      )

      forecastDays.push({
        name: nightPeriod ? nightPeriod.name : dayPeriod.name,
        forecast: nightPeriod ? nightPeriod.shortForecast : dayPeriod.shortForecast,
        high: nightPeriod ? nightPeriod.temperature : null,
        low: dayPeriod.temperature,
        precipitationChance: precipChance > 0 ? precipChance : null
      })
    }

    if (forecastDays.length >= 7) break
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      {/* Single row: Current + 7 days */}
      <div className="flex items-center justify-between gap-4">
        {/* Current Weather - Featured */}
        <div className="flex-shrink-0 text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xs font-semibold text-gray-600 mb-1">Now</div>
          <div className="flex justify-center mb-1">
            <WeatherIcon forecast={weather.current.shortForecast} size="small" />
          </div>
          <div className="text-lg font-bold text-gray-900">
            {weather.current.temperature}°
          </div>
          {weather.current.precipitationChance !== null && weather.current.precipitationChance > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {weather.current.precipitationChance}%
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-16 w-px bg-gray-200 flex-shrink-0"></div>

        {/* 7-Day Forecast - Spread evenly */}
        <div className="flex justify-between gap-4 flex-1">
          {forecastDays.map((day, index) => (
            <div key={index} className="text-center flex-1">
              <div className="text-xs font-medium text-gray-600 mb-1">
                {day.name.replace('This ', '').replace(' Afternoon', '')}
              </div>
              <div className="flex justify-center mb-1">
                <WeatherIcon forecast={day.forecast} size="small" />
              </div>
              <div className="text-xs text-gray-900">
                <span className="font-semibold">{day.high}°</span>
                {day.low !== null && (
                  <>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-gray-500">{day.low}°</span>
                  </>
                )}
              </div>
              {day.precipitationChance !== null && (
                <div className="text-xs text-blue-600 mt-1">
                  {day.precipitationChance}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Location indicator inline on the right */}
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-500">{weather.location}</span>
        </div>
      </div>
    </div>
  )
}
