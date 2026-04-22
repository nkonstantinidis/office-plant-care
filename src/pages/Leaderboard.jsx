import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Button'
import styles from './Leaderboard.module.css'

export const Leaderboard = () => {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('waterings')
          .select('user_id')

        if (fetchError) throw fetchError

        const userIds = [...new Set((data || []).map((watering) => watering.user_id).filter(Boolean))]
        let userNames = {}

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds)

          if (profilesError) throw profilesError

          userNames = (profilesData || []).reduce((acc, profile) => {
            acc[profile.id] = profile.display_name
            return acc
          }, {})
        }

        // Count waterings per user and group
        const userWaterings = {}
        data.forEach(watering => {
          userWaterings[watering.user_id] = (userWaterings[watering.user_id] || 0) + 1
        })

        // Build leaderboard
        const leaderboardData = Object.entries(userWaterings)
          .map(([userId, count]) => {
            return {
              userId,
              displayName: userNames[userId] || 'Unknown',
              waterings: count
            }
          })
          .sort((a, b) => b.waterings - a.waterings)

        setLeaderboard(leaderboardData)
        setError('')
      } catch (err) {
        setError('Failed to load leaderboard: ' + err.message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={() => navigate('/dashboard')}>
        ← Back
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏆 Leaderboard</h1>
          <p className={styles.subtitle}>Top plant waterers</p>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className={styles.empty}>
            <p>No waterings yet. Be the first to water a plant!</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.rank}>Rank</div>
              <div className={styles.name}>Name</div>
              <div className={styles.waterings}>Waterings</div>
            </div>
            {leaderboard.map((entry, index) => (
              <div key={entry.userId} className={styles.tableRow}>
                <div className={styles.rank}>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index >= 3 && `#${index + 1}`}
                </div>
                <div className={styles.name}>{entry.displayName}</div>
                <div className={styles.waterings}>
                  <strong>{entry.waterings}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
