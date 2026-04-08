import {
  Briefcase, Code2, BookOpen, Dumbbell, Moon, Home, ClipboardList, Car,
  LucideIcon, Tag,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  business:   Briefcase,
  developer:  Code2,
  dev:        Code2,
  coding:     Code2,
  learning:   BookOpen,
  study:      BookOpen,
  gym:        Dumbbell,
  fitness:    Dumbbell,
  exercise:   Dumbbell,
  rest:       Moon,
  sleep:      Moon,
  family:     Home,
  home:       Home,
  admin:      ClipboardList,
  travel:     Car,
  commute:    Car,
}

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name.toLowerCase()] ?? Tag
}

interface Props {
  name: string
  size?: number
  color?: string
  className?: string
}

export function CategoryIcon({ name, size = 14, color, className }: Props) {
  const Icon = getCategoryIcon(name)
  return <Icon size={size} style={color ? { color } : undefined} className={className} strokeWidth={1.8} />
}
