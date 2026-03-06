import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTheme } from "../App"
import Loader from "../components/Loader"
import {
  PlusCircle,
  Award,
  Target,
  Brain,
  DeleteIcon,
  CheckCircle2,
  RefreshCwIcon,
  Trophy
} from "lucide-react"
import Navbar from "../components/Navbar"
import RatingGraph from "../components/RatingGraph"
import CircularCards from "../components/CircularCards"
import ActivityCalendar from "../components/ActivityCalender"
import LeetCodeModal from "../components/LeetCodeModal"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuth } from "../Context/AuthProvider"
import axios from "axios"
import Footer from "../components/Footer"
import { useParams } from "react-router-dom"
import DeleteModal from "../components/DeleteModal"
import leetcode from "../../public/images/leetcode.png"
import leetcode2 from "../../public/images/leetcode2.avif"
const LeetCode = () => {
  const { username } = useParams()
  const { currentUser, updateProfile } = useAuth()
  // const [toast, setToast] = useState({ show: false, message: "" });
  const { isDarkMode } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  // const [username, setUsername] = useState('');
  const [hasAccount, setHasAccount] = useState(true)
  const [profile, setProfile] = useState({})
  const [recentProblem, setRecentProblem] = useState([])
  const [streak, setStreak] = useState(0)
  const [contestAttend, setcontestAttend] = useState(0)
  const [contestRating, setcontestRating] = useState(0)
  const [contestParticipation, setcontestParticipation] = useState({})
  const [activeYears, setactiveYears] = useState([])
  const [totalActiveDays, settotalActiveDays] = useState(0)
  const [submissionCalendar2025, setsubmissionCalendar2025] = useState([])
  const [submissionCalendar2024, setsubmissionCalendar2024] = useState([])
  const [selectedYear, setSelectedYear] = useState(2025)
  const [loading, setloading] = useState(true)
  const [ShowRefresh, setShowRefresh] = useState(false)
  const [ShowDelete, setShowDelete] = useState(false)
  const [leetusername, setUsernameLeet] = useState("")
  const [hasFetchedUser, setHasFetchedUser] = useState(false)
  const [isDeleteModal, setIsDeleteModal] = useState(false)

  const setToast = message => {
    if (message.success) {
      toast.success(message.text)
    } else {
      toast.error(message.text)
    }
  }

  const [circularData, setcircularData] = useState([
    { label: "Easy", percentage: 0, count: 0, total: 856, color: "#10B981" },
    { label: "Medium", percentage: 0, count: 0, total: 1793, color: "#F59E0B" },
    { label: "Hard", percentage: 0, count: 0, total: 796, color: "#EF4444" }
  ])

  const selectedData =
    selectedYear === 2025 ? submissionCalendar2025 : submissionCalendar2024

  const fetchLeetCodeData = async () => {
    try {
      setloading(true)
      let response = null

      if (currentUser) {
        if (currentUser?.username === username) {
          if (currentUser?.LeetCode) {
            setShowRefresh(true)
            setShowDelete(true)
            //this is self account and logged in
            response = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch/${username}`
            )
          } else {
            //account not added and and logged in
            // console(hasAccount)
            setHasAccount(false)
            return
          }
        } else {
          //not self account and logged in
          response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch/${username}`
          )
          setShowRefresh(false)
          setShowDelete(false)
        }
      } else {
        //not self account and not logged in
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch/${username}`
        )
        setShowRefresh(false)
        setShowDelete(false)
      }

      if (!response || !response.data || response.status !== 200) {
        window.location.href = "/"
        return
      }

      const data = response.data.data
      // // console("LeetCode Data:", data);

      setUsernameLeet(data.username)
      setProfile(data.profile)
      setRecentProblem(data.profile?.recentSubmissions || [])
      setcontestAttend(data.contests?.contestAttend || 0)
      setcontestRating(data.contests?.contestRating || 0)
      // setcontestParticipation(data.contests?.contestParticipation || []);
      setactiveYears(data.submissions_2025?.activeYears || [])
      settotalActiveDays(data.submissions_2025?.totalActiveDays || 0)
      setStreak(data.submissions_2025?.streak || 0)

      // Update circular chart data
      if (data.profile) {
        const updatedCircularData = circularData.map(item => {
          let solvedCount = 0
          if (item.label === "Easy") solvedCount = data.profile.easySolved || 0
          if (item.label === "Medium")
            solvedCount = data.profile.mediumSolved || 0
          if (item.label === "Hard") solvedCount = data.profile.hardSolved || 0

          return {
            ...item,
            count: solvedCount,
            percentage:
              item.total > 0 ? ((solvedCount / item.total) * 100).toFixed(2) : 0
          }
        })

        setcircularData(updatedCircularData)
      }

      // Parse submission calendars
      const parseSubmissions = submissions => {
        return (submissions || []).map(datao => ({
          date: new Date(datao.date * 1000).toISOString().split("T")[0],
          submissions: datao.submissions
        }))
      }

      const parseSubmissions2 = contests => {
        return (contests || []).map(contest => ({
          date: new Date(contest.contest.startTime * 1000)
            .toISOString()
            .split("T")[0],
          ...contest
        }))
      }

      // // console(
      //   "1212",
      //   parseSubmissions2(data.contests?.contestParticipation)
      // )

      setcontestParticipation(
        parseSubmissions2(data.contests?.contestParticipation)
      )

      setsubmissionCalendar2025(
        parseSubmissions(data.submissions_2025?.submissionCalendar)
      )
      setsubmissionCalendar2024(
        parseSubmissions(data.submissions_2024?.submissionCalendar)
      )
      // // console("Submission Calendar 2024:", data.submissions_2024?.submissionCalendar);
      // // console("Submission Calendar 2025:", data.submissions_2025?.submissionCalendar);

      setHasAccount(true)
    } catch (error) {
      window.location.href = "/"
      console.error("Error fetching LeetCode data:", error)
    } finally {
      setloading(false)
    }
  }

  const fetchLeetCodeDataFromDB = async () => {
    try {
      let response = null

      // console(currentUser)
      if (currentUser) {
        if (currentUser?.username === username) {
          if (currentUser?.LeetCode) {
            setShowRefresh(true)
            setShowDelete(true)
            const leetid = currentUser?.LeetCode
            response = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch-from-db/${leetid}`
            )
          } else {
            // console(hasAccount)
            setHasAccount(false)
            return
          }
        } else {
          response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch/${username}`
          )
          setShowRefresh(false)
          setShowDelete(false)
        }
      } else {
        response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/server/leetcode/fetch/${username}`
        )
        setShowRefresh(false)
        setShowDelete(false)
      }

      // // // console("LeetCode Data:", data);
      // // // **Check if response is invalid**
      if (!response || !response.data) {
        window.location.href = "/"
        return
      }

      const data = response.data.data
      // // console("LeetCode Data:", data);

      setUsernameLeet(data.username)
      setProfile(data.profile)
      setRecentProblem(data.profile?.recentSubmissions || [])
      setcontestAttend(data.contests?.contestAttend || 0)
      setcontestRating(data.contests?.contestRating || 0)
      setactiveYears(data.submissions_2025?.activeYears || [])
      settotalActiveDays(data.submissions_2025?.totalActiveDays || 0)
      setStreak(data.submissions_2025?.streak || 0)

      // **Update circular chart data**
      if (data.profile) {
        const updatedCircularData = circularData.map(item => {
          let solvedCount = 0
          if (item.label === "Easy") solvedCount = data.profile.easySolved || 0
          if (item.label === "Medium")
            solvedCount = data.profile.mediumSolved || 0
          if (item.label === "Hard") solvedCount = data.profile.hardSolved || 0

          return {
            ...item,
            count: solvedCount,
            percentage:
              item.total > 0 ? ((solvedCount / item.total) * 100).toFixed(2) : 0
          }
        })

        setcircularData(updatedCircularData)
      }

      // **Parse submission calendars**
      const parseSubmissions = submissions => {
        return (submissions || []).map(datao => ({
          date: new Date(datao.date * 1000).toISOString().split("T")[0],
          submissions: datao.submissions
        }))
      }

      const parseSubmissions2 = contests => {
        return (contests || []).map(contest => ({
          date: new Date(contest.contest.startTime * 1000)
            .toISOString()
            .split("T")[0],
          ...contest
        }))
      }

      // // console("1212",parseSubmissions2);

      setcontestParticipation(
        parseSubmissions2(data.contests?.contestParticipation)
      )
      setsubmissionCalendar2025(
        parseSubmissions(data.submissions_2025?.submissionCalendar)
      )
      setsubmissionCalendar2024(
        parseSubmissions(data.submissions_2024?.submissionCalendar)
      )

      // // console("Submission Calendar 2024:", data.submissions_2024?.submissionCalendar);
      // // console("Submission Calendar 2025:", data.submissions_2025?.submissionCalendar);

      setHasAccount(true)
    } catch (error) {
      console.error("Error fetching LeetCode data:", error)
      window.location.href = "/"
    } finally {
      setloading(false)
    }
  }

  const deleteLeetCodeAccount = async () => {
    // try {
    //   if (
    //     currentUser &&
    //     currentUser.username === username &&
    //     currentUser.LeetCode
    //   ) {
    //     ;() => {
    //       setIsDeleteModal(true)
    //     }
    //     // const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/server/leetcode/delete-leetcode/${leetid}`)
    //   }
    // } catch (error) {
    //   console.error("Error deleting LeetCode data:", error)
    // }
  }

  const fetchUpdatedUser = async () => {
    try {
      if (!currentUser?._id) {
        // console("No valid user ID found")
        return
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/server/user/get-user/${currentUser._id}`
      )
      // console("111", response.data?.data)
      if (response.status === 200 && response.data?.data) {
        await updateProfile(response.data.data)
      } else {
        // console("Invalid response received")
      }
    } catch (error) {
      console.error("Unable to fetch user", error)
    }
  }

  useEffect(() => {
    if (!hasFetchedUser && currentUser) {
      setHasFetchedUser(true)
      fetchUpdatedUser()
    }
    fetchLeetCodeDataFromDB()
  }, [currentUser])

  if (loading) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2">
        <Loader />
        <p className="relative right-1/2">
          Wait upto minute, it needs some time...!
        </p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <ToastContainer position="top-right" autoClose={3000} />
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`relative py-20 px-5 overflow-hidden ${
            isDarkMode
              ? "bg-gray-900"
              : "bg-gradient-to-br from-sky-500 to-blue-600"
          }`}
        >
          <div className="absolute inset-0">
            <img
              src={leetcode2}
              alt="Coding Background"
              className={`w-full h-full object-cover ${
                isDarkMode ? "opacity-10" : "opacity-2"
              }`}
            />
          </div>
          <div className="container mx-auto relative z-10 mt-10">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-white p-1 py-3 mb-6"
              >
                <img src={leetcode} className="h-12 w-25" alt="LeetCode"></img>
                {/* <Code className="h-12 w-12 text-blue-600" /> */}
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-white text-center mb-6"
              >
                LeetCode Profile
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white text-center max-w-3xl mb-8"
              >
                Track your progress and showcase your problem-solving skills
              </motion.p>
              {!hasAccount && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Add LeetCode Account</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.section>

        {hasAccount ? (
          <>
            <section
              className={`py-12 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="container mx-auto px-4">
                <h2
                  className={`text-3xl text-center font-bold mb-8 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  LeetCode UserId : {leetusername}
                </h2>

                {ShowRefresh && (
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={fetchLeetCodeData}
                    className="flex justify-center items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors mx-auto w-fit"
                  >
                    <RefreshCwIcon className="h-5 w-5" />
                    <span>Refresh</span>
                  </motion.button>
                )}
              </div>
            </section>
            <section
              className={`-mt-10 py-12 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      icon: <Target />,
                      label: "Total Solved",
                      value: profile.totalSolved
                    },
                    {
                      icon: <Trophy />,
                      label: "Contest Rating",
                      value: Math.floor(contestRating)
                    },
                    {
                      icon: <Award />,
                      label: "Global Rank",
                      value: `#${profile.ranking}`
                    },
                    {
                      icon: <CheckCircle2 />,
                      label: "Acceptance Rate",
                      value: profile.acceptanceRate
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 rounded-xl ${
                        isDarkMode ? "bg-gray-900" : "bg-gray-50"
                      } shadow-lg`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-blue-500">{stat.icon}</div>
                        <div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {stat.label}
                          </p>
                          <p
                            className={`text-2xl font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Problem Solving Progress */}
            <section
              className={`py-12 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
            >
              <div className="container mx-auto px-4">
                <h2
                  className={`text-3xl text-center font-bold mb-8 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Problem Solving Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      type: "Easy",
                      count: profile.easySolved,
                      total: 856,
                      color: "bg-green-500"
                    },
                    {
                      type: "Medium",
                      count: profile.mediumSolved,
                      total: 1793,
                      color: "bg-yellow-500"
                    },
                    {
                      type: "Hard",
                      count: profile.hardSolved,
                      total: 796,
                      color: "bg-red-500"
                    }
                  ].map((level, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 rounded-xl ${
                        isDarkMode ? "bg-gray-800" : "bg-white"
                      } shadow-lg`}
                    >
                      <div className="flex justify-between mb-2">
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-900"
                          }
                        >
                          {level.type}
                        </span>
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {level.count}/{level.total}
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${level.color}`}
                          style={{
                            width: `${(level.count / level.total) * 100}%`
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                  {circularData.map((item, index) => (
                    <CircularCards
                      key={index}
                      percentage={item.percentage}
                      color={item.color}
                      label={item.label}
                      count={item.count}
                      total={item.total}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            </section>
            <section
              className={`py-12 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <h2
                className={`text-3xl text-center font-bold mb-8 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Contest Ratings
              </h2>
              <RatingGraph
                data={contestParticipation}
                isDarkMode={isDarkMode}
              />
            </section>
            <section
              className={`py-12 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <h2
                className={`text-3xl font-bold  text-center mb-8 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Activity Heatmap
              </h2>
              <div className="flex justify-between items-center px-4">
                <select
                  value={selectedYear}
                  onChange={e => {
                    const year = parseInt(e.target.value)
                    // console("Year Selected:", year)
                    setSelectedYear(year)
                  }}
                  className="px-4 py-2 border rounded-lg text-gray-700 bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
              <ActivityCalendar
                data={selectedData}
                selectedYear={selectedYear}
                isDarkMode={isDarkMode}
              />
            </section>
            <section
              className={`py-12 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="container mx-auto px-4">
                <h2
                  className={`text-3xl text-center font-bold mb-8 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Recent Submissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <th
                          className={`py-4 px-6 text-left ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Problem
                        </th>

                        <th
                          className={`py-4 px-6 text-right ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProblem.map((problem, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border-b ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <td
                            className={`py-4 px-6 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {problem.title}
                          </td>
                          <td>
                            {/* <span className={`px-3 py-1 rounded-full text-sm`}>
                          {problem.statusDisplay}
                        </span> */}
                          </td>
                          <td
                            className={`py-4 px-6 ${
                              problem.statusDisplay === "Accepted"
                                ? "text-green-500"
                                : "text-yellow-500"
                            }`}
                          >
                            {problem.statusDisplay}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {ShowDelete && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setIsDeleteModal(true)}
                  className="flex justify-center items-center space-x-2 mt-10 px-6 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-blue-50 transition-colors mx-auto w-fit"
                >
                  <DeleteIcon className="h-5 w-5" />
                  <span>Remove LeetCode Account</span>
                </motion.button>
              )}
            </section>
          </>
        ) : (
          // Info Section for users without account
          <section
            className={`py-20 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Brain className="h-12 w-12 text-blue-500" />,
                    title: "3000+ Problems",
                    description:
                      "Access a vast collection of coding problems across various difficulty levels"
                  },
                  {
                    icon: <Trophy className="h-12 w-12 text-blue-500" />,
                    title: "Weekly Contests",
                    description:
                      "Participate in weekly coding competitions and improve your ranking"
                  },
                  {
                    icon: <Target className="h-12 w-12 text-blue-500" />,
                    title: "Interview Preparation",
                    description:
                      "Practice problems frequently asked in technical interviews"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-xl shadow-lg ${
                      isDarkMode ? "bg-gray-900" : "bg-gray-50"
                    }`}
                  >
                    <div className="mb-4">{feature.icon}</div>
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isModalOpen && (
          <LeetCodeModal
            isModalOpen={isModalOpen}
            setToast={setToast}
            setIsModalOpen={setIsModalOpen}
          />
        )}

        {isDeleteModal && (
          <DeleteModal
            accid={currentUser.LeetCode}
            isDeleteModal={isDeleteModal}
            setIsDeleteModal={setIsDeleteModal}
            setToast={setToast}
            acc={"LeetCode"}
            id={currentUser._id}
          />
        )}
      </div>
      <Footer />
    </>
  )
}

export default LeetCode
