import mongoose from "mongoose";
import User from '../Models/User.js'

const LeetCodeUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  profile: {
    ranking: Number,
    reputation: Number,
    totalSolved: Number,
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number,
    acceptanceRate:Number,
    recentSubmissions:[Object],
  },
  contests: {
    contestAttend:Number,
    contestRating: Number,
    contestParticipation: [Object],
  },
  submissions_2024: {
    activeYears:[Number],
    totalActiveDays:Number,
    streak:Number,
    submissionCalendar: [
        {
          date: Number, // UNIX timestamp
          submissions: Number, // Number of submissions on this date
        }
      ],
  },
  submissions_2025: {
    activeYears:[Number],
    totalActiveDays:Number,
    streak:Number,
    submissionCalendar: [
        {
          date: Number, // UNIX timestamp
          submissions: Number, // Number of submissions on this date
        }
      ],
  },
});

export default mongoose.model("LeetCodeUser", LeetCodeUserSchema);

