import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: (isLogin?: boolean) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (mounted) {
        setUser(firebaseUser)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: fullName })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signInWithGoogle = async (isLogin = false) => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    
    // If this is the LOGIN page, check if user existed before
    if (isLogin) {
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime
      if (isNewUser) {
        // Delete the auto-created account and block them
        await result.user.delete()
        await signOut(auth)
        return { error: { code: 'auth/user-not-found', message: 'No account found for this Google email. Please sign up first.' } }
      }
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}

  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ 
      user, loading, signUp, signIn, signInWithGoogle, signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}