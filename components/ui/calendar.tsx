"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  // Abandonamos personalizaciones complejas y usamos el estilo por defecto de react-day-picker
  return (
    <div className={cn("p-3 bg-transparent", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        firstDayOfWeek={1}
        locale={es}
        components={{
          IconLeft: (iconProps) => (
            <button type="button" className={cn(buttonVariants({ variant: "outline" }), "p-1")} {...iconProps}>
              <ChevronLeft className="h-4 w-4" />
            </button>
          ),
          IconRight: (iconProps) => (
            <button type="button" className={cn(buttonVariants({ variant: "outline" }), "p-1")} {...iconProps}>
              <ChevronRight className="h-4 w-4" />
            </button>
          ),
        }}
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
