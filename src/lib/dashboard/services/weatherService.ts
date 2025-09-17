import { create } from 'zustand'
import { 
  ApiCache, 
  debounce, 
  throttle,
  retryRequest 
} from '@/lib/utils/api-optimizer'

interface CurrentWeather {
  temperature: number
  feelsLike: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
}

interface ForecastDay {
  date: string
  high: number
  low: number
  condition: string
  rainChance: number
}

interface WeatherStore {
  currentWeather: CurrentWeather | null
  forecast: ForecastDay[]
  location: string
  loading: boolean
  error: string | null
  updateLocation: (location: string) => void
  refreshWeather: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Mock weather conditions
const weatherConditions = [
  'Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy'
]

// Mock weather data generator
const generateMockWeather = (location: string): { current: CurrentWeather; forecast: ForecastDay[] } => {
  // Generate current weather
  const currentConditionIndex = Math.floor(Math.random() * weatherConditions.length)
  const baseTemp = 15 + Math.floor(Math.random() * 20) // 15-35°C
  
  const current: CurrentWeather = {
    temperature: baseTemp,
    feelsLike: baseTemp + Math.floor(Math.random() * 5) - 2,
    condition: weatherConditions[currentConditionIndex],
    humidity: 40 + Math.floor(Math.random() * 40), // 40-80%
    windSpeed: 5 + Math.floor(Math.random() * 20), // 5-25 km/h
    pressure: 1010 + Math.floor(Math.random() * 20) - 10, // 1000-1020 hPa
  }

  // Generate 5-day forecast
  const forecast: ForecastDay[] = []
  const today = new Date()
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    const conditionIndex = Math.floor(Math.random() * weatherConditions.length)
    const dayHigh = baseTemp + Math.floor(Math.random() * 10) - 2
    const dayLow = dayHigh - 5 - Math.floor(Math.random() * 5)
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      high: dayHigh,
      low: dayLow,
      condition: weatherConditions[conditionIndex],
      rainChance: weatherConditions[conditionIndex].includes('Rain') || weatherConditions[conditionIndex].includes('Storm')
        ? 60 + Math.floor(Math.random() * 30)
        : Math.floor(Math.random() * 30),
    })
  }

  return { current, forecast }
}

// Location name to Korean mapping
const locationMap: { [key: string]: string } = {
  'seoul': '서울',
  'busan': '부산',
  'incheon': '인천',
  'daegu': '대구',
  'daejeon': '대전',
  'gwangju': '광주',
  'ulsan': '울산',
  'jeju': '제주',
  'new york': '뉴욕',
  'tokyo': '도쿄',
  'london': '런던',
  'paris': '파리',
}

// API Cache instance for weather data
const weatherCache = new ApiCache()

// Simulated API fetch with caching and retry
const fetchWeatherData = async (location: string): Promise<{ current: CurrentWeather; forecast: ForecastDay[] }> => {
  // Check cache first
  const cacheKey = `weather_${location}`
  const cached = weatherCache.get<{ current: CurrentWeather; forecast: ForecastDay[] }>(cacheKey, {})
  
  if (cached) {
    return cached
  }

  // Simulate API call with potential failure
  return new Promise((resolve, reject) => {
    // 90% success rate for testing retry logic
    if (Math.random() > 0.9) {
      reject(new Error('Weather API temporarily unavailable'))
      return
    }

    setTimeout(() => {
      const data = generateMockWeather(location)
      // Cache for 30 minutes
      weatherCache.set(cacheKey, data, {}, 30 * 60 * 1000)
      resolve(data)
    }, 500)
  })
}

// Debounced location update to prevent rapid API calls
const debouncedLocationUpdate = debounce((location: string, set: any) => {
  retryRequest(
    () => fetchWeatherData(location),
    3, // max retries
    1000, // initial delay
    1.5 // backoff multiplier
  )
    .then(({ current, forecast }) => {
      set({
        currentWeather: current,
        forecast,
        loading: false,
        error: null,
      })
      
      // Store in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('weather_location', location)
        localStorage.setItem('weather_data', JSON.stringify({ current, forecast }))
        localStorage.setItem('weather_updated', new Date().toISOString())
      }
    })
    .catch((error) => {
      set({
        loading: false,
        error: error.message || 'Failed to fetch weather data',
      })
    })
}, 300)

// Throttled refresh to prevent spamming
const throttledRefresh = throttle((location: string, set: any) => {
  // Invalidate cache for this location
  weatherCache.invalidate(`weather_${location}`, {})
  
  retryRequest(
    () => fetchWeatherData(location),
    3,
    1000,
    1.5
  )
    .then(({ current, forecast }) => {
      set({
        currentWeather: current,
        forecast,
        loading: false,
        error: null,
      })
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('weather_data', JSON.stringify({ current, forecast }))
        localStorage.setItem('weather_updated', new Date().toISOString())
      }
    })
    .catch((error) => {
      set({
        loading: false,
        error: error.message || 'Failed to refresh weather data',
      })
    })
}, 2000) // Max once every 2 seconds

const useWeatherStore = create<WeatherStore>((set, get) => ({
  currentWeather: null,
  forecast: [],
  location: '서울',
  loading: false,
  error: null,

  updateLocation: (location: string) => {
    const normalizedLocation = location.toLowerCase()
    const koreanLocation = locationMap[normalizedLocation] || location
    
    set({ location: koreanLocation, loading: true, error: null })
    
    // Use debounced API call
    debouncedLocationUpdate(koreanLocation, set)
  },

  refreshWeather: () => {
    const { location } = get()
    set({ loading: true, error: null })
    
    // Use throttled refresh
    throttledRefresh(location, set)
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}))

// Custom hook for using weather service
export const useWeatherService = () => {
  const store = useWeatherStore()

  // Initialize weather data on first load
  React.useEffect(() => {
    if (!store.currentWeather && !store.loading) {
      // Try to load from localStorage first
      if (typeof window !== 'undefined') {
        const savedLocation = localStorage.getItem('weather_location')
        const savedData = localStorage.getItem('weather_data')
        const savedTime = localStorage.getItem('weather_updated')
        
        if (savedLocation && savedData && savedTime) {
          const timeDiff = Date.now() - new Date(savedTime).getTime()
          const hourInMs = 60 * 60 * 1000
          
          // Use cached data if less than 1 hour old
          if (timeDiff < hourInMs) {
            const { current, forecast } = JSON.parse(savedData)
            store.location = savedLocation
            store.currentWeather = current
            store.forecast = forecast
            return
          }
        }
      }
      
      // Otherwise, fetch fresh data
      store.refreshWeather()
    }
  }, [store])

  // Auto-refresh every hour
  React.useEffect(() => {
    const interval = setInterval(() => {
      store.refreshWeather()
    }, 60 * 60 * 1000) // 1 hour

    return () => clearInterval(interval)
  }, [store])

  return store
}

// For direct store access if needed
export default useWeatherStore

// Import React for useEffect
import React from 'react'