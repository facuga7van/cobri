"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from "next-themes"

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const { theme, systemTheme } = useTheme()
  
  // Colores del gráfico según el tema
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    line: isDark ? '#60a5fa' : '#3b82f6',
    tooltip: {
      bg: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#f9fafb' : '#111827',
    }
  }

  // Si solo hay 1 punto de datos, usar gráfico de barras en lugar de línea
  const useBarChart = data.length === 1

  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 10, bottom: 5 }
  }

  const chartContent = (
    <>
      <CartesianGrid 
        strokeDasharray="3 3" 
        stroke={chartColors.grid}
      />
      <XAxis 
        dataKey="month" 
        tick={{ fill: chartColors.text, fontSize: 12 }}
        stroke={chartColors.grid}
        tickLine={{ stroke: chartColors.grid }}
      />
      <YAxis 
        tick={{ fill: chartColors.text, fontSize: 12 }}
        stroke={chartColors.grid}
        tickLine={{ stroke: chartColors.grid }}
        tickFormatter={(value) => `$${value}`}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: chartColors.tooltip.bg,
          border: `1px solid ${chartColors.tooltip.border}`,
          borderRadius: '8px',
          color: chartColors.tooltip.text,
        }}
        labelStyle={{ color: chartColors.tooltip.text }}
        formatter={(value) => [`$${value}`, 'Ingresos']}
      />
    </>
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      {useBarChart ? (
        <BarChart {...commonProps}>
          {chartContent}
          <Bar 
            dataKey="revenue" 
            fill={chartColors.line}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      ) : (
        <LineChart {...commonProps}>
          {chartContent}
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke={chartColors.line} 
            strokeWidth={2}
            dot={{ fill: chartColors.line, r: 5 }}
            activeDot={{ r: 7, fill: chartColors.line }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

