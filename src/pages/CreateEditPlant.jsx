import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePlants } from '../hooks/usePlants'
import { Button } from '../components/Button'
import styles from './CreateEditPlant.module.css'

const SUNLIGHT_OPTIONS = [
  'Full sun',
  'Partial shade',
  'Low light',
  'Indirect light'
]

export const CreateEditPlant = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { createPlant, updatePlant } = usePlants()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [illustrations, setIllustrations] = useState([])
  const [imageLoadError, setImageLoadError] = useState({})

  const isEdit = !!id
  const existingPlant = location.state?.plant

  const [formData, setFormData] = useState({
    nickname: existingPlant?.nickname || '',
    plant_type: existingPlant?.plant_type || '',
    water_amount_ml: existingPlant?.water_amount_ml || 200,
    watering_frequency: existingPlant?.watering_frequency || 3,
    sunlight_needs: existingPlant?.sunlight_needs || '',
    location: existingPlant?.location || '',
    illustration: existingPlant?.illustration || ''
  })

  useEffect(() => {
    const loadIllustrations = async () => {
      try {
        const response = await fetch('/illustrations/manifest.json', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Manifest not found')
        }

        const data = await response.json()
        const files = Array.isArray(data?.files) ? data.files : []
        setIllustrations(files)
      } catch {
        // Fallback ensures at least one option is visible in fresh setups.
        setIllustrations(['monstera.png'])
      }
    }

    loadIllustrations()
  }, [])

  useEffect(() => {
    if (!formData.illustration && illustrations.length > 0) {
      setFormData((prev) => ({ ...prev, illustration: illustrations[0] }))
    }
  }, [illustrations, formData.illustration])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'water_amount_ml' || name === 'watering_frequency' 
        ? parseInt(value) 
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.nickname.trim()) {
        throw new Error('Nickname is required')
      }
      if (!formData.plant_type.trim()) {
        throw new Error('Plant type is required')
      }
      if (formData.water_amount_ml <= 0) {
        throw new Error('Water amount must be greater than 0')
      }
      if (formData.watering_frequency <= 0) {
        throw new Error('Watering frequency must be greater than 0')
      }
      if (!formData.sunlight_needs) {
        throw new Error('Please select sunlight needs')
      }
      if (!formData.location.trim()) {
        throw new Error('Location is required')
      }

      if (isEdit) {
        await updatePlant(id, formData)
      } else {
        const plantData = {
          ...formData,
          owner_id: user.id
        }
        await createPlant(plantData)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={() => navigate('/dashboard')}>
        ← Back
      </button>

      <div className={styles.card}>
        <h1 className={styles.title}>
          {isEdit ? '✏️ Edit Plant' : '🌱 Create New Plant'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h2>Basic Information</h2>

            <div className={styles.field}>
              <label htmlFor="nickname">Plant Nickname *</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="e.g., My Monstera"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="plant_type">Plant Type *</label>
              <input
                id="plant_type"
                name="plant_type"
                type="text"
                value={formData.plant_type}
                onChange={handleChange}
                placeholder="e.g., Monstera, Cactus"
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="water_amount_ml">Water Amount (ml) *</label>
                <input
                  id="water_amount_ml"
                  name="water_amount_ml"
                  type="number"
                  value={formData.water_amount_ml}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="watering_frequency">Frequency (days) *</label>
                <input
                  id="watering_frequency"
                  name="watering_frequency"
                  type="number"
                  value={formData.watering_frequency}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="sunlight_needs">Sunlight Needs *</label>
              <select
                id="sunlight_needs"
                name="sunlight_needs"
                value={formData.sunlight_needs}
                onChange={handleChange}
                required
              >
                <option value="">Select sunlight needs</option>
                {SUNLIGHT_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Next to the window, By the desk"
                required
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Choose an Illustration</h2>
            <div className={styles.illustrationGrid}>
              {illustrations.map(img => (
                <button
                  key={img}
                  type="button"
                  className={`${styles.illustrationOption} ${formData.illustration === img ? styles.selected : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, illustration: img }))}
                  title={img}
                >
                  <div className={styles.illustrationPreview}>
                    {!imageLoadError[img] ? (
                      <img
                        src={`/illustrations/${img}`}
                        alt={img}
                        className={styles.illustrationImage}
                        onError={() => {
                          setImageLoadError((prev) => ({ ...prev, [img]: true }))
                        }}
                      />
                    ) : (
                      <div className={styles.illustrationPlaceholder}>🪴</div>
                    )}
                  </div>
                  <p>{img.replace('.png', '').replace('-', ' ')}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? 'Saving...' : (isEdit ? 'Update Plant' : 'Create Plant')}
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
