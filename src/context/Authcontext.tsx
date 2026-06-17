import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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
    return () => { mounted = false; unsub() }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: fullName })
      
      // Create Firestore user doc
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: fullName,
        email,
        role: 'user',
        suspended: false,
        createdAt: serverTimestamp(),
        eventsCreated: 0,
        photoURL: '',
      })

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

const signIn = async (email: string, password: string) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: cred.user.email ?? email,
      displayName: cred.user.displayName ?? email.split('@')[0],
      photoURL: cred.user.photoURL ?? '',
      suspended: false,
      lastLogin: serverTimestamp(),
    }, { merge: true })

    return { error: null }
  } catch (error) {
    return { error }
  }
}

  const signInWithGoogle = async (isLogin = false) => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime

    if (isLogin && isNewUser) {
      await result.user.delete()
      await signOut(auth)
      return { error: { code: 'auth/user-not-found', message: 'No account found for this Google email. Please sign up first.' } }
    }

    // Always update Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email ?? '',
      displayName: result.user.displayName ?? '',
      photoURL: result.user.photoURL ?? '',
      suspended: false,
      lastLogin: serverTimestamp(),
    }, { merge: true })

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