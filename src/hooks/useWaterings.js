import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getPlantStatus } from '../lib/utils'

export const useWaterings = (plantId = null) => {
  const [waterings, setWaterings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWaterings = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('waterings')
        .select('id, plant_id, user_id, status, created_at')
        .order('created_at', { ascending: false })

      if (plantId) {
        query = query.eq('plant_id', plantId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const rawWaterings = data || []
      const userIds = [...new Set(rawWaterings.map((watering) => watering.user_id).filter(Boolean))]

      let profileMap = {}
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds)

        if (profilesError) throw profilesError

        profileMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile.display_name
          return acc
        }, {})
      }

      const mergedWaterings = rawWaterings.map((watering) => ({
        ...watering,
        profiles: {
          display_name: profileMap[watering.user_id] || null
        }
      }))

      setWaterings(mergedWaterings)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaterings()

    const channel = supabase
      .channel('waterings-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waterings' },
        () => {
          fetchWaterings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [plantId])

  const waterPlant = async (plantId, userId, plant) => {
    // Determine plant status
    const status = getPlantStatus(plant.next_watering_at)

    // Don't allow watering green plants
    if (status === 'green') {
      throw new Error('This plant does not need watering yet')
    }

    const { data, error } = await supabase.rpc('water_plant', {
      p_plant_id: plantId
    })

    if (error) {
      if (error.message?.includes('function') || error.message?.includes('water_plant')) {
        throw new Error('Database function water_plant is missing. Please run the SQL setup patch in SETUP.md.')
      }
      throw error
    }

    return data
  }

  return {
    waterings,
    loading,
    error,
    waterPlant,
    fetchWaterings
  }
}
