import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const usePlants = () => {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPlants = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('plants')
        .select('*')
        .order('next_watering_at', { ascending: true, nullsFirst: true })

      if (fetchError) throw fetchError
      setPlants(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlants()

    const channel = supabase
      .channel('plants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plants' },
        () => {
          fetchPlants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createPlant = async (plantData) => {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('plants')
      .insert([{
        ...plantData,
        last_watered_at: null,
        next_watering_at: now,
        created_at: now
      }])
      .select()

    if (error) throw error
    return data[0]
  }

  const updatePlant = async (plantId, updates) => {
    const { data, error } = await supabase
      .from('plants')
      .update(updates)
      .eq('id', plantId)
      .select()

    if (error) throw error
    return data[0]
  }

  const deletePlant = async (plantId) => {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', plantId)

    if (error) throw error
  }

  return {
    plants,
    loading,
    error,
    fetchPlants,
    createPlant,
    updatePlant,
    deletePlant
  }
}
