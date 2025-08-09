export type Activity = {
    id: string
    name: string
    completed: boolean
    weeklyRecord?: number[] // 0/1 for each day of week
  }
  
  export type ChildProfile = {
    id: string
    name: string
    age: string
    avatar: string
    screenTimeLimit: number
    bedtimeMode: boolean
    contentLock: boolean
    theme?: "ocean" | "space" | "safari"
    activities: Activity[]
  }
  