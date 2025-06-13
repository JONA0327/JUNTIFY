import {
  format,
  addDays,
  addWeeks,
  parse,
  isValid,
  nextDay,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const daysOfWeek: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
}

export function parseRelativeDate(input: string): string | null {
  if (!input) return null
  const text = normalize(input.trim())
  const today = new Date()

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text
  }

  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slash) {
    const parsed = parse(`${slash[1]}-${slash[2]}-${slash[3]}`, 'd-M-yyyy', today, {
      locale: es,
    })
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd')
  }

  if (text === 'hoy') return format(today, 'yyyy-MM-dd')
  if (text === 'manana' || text === 'mañana')
    return format(addDays(today, 1), 'yyyy-MM-dd')
  if (text === 'pasado manana' || text === 'pasadomanana' || text === 'pasado-mañana') {
    return format(addDays(today, 2), 'yyyy-MM-dd')
  }

  let match = text.match(/en\s+(\d+)\s*d[ií]as?/)
  if (match) return format(addDays(today, parseInt(match[1], 10)), 'yyyy-MM-dd')

  match = text.match(/en\s+(\d+)\s*semanas?/)
  if (match) return format(addWeeks(today, parseInt(match[1], 10)), 'yyyy-MM-dd')

  match = text.match(
    /(?:(?:la\s*)?(?:semana\s+que\s+viene|semana\s+proxima|proxima\s+semana))(?:\s+(?:para|de)?(?:\s+el)?\s+(lunes|martes|miercoles|mi\u00e9rcoles|jueves|viernes|sabado|s\u00e1bado|domingo))?/
  )
  if (match) {
    const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    if (match[1]) {
      const day = normalize(match[1])
      const target = nextDay(addDays(nextMonday, -1), daysOfWeek[day])
      return format(target, 'yyyy-MM-dd')
    }
    return format(nextMonday, 'yyyy-MM-dd')
  }

  match = text.match(/(proximo|pr\u00f3ximo|siguiente)\s+(lunes|martes|miercoles|mi\u00e9rcoles|jueves|viernes|sabado|s\u00e1bado|domingo)/)
  if (match) {
    const day = normalize(match[2])
    const d = nextDay(today, daysOfWeek[day])
    return format(d, 'yyyy-MM-dd')
  }

  match = text.match(/(para|el)?\s*(lunes|martes|miercoles|mi\u00e9rcoles|jueves|viernes|sabado|s\u00e1bado|domingo)/)
  if (match) {
    const day = normalize(match[2])
    const target = nextDay(addDays(today, -1), daysOfWeek[day])
    return format(target, 'yyyy-MM-dd')
  }

  const formats = ["d 'de' MMMM 'de' yyyy", "d 'de' MMMM yyyy", 'd/M/yyyy', 'd-M-yyyy']
  for (const fmt of formats) {
    const p = parse(text, fmt, today, { locale: es })
    if (isValid(p)) return format(p, 'yyyy-MM-dd')
  }

  return null
}
