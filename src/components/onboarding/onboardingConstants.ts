import {
  Music2, Star, Presentation, Trophy, Heart, GraduationCap, Sparkles, Mic2,
} from 'lucide-react'
import type { SubmissionField } from './onboardingTypes'

export const EVENT_TYPES = [
  { id: 'choir',       icon: Music2,        label: 'Choir Concert',      desc: 'Multi-choir song registration with clash detection', color: '#22C55E' },
  { id: 'talent',      icon: Star,          label: 'Talent Show',        desc: 'Open performances across multiple categories',       color: '#F59E0B' },
  { id: 'conference',  icon: Presentation,  label: 'Conference',         desc: 'Speakers, topics, sessions and presentations',       color: '#3B82F6' },
  { id: 'competition', icon: Trophy,        label: 'School Competition', desc: 'Academic or performance competitions with judging',  color: '#8B5CF6' },
  { id: 'drama',       icon: Star,          label: 'Drama / Theatre',    desc: 'Plays, cast management and stage requirements',      color: '#EC4899' },
  { id: 'worship',     icon: Heart,         label: 'Worship Night',      desc: 'Worship sets, ministers and service flow',           color: '#14B8A6' },
  { id: 'openmic',     icon: Mic2,          label: 'Open Mic',           desc: 'Solo performers, sign-ups and slot management',     color: '#F97316' },
  { id: 'graduation',  icon: GraduationCap, label: 'Award / Graduation', desc: 'Ceremony scheduling, awardees and protocol',        color: '#06B6D4' },
  { id: 'custom',      icon: Sparkles,      label: 'Custom Event',       desc: 'Build your own event type from scratch',            color: '#A78BFA' },
] as const

export const ALL_MODULES = [
  { id: 'music',     label: 'Music Submissions',   desc: 'Song titles, audio uploads, duration',        color: '#22C55E' },
  { id: 'judging',   label: 'Judging & Scoring',    desc: 'Judge panels, live scoring, rankings',         color: '#F59E0B' },
  { id: 'ticketing', label: 'Ticketing',            desc: 'Ticket creation, QR codes, attendance',       color: '#EC4899' },
  { id: 'resources', label: 'Resource Management',  desc: 'Mics, instruments, rooms, stage time',         color: '#8B5CF6' },
  { id: 'live',      label: 'Live Stage Control',   desc: 'Real-time stage panel during the event',      color: '#F97316' },
  { id: 'messaging', label: 'Communication',        desc: 'Announcements and performer messaging',       color: '#14B8A6' },
  { id: 'media',     label: 'Media Hub',            desc: 'Upload videos, recordings, highlights',       color: '#3B82F6' },
  { id: 'analytics', label: 'Analytics',            desc: 'Participation rates, metrics, reports',       color: '#06B6D4' },
  { id: 'clash',     label: 'Clash Detection',      desc: 'Prevent duplicate songs, slots, performers',  color: '#22C55E' },
  { id: 'voting',    label: 'Live Voting',          desc: 'Audience votes and live poll results',        color: '#A78BFA' },
] as const

export const DEFAULT_MODULES: Record<string, string[]> = {
  choir: ['music', 'clash', 'live', 'messaging', 'ticketing'],
  talent: ['judging', 'live', 'ticketing', 'messaging', 'voting'],
  conference: ['resources', 'live', 'messaging', 'analytics', 'media'],
  competition: ['judging', 'clash', 'live', 'messaging', 'analytics'],
  drama: ['resources', 'live', 'ticketing', 'messaging', 'media'],
  worship: ['music', 'clash', 'live', 'messaging', 'resources'],
  openmic: ['music', 'live', 'ticketing', 'messaging'],
  graduation: ['live', 'ticketing', 'messaging', 'media', 'analytics'],
  custom: [],
}

export const DEFAULT_SUBMISSION_FIELDS: Record<string, SubmissionField[]> = {
  choir: [
    { id: 'groupName', label: 'Choir / Group Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'songSearch', label: 'Song Search', type: 'search', required: true, alwaysOn: true },
    { id: 'photo', label: 'Choir Photo', type: 'file', required: false, alwaysOn: false },
  ],
  talent: [
    { id: 'performerName', label: 'Performer / Group Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'category', label: 'Act Category', type: 'select', required: true, alwaysOn: true },
    { id: 'audio', label: 'Audio Upload', type: 'file', required: false, alwaysOn: false },
    { id: 'photo', label: 'Performer Photo', type: 'file', required: false, alwaysOn: false },
  ],
  conference: [
    { id: 'speakerName', label: 'Speaker Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'topic', label: 'Session Title / Topic', type: 'text', required: true, alwaysOn: true },
    { id: 'bio', label: 'Speaker Bio', type: 'text', required: false, alwaysOn: false },
    { id: 'photo', label: 'Speaker Photo', type: 'file', required: false, alwaysOn: false },
  ],
  competition: [
    { id: 'teamName', label: 'Team / Student Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'category', label: 'Competition Category', type: 'select', required: true, alwaysOn: true },
    { id: 'members', label: 'Team Members', type: 'text', required: false, alwaysOn: false },
    { id: 'equipment', label: 'Required Equipment', type: 'text', required: false, alwaysOn: false },
  ],
  drama: [
    { id: 'dramaTitle', label: 'Drama Title', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'castSize', label: 'Cast Size', type: 'number', required: true, alwaysOn: false },
    { id: 'poster', label: 'Drama Poster', type: 'file', required: false, alwaysOn: false },
    { id: 'script', label: 'Script Upload', type: 'file', required: false, alwaysOn: false },
  ],
  worship: [
    { id: 'ministerName', label: 'Minister / Leader Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'songSearch', label: 'Song Search', type: 'search', required: true, alwaysOn: true },
    { id: 'photo', label: 'Minister Photo', type: 'file', required: false, alwaysOn: false },
  ],
  openmic: [
    { id: 'performerName', label: 'Performer Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'actType', label: 'Act Type', type: 'select', required: true, alwaysOn: true },
    { id: 'audio', label: 'Audio Upload', type: 'file', required: false, alwaysOn: false },
    { id: 'photo', label: 'Performer Photo', type: 'file', required: false, alwaysOn: false },
  ],
  graduation: [
    { id: 'awardeeName', label: 'Awardee / Graduand Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
    { id: 'award', label: 'Award / Programme', type: 'text', required: true, alwaysOn: true },
    { id: 'photo', label: 'Awardee Photo', type: 'file', required: false, alwaysOn: false },
  ],
  custom: [
    { id: 'entryName', label: 'Entry / Participant Name', type: 'text', required: true, alwaysOn: true },
    { id: 'email', label: 'Contact Email', type: 'email', required: true, alwaysOn: true },
  ],
}

export function generateEventCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}