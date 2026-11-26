import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profileState, setProfileState] = useState({
    userId: null,
    profile: null,
    error: '',
  })
  const [authError, setAuthError] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let active = true
    let authEventReceived = false
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      authEventReceived = true
      setAuthError('')
      setSession(s)
      setInitialized(true)
    })

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authEventReceived) return
        if (error) setAuthError(error.message)
        setSession(error ? null : data.session)
        setInitialized(true)
      })
      .catch((error) => {
        if (!active || authEventReceived) return
        setAuthError(error.message || 'Unable to restore the current session.')
        setSession(null)
        setInitialized(true)
      })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!initialized || !userId) return undefined
    let active = true

    supabase
      .from('profiles')
      .select('id, institution_id, role, first_name, last_name, email, status, deleted_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setProfileState({ userId, profile: null, error: error.message })
        } else if (!data) {
          setProfileState({
            userId,
            profile: null,
            error: 'No profile is associated with this account.',
          })
        } else {
          setProfileState({ userId, profile: data, error: '' })
        }
      })
      .catch((error) => {
        if (!active) return
        setProfileState({
          userId,
          profile: null,
          error: error.message || 'Unable to load the account profile.',
        })
      })

    return () => {
      active = false
    }
  }, [initialized, userId])

  const profile = profileState.userId === userId ? profileState.profile : null
  const profileError = profileState.userId === userId ? profileState.error : ''
  const loading =
    !initialized ||
    Boolean(userId && profileState.userId !== userId)

  const value = {
    session,
    profile,
    role: profile?.status === 'active' ? profile.role : null,
    loading,
    profileError,
    authError,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, meta) =>
      supabase.auth.signUp({ email, password, options: { data: meta } }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?route=%2Freset`,
      }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
