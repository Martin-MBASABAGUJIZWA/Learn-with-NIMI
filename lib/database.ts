// Database schema and operations for NIMI missions

export interface Mission {
  id: string
  day: number
  date: string
  time: string
  title: string
  type:
    | "Early Morning"
    | "Creative Workshop"
    | "Cultural Workshop"
    | "Building Workshop"
    | "Fine Observation"
    | "After Nap"
  duration: string
  points: number
  objectives: string[]
  activity: string
  pikoVictory: string
  materials: string[]
  completed: boolean
  completedAt?: Date
  icon: string
}

export interface User {
  id: string
  name: string
  age: number
  pikoPoints: number
  currentStreak: number
  completedMissions: string[]
  achievements: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DayProgram {
  day: number
  date: string
  title: string
  theme: string
  missions: Mission[]
}

// Mock database operations (replace with real database in production)
export class MissionDatabase {
  private static missions: Mission[] = []
  private static users: User[] = []

  static async getMissionsByDay(day: number): Promise<Mission[]> {
    // In production, this would query your database
    return this.missions.filter((mission) => mission.day === day)
  }

  static async completeMission(userId: string, missionId: string): Promise<void> {
    // Update mission completion status
    const mission = this.missions.find((m) => m.id === missionId)
    if (mission) {
      mission.completed = true
      mission.completedAt = new Date()
    }

    // Update user progress
    const user = this.users.find((u) => u.id === userId)
    if (user && mission) {
      user.completedMissions.push(missionId)
      user.pikoPoints += mission.points
      user.updatedAt = new Date()
    }
  }

  static async getUserProgress(userId: string): Promise<User | null> {
    return this.users.find((u) => u.id === userId) || null
  }

  static async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(user)
    return user
  }
}
