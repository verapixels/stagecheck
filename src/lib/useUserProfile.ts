// src/lib/useUserProfile.ts
import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  phone: string
  dateOfBirth: string
  photoURL: string
  memberSince: string
  accountType: 'Regular User' | 'Organizer' | 'Admin'
  totalTickets: number
  eventsAttended: number
  // Preferences
  language: string
  timezone: string
  currency: string
  // Notifications
  pushNotifications: boolean
  emailNotifications: boolean
  marketingEmails: boolean
  // Connected accounts
  connectedGoogle: boolean
  googleEmail: string
  // Security
  passwordLastChanged: string
  twoFactorEnabled: boolean
  // Privacy
  profileVisible: boolean
  showAttendedEvents: boolean
  allowTagging: boolean
  dataSharing: boolean
}

const defaults: Partial<UserProfile> = {
  language: 'English',
  timezone: '(GMT+1) West Africa Time (Lagos)',
  currency: 'NGN — Nigerian Naira',
  pushNotifications: true,
  emailNotifications: true,
  marketingEmails: false,
  accountType: 'Regular User',
  profileVisible: true,
  showAttendedEvents: true,
  allowTagging: true,
  dataSharing: false,
  twoFactorEnabled: false,
}

export function useUserProfile(uid?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setProfile({
            uid,
            displayName: d.displayName || d.name || '',
            email: d.email || '',
            phone: d.phone || d.phoneNumber || '',
            dateOfBirth: d.dateOfBirth || d.dob || '',
            photoURL: d.photoURL || d.avatar || '',
            memberSince: d.createdAt?.toDate?.()?.toISOString?.() || d.memberSince || '',
            accountType: d.accountType || defaults.accountType!,
            totalTickets: d.totalTickets || 0,
            eventsAttended: d.eventsAttended || 0,
            language: d.language || defaults.language!,
            timezone: d.timezone || defaults.timezone!,
            currency: d.currency || defaults.currency!,
            pushNotifications: d.pushNotifications ?? defaults.pushNotifications!,
            emailNotifications: d.emailNotifications ?? defaults.emailNotifications!,
            marketingEmails: d.marketingEmails ?? defaults.marketingEmails!,
            connectedGoogle: d.connectedGoogle || false,
            googleEmail: d.googleEmail || '',
            passwordLastChanged: d.passwordLastChanged?.toDate?.()?.toISOString?.() || d.passwordLastChanged || '',
            twoFactorEnabled: d.twoFactorEnabled || false,
            profileVisible: d.profileVisible ?? defaults.profileVisible!,
            showAttendedEvents: d.showAttendedEvents ?? defaults.showAttendedEvents!,
            allowTagging: d.allowTagging ?? defaults.allowTagging!,
            dataSharing: d.dataSharing ?? defaults.dataSharing!,
          })
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [uid])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!uid) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', uid), updates)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid))
    // caller should also call Firebase Auth deleteUser
  }

  return { profile, loading, saving, error, updateProfile, deleteAccount }
}