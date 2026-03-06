import axios from 'axios';
import User from '../../Models/User.js';
import LeetCodeUser from '../../Models/LeetCode.js';

export const updateLeetCodeUserData = async (username) => {
  try {
    // console("Username:", username);
    // Find User in the database
    const findUser = await User.findOne({ username }).exec();
    if (!findUser) {
      throw new Error("User not found");
    }

    // Find the associated LeetCodeUser
    let existingUser = await LeetCodeUser.findById(findUser.LeetCode).exec();
    if (!existingUser) {
      throw new Error("LeetCode user not found");
    }

    // Fetch data from LeetCode APIs
    const profilePromise = axios.get(`${process.env.leetcode_api_to_check_user1}/${existingUser.username}`).catch(() => null);
    const contestPromise = axios.get(`${process.env.leetcode_api}/${existingUser.username}/contest`).catch(() => null);
    const submissionsPromise2025 = axios.get(`${process.env.leetcode_api}/userProfileCalendar?username=${existingUser.username}&year=2025`).catch(() => null);
    const submissionsPromise2024 = axios.get(`${process.env.leetcode_api}/userProfileCalendar?username=${existingUser.username}&year=2024`).catch(() => null);

    // Await all API responses
    const [profileRes, contestRes, submissionsRes2024, submissionsRes2025] = await Promise.all([
      profilePromise,
      contestPromise,
      submissionsPromise2024,
      submissionsPromise2025
    ]);

    let profileData;
    let acceptanceRate = 0;
    const profilePromise2 = await axios.get(`${process.env.leetcode_api_to_check_user2}/${username}`).catch(() => null);
    if (profilePromise2?.data) {
      acceptanceRate = profilePromise2.data.acceptanceRate;
    }
    if (!profileRes?.data) {
      const profilePromise2 = await axios.get(`${process.env.leetcode_api_to_check_user2}/${username}`).catch(() => null);
      profileData = profilePromise2?.data || null;
    } else {
      profileData = profileRes.data;
    }

    const contestData = contestRes?.data || null;
    const submissionsData2024 = submissionsRes2024?.data?.data?.matchedUser?.userCalendar || null;
    const submissionsData2025 = submissionsRes2025?.data?.data?.matchedUser?.userCalendar || null;

    if (!profileData && !contestData && !submissionsData2024 && !submissionsData2025) {
      throw new Error("Failed to fetch user data from LeetCode APIs");
    }

    // Convert submission calendars
    const submissionCalendar2024 = submissionsData2024?.submissionCalendar
      ? Object.entries(JSON.parse(submissionsData2024.submissionCalendar)).map(([date, submissions]) => ({
          date: Number(date),
          submissions: submissions,
        }))
      : [];

    const submissionCalendar2025 = submissionsData2025?.submissionCalendar
      ? Object.entries(JSON.parse(submissionsData2025.submissionCalendar)).map(([date, submissions]) => ({
          date: Number(date),
          submissions: submissions,
        }))
      : [];

    // console("Acceptance Rate:", acceptanceRate);
    existingUser.profile = profileData
      ? {
          ranking: profileData.ranking,
          totalSolved: profileData.totalSolved,
          easySolved: profileData.easySolved,
          mediumSolved: profileData.mediumSolved,
          hardSolved: profileData.hardSolved,
          acceptanceRate: acceptanceRate || existingUser.profile.acceptanceRate,
          recentSubmissions: profileData.recentSubmissions,
        }
      : existingUser.profile;

    // console("Contest Data:", contestData);
    existingUser.contests = contestData
      ? {
          contestAttend: contestData.contestAttend,
          contestRating: Number.isFinite(contestData.contestRating)
            ? Math.floor(contestData.contestRating)
            : existingUser.contests.contestRating,
          contestParticipation: contestData.contestParticipation || existingUser.contests.contestParticipation,
        }
      : existingUser.contests;

    existingUser.submissions_2024 = submissionsData2024
      ? {
          activeYears: submissionsData2024.activeYears || [],
          streak: submissionsData2024.streak || 0,
          totalActiveDays: submissionsData2024.totalActiveDays || 0,
          submissionCalendar: submissionCalendar2024,
        }
      : existingUser.submissions_2024;

    existingUser.submissions_2025 = submissionsData2025
      ? {
          activeYears: submissionsData2025.activeYears || [],
          streak: submissionsData2025.streak || 0,
          totalActiveDays: submissionsData2025.totalActiveDays || 0,
          submissionCalendar: submissionCalendar2025,
        }
      : existingUser.submissions_2025;

    await existingUser.save();
    await User.findByIdAndUpdate(findUser._id, { LeetCode: existingUser._id });

    return existingUser;
  } catch (error) {
    console.error("Error updating/retrieving LeetCode user data:", error);
    throw error;
  }
};
