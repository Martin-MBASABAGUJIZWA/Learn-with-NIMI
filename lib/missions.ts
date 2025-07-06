import { prisma } from './db'

export const MissionService = {
  // Get today's missions
  async getTodaysMissions() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return await prisma.dailyMission.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })
  },

  // Complete a mission
  async completeMission(missionId: string) {
    return await prisma.dailyMission.update({
      where: { id: missionId },
      data: { isCompleted: true }
    })
  },

  // Create a new mission
  async createMission(data: {
    title: string
    description: string
    date: Date
    // ... other fields
  }) {
    return await prisma.dailyMission.create({ data })
  }
}