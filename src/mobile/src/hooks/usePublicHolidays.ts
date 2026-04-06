import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'

const DAY_MS = 24 * 60 * 60 * 1000

export interface PublicHoliday {
  id: string
  country_id: string
  name: string
  holiday_date: string // YYYY-MM-DD
  is_recurring: boolean | null
  description: string | null
}

async function fetchHolidays(countryId: string, year: number): Promise<PublicHoliday[]> {
  const { data, error } = await supabase
    .from('public_holidays')
    .select('id, country_id, name, holiday_date, is_recurring, description')
    .eq('country_id', countryId)
    .gte('holiday_date', `${year}-01-01`)
    .lte('holiday_date', `${year}-12-31`)
    .order('holiday_date', { ascending: true })
  throwIfError(error, 'FETCH_PUBLIC_HOLIDAYS', 'No se pudieron cargar los festivos')
  return (data ?? []) as PublicHoliday[]
}

/**
 * Cache is stable for 24 hours — holidays don't change during the day.
 */
export function usePublicHolidays(countryId: string | undefined, year = new Date().getFullYear()) {
  const query = useQuery({
    queryKey: ['public-holidays', countryId, year],
    queryFn: () => fetchHolidays(countryId!, year),
    enabled: !!countryId,
    staleTime: DAY_MS,
    gcTime: DAY_MS * 2,
    refetchOnWindowFocus: false,
  })

  const holidays = query.data ?? []
  const dateSet = new Set(holidays.map(h => h.holiday_date))

  function isHoliday(date: string): boolean {
    return dateSet.has(date)
  }

  function getHolidayName(date: string): string | undefined {
    return holidays.find(h => h.holiday_date === date)?.name
  }

  return { ...query, holidays, isHoliday, getHolidayName }
}
