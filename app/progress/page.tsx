import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Header from "@/components/Header"
import BottomNavigation from "@/components/BottomNavigation"
import Footer from "@/components/Footer"
import { TrendingUp, Trophy, Star, Calendar, Target } from "lucide-react"

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Tree - Track Growth</h1>
          <p className="text-gray-600">Visualize your learning journey and watch your knowledge grow</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-orange-100 to-pink-100 border-orange-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-orange-800 mb-2">245</div>
              <div className="text-sm text-orange-700">Total Piko Points</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-800 mb-2">8</div>
              <div className="text-sm text-green-700">Missions Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-800 mb-2">3</div>
              <div className="text-sm text-blue-700">Learning Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Tree Visualization */}
        <Card className="mb-8 bg-white shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-blue-500" />
              Your Learning Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Your Tree is Growing! 🌱</h3>
              <p className="text-gray-600 mb-6">
                Complete more missions to watch your knowledge tree bloom with new branches and leaves.
              </p>
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Growth Progress</span>
                  <span className="text-sm text-gray-600">Level 1</span>
                </div>
                <Progress value={35} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">Complete 5 more missions to reach Level 2!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Development */}
        <Card className="bg-white shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              Skills Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Emotional Intelligence</span>
                  <span className="text-sm text-gray-600">60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Creativity & Arts</span>
                  <span className="text-sm text-gray-600">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Language & Communication</span>
                  <span className="text-sm text-gray-600">70%</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Problem Solving</span>
                  <span className="text-sm text-gray-600">30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  )
}
