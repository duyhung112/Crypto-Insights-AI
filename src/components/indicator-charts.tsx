"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { RsiData, MacdData } from "@/lib/types"

interface IndicatorChartsProps {
    rsiData: RsiData[],
    macdData: MacdData[],
}

export function IndicatorCharts({ rsiData, macdData }: IndicatorChartsProps) {
    const formattedRsiData = rsiData.map(d => ({...d, time: new Date(d.time).toLocaleTimeString()}));
    const formattedMacdData = macdData.map(d => ({...d, time: new Date(d.time).toLocaleTimeString()}));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">RSI</CardTitle>
          <CardDescription>Relative Strength Index</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <LineChart
              data={formattedRsiData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis dataKey="time" tick={false} />
              <YAxis domain={[0, 100]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
              <Line dataKey="value" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="RSI" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">MACD</CardTitle>
          <CardDescription>Moving Average Convergence Divergence</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <BarChart 
                data={formattedMacdData}
                margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                }}
            >
              <XAxis dataKey="time" tick={false} />
              <YAxis />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line dataKey="MACD" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line dataKey="signal" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
              <Bar dataKey="histogram" >
                {formattedMacdData.map((entry, index) => (
                  <rect key={`cell-${index}`} fill={entry.histogram && entry.histogram > 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
