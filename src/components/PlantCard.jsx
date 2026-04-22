import React, { useState } from 'react'
import { getPlantStatus, formatRelativeTime, formatDate } from '../lib/utils'
import { Button } from './Button'
import styles from './PlantCard.module.css'

export const PlantCard = ({
  plant,
  onWater,
  onEdit,
  onDelete,
  loading = false,
  isOwner = false,
  lastWateredByDisplayName = null
}) => {
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const status = getPlantStatus(plant.next_watering_at)
  const statusColor = {
    red: '#ef4444',
    yellow: '#f59e0b',
    green: '#10b981'
  }[status]

  return (
    <div 
      className={styles.card}
      style={{ borderColor: statusColor, borderLeftWidth: '4px' }}
    >
      <div className={styles.header}>
        <div className={styles.illustration}>
          {plant.illustration ? (
            <img src={`/illustrations/${plant.illustration}`} alt={plant.nickname} />
          ) : (
            <div className={styles.placeholder}>🪴</div>
          )}
        </div>
        <div className={styles.info}>
          <h3 className={styles.nickname}>{plant.nickname}</h3>
          <p className={styles.type}>{plant.plant_type}</p>
        </div>
        {isOwner && (
          <div className={styles.actions}>
            <button 
              className={styles.actionBtn}
              onClick={() => onEdit(plant)}
              title="Edit"
            >
              ✏️
            </button>
            <button 
              className={styles.actionBtn}
              onClick={() => {
                if (confirm('Delete this plant?')) {
                  onDelete(plant.id)
                }
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.label}>Water:</span>
          <span>{plant.water_amount_ml} ml every {plant.watering_frequency} days</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.label}>Sunlight:</span>
          <span>{plant.sunlight_needs}</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.label}>Location:</span>
          <span>{plant.location}</span>
        </div>
      </div>

      <div className={styles.wateringInfo}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Last watered:</span>
          <span>
            {plant.last_watered_at
              ? `by ${lastWateredByDisplayName || 'Someone'} • ${formatRelativeTime(plant.last_watered_at)}`
              : 'Never'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Next watering:</span>
          <span>{formatDate(plant.next_watering_at)}</span>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <Button
          onClick={() => onWater(plant)}
          disabled={status === 'green' || loading}
          variant={status === 'red' ? 'danger' : 'primary'}
        >
          {loading ? '💧...' : '💧 Water this plant'}
        </Button>
        <button
          className={styles.feedToggle}
          onClick={() => setShowActivityFeed(!showActivityFeed)}
        >
          📋
        </button>
      </div>

      {showActivityFeed && (
        <div className={styles.activityFeed}>
          <h4>Activity</h4>
          <p style={{ fontSize: '12px', color: '#999' }}>Last waterings shown here</p>
        </div>
      )}
    </div>
  )
}
