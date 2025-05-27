"use client"

import { useState } from "react"
import { type AnalyzerType, getAllAnalyzers } from "@/utils/analyzers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface AnalyzerTypeSelectorProps {
  onSelect: (type: AnalyzerType) => void
  defaultValue?: AnalyzerType
  disabled?: boolean
}

export default function AnalyzerTypeSelector({
  onSelect,
  defaultValue = "standard",
  disabled = false,
}: AnalyzerTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnalyzerType>(defaultValue)
  const analyzers = getAllAnalyzers()

  const handleSelect = (type: AnalyzerType) => {
    setSelectedType(type)
    onSelect(type)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tipo de Análisis</CardTitle>
        <CardDescription>Selecciona el tipo de análisis más adecuado para tu transcripción</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => handleSelect(value as AnalyzerType)}
          className="space-y-3"
          disabled={disabled}
        >
          {analyzers.map((analyzer) => (
            <div key={analyzer.id} className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value={analyzer.id} id={analyzer.id} />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={analyzer.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {analyzer.name}
                </Label>
                <p className="text-sm text-muted-foreground">{analyzer.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          El tipo de análisis determina cómo se procesará y presentará la información de tu transcripción.
        </p>
      </CardFooter>
    </Card>
  )
}
