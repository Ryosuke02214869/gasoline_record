import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function initialize() {
    loading.value = true
    try {
      // 現在のセッションを取得
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user ?? null

      // 認証状態の変更を監視
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    user.value = data.user
    session.value = data.session

    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    user.value = null
    session.value = null
  }

  return {
    // State
    user,
    session,
    loading,
    // Getters
    isAuthenticated,
    // Actions
    initialize,
    signUp,
    signIn,
    signOut,
  }
})
