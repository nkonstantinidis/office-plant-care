import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const upsertProfile = async (authUser) => {
    if (!authUser?.id) return

    const fallbackName = authUser.email?.split('@')[0] || 'user'
    const displayName = authUser.user_metadata?.display_name || fallbackName

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          display_name: displayName,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )

    // Profiles table may not exist yet; avoid blocking login in that case.
    if (error && import.meta.env.DEV) {
      console.warn('Profile sync skipped:', error.message)
    }
  }

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          upsertProfile(session.user)
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        upsertProfile(session.user)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (displayName, password) => {
    const email = `${displayName.toLowerCase()}@workshop.local`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
