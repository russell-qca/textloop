import React from 'react'

// Copy of the WeatherIcon component
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

export default function TestWeatherIcons() {
  const conditions = [
    { name: 'Sunny', forecast: 'Sunny' },
    { name: 'Clear', forecast: 'Clear' },
    { name: 'Partly Cloudy', forecast: 'Partly Cloudy' },
    { name: 'Mostly Cloudy', forecast: 'Mostly Cloudy' },
    { name: 'Cloudy', forecast: 'Cloudy' },
    { name: 'Rain', forecast: 'Rain Showers' },
    { name: 'Thunderstorm', forecast: 'Thunderstorms' },
    { name: 'Snow', forecast: 'Snow' },
    { name: 'Fog', forecast: 'Fog' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Weather Icon Test</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-lg font-semibold mb-6">Large Icons</h2>
        <div className="grid grid-cols-3 gap-8 mb-12">
          {conditions.map((condition) => (
            <div key={condition.name} className="text-center">
              <div className="flex justify-center mb-3">
                <WeatherIcon forecast={condition.forecast} size="large" />
              </div>
              <div className="text-sm font-medium text-gray-700">{condition.name}</div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-6">Small Icons</h2>
        <div className="grid grid-cols-5 gap-6">
          {conditions.map((condition) => (
            <div key={condition.name} className="text-center">
              <div className="flex justify-center mb-2">
                <WeatherIcon forecast={condition.forecast} size="small" />
              </div>
              <div className="text-xs text-gray-600">{condition.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Current Icon Mapping:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Sunny/Clear - Sun with rays (yellow)</li>
          <li>• Partly Cloudy - Sun with cloud (yellow + gray)</li>
          <li>• Cloudy - Cloud shape (gray)</li>
          <li>• Rain - Large raindrop (blue)</li>
          <li>• Thunderstorm - Cloud with lightning (gray + yellow)</li>
          <li>• Snow - Large snowflake (light blue)</li>
          <li>• Fog - Horizontal lines (gray)</li>
        </ul>
      </div>
    </div>
  )
}
