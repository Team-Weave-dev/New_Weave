import { create } from 'zustand'

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
    
    // Simulate API call delay
    setTimeout(() => {
      const { current, forecast } = generateMockWeather(koreanLocation)
      set({
        currentWeather: current,
        forecast,
        loading: false,
        error: null,
      })
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('weather_location', koreanLocation)
        localStorage.setItem('weather_data', JSON.stringify({ current, forecast }))
        localStorage.setItem('weather_updated', new Date().toISOString())
      }
    }, 1000)
  },

  refreshWeather: () => {
    const { location } = get()
    set({ loading: true, error: null })
    
    // Simulate API call delay
    setTimeout(() => {
      const { current, forecast } = generateMockWeather(location)
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
    }, 1000)
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