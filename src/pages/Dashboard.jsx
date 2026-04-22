import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePlants } from '../hooks/usePlants'
import { useWaterings } from '../hooks/useWaterings'
import { PlantCard } from '../components/PlantCard'
import { Button } from '../components/Button'
import styles from './Dashboard.module.css'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { plants, loading: plantsLoading, deletePlant, fetchPlants } = usePlants()
  const { waterPlant, waterings, fetchWaterings } = useWaterings()
  const [watering, setWatering] = useState(false)
  const [notification, setNotification] = useState(null)

  const currentDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Someone'

  const latestWateringByPlant = useMemo(() => {
    const map = {}
    waterings.forEach((watering) => {
      if (!map[watering.plant_id]) {
        map[watering.plant_id] = watering
      }
    })
    return map
  }, [waterings])

  const handleWaterPlant = async (plant) => {
    setWatering(true)
    try {
      await waterPlant(plant.id, user.id, plant)
      await Promise.all([fetchPlants(), fetchWaterings()])
      setNotification(`✅ Watered ${plant.nickname}!`)
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      setNotification(`❌ ${error.message}`)
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setWatering(false)
    }
  }

  const handleEditPlant = (plant) => {
    navigate(`/edit/${plant.id}`, { state: { plant } })
  }

  const handleDeletePlant = async (plantId) => {
    try {
      await deletePlant(plantId)
      setNotification('✅ Plant deleted')
      setTimeout(() => setNotification(null), 2000)
    } catch (error) {
      setNotification(`❌ ${error.message}`)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>🌱 Office Plants</h1>
          <p className={styles.subtitle}>Welcome, {user?.user_metadata?.display_name || user?.email}</p>
        </div>
        <div className={styles.headerActions}>
          <Button onClick={() => navigate('/create')}>+ New Plant</Button>
          <Button variant="secondary" onClick={() => navigate('/leaderboard')}>🏆 Leaderboard</Button>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      {notification && (
        <div className={styles.notification}>
          {notification}
        </div>
      )}

      <main className={styles.main}>
        {plantsLoading ? (
          <div className={styles.loading}>Loading plants...</div>
        ) : plants.length === 0 ? (
          <div className={styles.empty}>
            <p>No plants yet. Create one to get started! 🌿</p>
            <Button onClick={() => navigate('/create')} size="lg">Create First Plant</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {plants.map((plant) => {
              const lastWatering = latestWateringByPlant[plant.id]
              const lastWateredByDisplayName = lastWatering?.profiles?.display_name
                || (lastWatering?.user_id === user?.id ? currentDisplayName : null)

              return (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onWater={handleWaterPlant}
                  onEdit={handleEditPlant}
                  onDelete={handleDeletePlant}
                  loading={watering}
                  isOwner={plant.owner_id === user?.id}
                  lastWateredByDisplayName={lastWateredByDisplayName}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
