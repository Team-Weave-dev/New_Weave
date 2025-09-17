'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { MapPin, Cloud, CloudRain, Sun, CloudSnow, Zap, Wind } from 'lucide-react'
import { useWeatherService } from '@/lib/dashboard/services/weatherService'

interface WeatherWidgetProps {
  id: string
  data?: any
}

export function WeatherWidget({ id }: WeatherWidgetProps) {
  const { currentWeather, forecast, location, updateLocation, refreshWeather, loading } = useWeatherService()
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [newLocation, setNewLocation] = useState('')

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-12 h-12 text-yellow-500" />
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="w-12 h-12 text-gray-500" />
      case 'rainy':
      case 'rain':
        return <CloudRain className="w-12 h-12 text-blue-500" />
      case 'snow':
      case 'snowy':
        return <CloudSnow className="w-12 h-12 text-blue-300" />
      case 'stormy':
      case 'thunderstorm':
        return <Zap className="w-12 h-12 text-purple-500" />
      default:
        return <Cloud className="w-12 h-12 text-gray-400" />
    }
  }

  const handleLocationUpdate = () => {
    if (newLocation.trim()) {
      updateLocation(newLocation.trim())
      setIsEditingLocation(false)
      setNewLocation('')
    }
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return '오늘'
    if (date.toDateString() === tomorrow.toDateString()) return '내일'
    
    return date.toLocaleDateString('ko-KR', { weekday: 'short' })
  }

  return (
    <Card className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h6" className="font-semibold">날씨</Typography>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditingLocation(!isEditingLocation)}
          className="flex items-center gap-1 text-xs"
        >
          <MapPin className="w-3 h-3" />
          {location}
        </Button>
      </div>

      {/* Location Edit */}
      {isEditingLocation && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="도시 이름 입력"
            className="flex-1 px-2 py-1 text-sm border rounded"
            onKeyPress={(e) => e.key === 'Enter' && handleLocationUpdate()}
          />
          <Button size="sm" onClick={handleLocationUpdate}>
            변경
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditingLocation(false)
              setNewLocation('')
            }}
          >
            취소
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">날씨 정보를 불러오는 중...</div>
        </div>
      ) : (
        <>
          {/* Current Weather */}
          {currentWeather && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {getWeatherIcon(currentWeather.condition)}
                <div>
                  <Typography variant="h3" className="font-bold">
                    {currentWeather.temperature}°
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {currentWeather.condition}
                  </Typography>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Wind className="w-3 h-3" />
                  {currentWeather.windSpeed} km/h
                </div>
                <Typography variant="caption" className="text-gray-600">
                  습도: {currentWeather.humidity}%
                </Typography>
                <br />
                <Typography variant="caption" className="text-gray-600">
                  체감: {currentWeather.feelsLike}°
                </Typography>
              </div>
            </div>
          )}

          {/* 5-Day Forecast */}
          {forecast && forecast.length > 0 && (
            <div className="flex-1">
              <Typography variant="body2" className="mb-2 text-gray-700 font-semibold">
                5일 예보
              </Typography>
              <div className="grid grid-cols-5 gap-2">
                {forecast.map((day, index) => (
                  <div
                    key={index}
                    className="text-center p-2 bg-gray-50 rounded-lg"
                  >
                    <Typography variant="caption" className="block mb-1 font-medium">
                      {getDayName(day.date)}
                    </Typography>
                    <div className="flex justify-center mb-1">
                      {React.cloneElement(getWeatherIcon(day.condition), {
                        className: 'w-6 h-6'
                      })}
                    </div>
                    <Typography variant="caption" className="block font-semibold">
                      {day.high}°
                    </Typography>
                    <Typography variant="caption" className="block text-gray-500">
                      {day.low}°
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshWeather}
              className="text-xs"
            >
              새로고침
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

WeatherWidget.defaultSize = { width: 2, height: 2 }
WeatherWidget.minSize = { width: 2, height: 2 }
WeatherWidget.maxSize = { width: 3, height: 3 }
WeatherWidget.category = 'productivity'