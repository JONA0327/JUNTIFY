import { parseRelativeDate } from '@/utils/relative-date'
import { format, startOfWeek, addWeeks, addDays } from 'date-fns'

describe('parseRelativeDate', () => {
  it('handles "próxima semana" as next Monday', () => {
    const today = new Date()
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    expect(parseRelativeDate('próxima semana')).toBe(format(nextMonday, 'yyyy-MM-dd'))
  })

  it('handles "semana que viene para jueves"', () => {
    const today = new Date()
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    const nextThursday = addDays(nextMonday, 3)
    expect(parseRelativeDate('semana que viene para jueves')).toBe(
      format(nextThursday, 'yyyy-MM-dd'),
    )
  })

  it('handles "para la próxima semana"', () => {
    const today = new Date()
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    expect(parseRelativeDate('para la próxima semana')).toBe(
      format(nextMonday, 'yyyy-MM-dd'),
    )
  })

  it('handles "de la semana que viene para jueves"', () => {
    const today = new Date()
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    const nextThursday = addDays(nextMonday, 3)
    expect(parseRelativeDate('de la semana que viene para jueves')).toBe(
      format(nextThursday, 'yyyy-MM-dd'),
    )
  })
})
