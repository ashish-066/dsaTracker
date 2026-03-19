import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Setup data directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Verification Config
const VERIFY_PROBLEM_SLUG = "create-hello-world-function";
const VERIFY_PROBLEM_NAME = "Create Hello World Function";
const VERIFY_PROBLEM_URL = `https://leetcode.com/problems/${VERIFY_PROBLEM_SLUG}/description/`;

/**
 * Save data to a JSON file in demo/data/
 */
const saveToJSON = (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Saved: ${filePath}`);
    return filePath;
};

/**
 * Read data from a JSON file in demo/data/
 */
const readFromJSON = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    try {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (!content) return null;
        return JSON.parse(content);
    } catch (e) {
        console.error(`❌ Error parsing JSON from ${filename}:`, e.message);
        return null;
    }
};

/**
 * List all stored users
 */
const listStoredUsers = () => {
    if (!fs.existsSync(DATA_DIR)) return [];
    return fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith('leetcode_') && f.endsWith('.json'))
        .map(f => f.replace('leetcode_', '').replace('.json', ''));
};

// ──────────────────────────────────────────────────────────
// 1) VERIFY: Check if a LeetCode username exists
// GET /check-username/:username
// ──────────────────────────────────────────────────────────
export const fetchUserExist = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required.' });
        }

        console.log(`🔍 Verification initiated for: ${username}`);
        console.log(`🔗 Sending Problem URL: ${VERIFY_PROBLEM_URL}`);

        // Get current server time for timestamp check later
        const startTime = Math.floor(Date.now() / 1000);

        // Verify user exists first (basic profile check)
        const gqlQuery = {
            query: `query($username: String!) { matchedUser(username: $username) { username } }`,
            variables: { username }
        };
        const gqlRes = await axios.post('https://leetcode.com/graphql', gqlQuery).catch(() => null);

        if (!gqlRes?.data?.data?.matchedUser) {
            return res.status(200).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            data: {
                username,
                problemUrl: VERIFY_PROBLEM_URL,
                problemSlug: VERIFY_PROBLEM_SLUG,
                problemName: VERIFY_PROBLEM_NAME,
                startTime: startTime // Client will send this back to us to verify
            },
        });
    } catch (error) {
        console.error('Error initiating verification:', error.message);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

// ──────────────────────────────────────────────────────────
// 1.1) Validate Submission: Check if user submitted the specific problem after startTime
// POST /check-submission { username, startTime }
// ──────────────────────────────────────────────────────────
export const checkSubmission = async (req, res) => {
    try {
        const { username, startTime } = req.body;

        console.log(`⏱️ Checking submission for ${username} (threshold: ${startTime})`);

        const gqlQuery = {
            query: `
                query recentSubmissions($username: String!, $limit: Int) {
                    recentSubmissionList(username: $username, limit: $limit) {
                        titleSlug
                        statusDisplay
                        timestamp
                    }
                }
            `,
            variables: { username, limit: 5 }
        };

        const response = await axios.post('https://leetcode.com/graphql', gqlQuery);

        if (response.data?.errors) {
            console.error("❌ LeetCode GraphQL Error:", response.data.errors);
            return res.status(200).json({
                success: false,
                message: "LeetCode API error. Please try again in a few minutes."
            });
        }

        const submissions = response.data?.data?.recentSubmissionList || [];

        // Look for the required problem submitted AFTER startTime
        console.log(`🔍 Submissions found: ${submissions.length}`);
        submissions.forEach(s => {
            console.log(`   - ${s.titleSlug} at ${s.timestamp} (Match: ${s.titleSlug === VERIFY_PROBLEM_SLUG}, Recent: ${parseInt(s.timestamp) >= startTime})`);
        });

        const validSubmission = submissions.find(s =>
            s.titleSlug === VERIFY_PROBLEM_SLUG &&
            parseInt(s.timestamp) >= startTime
        );

        if (validSubmission) {
            console.log("✅ Verification successful! Found match.");

            // Fetch and save full data on successful verification
            const leetcodeData = await fetchFullLeetCodeData(username);
            if (leetcodeData) {
                leetcodeData.verified = true;
                leetcodeData.verifiedAt = new Date().toISOString();
                saveToJSON(`leetcode_${username}.json`, leetcodeData);
            }

            return res.status(200).json({
                success: true,
                message: "Verification successful!",
                details: validSubmission,
                data: leetcodeData
            });
        }

        return res.status(200).json({
            success: false,
            message: `No recent submission found for '${VERIFY_PROBLEM_NAME}'. Make sure you submitted it after clicking Verify.`
        });

    } catch (error) {
        console.error('Error checking submission:', error.message);
        res.status(500).json({ success: false, message: "Server error during check" });
    }
};

// ──────────────────────────────────────────────────────────
// HELPER: Fetch full LeetCode data via GraphQL + REST APIs
// ──────────────────────────────────────────────────────────
async function fetchFullLeetCodeData(username) {
    try {
        const gqlQuery = {
            query: `
                query userCombinedStats($username: String!) {
                    matchedUser(username: $username) {
                        username
                        profile {
                            ranking
                            reputation
                        }
                        submitStatsGlobal {
                            acSubmissionNum {
                                difficulty
                                count
                            }
                        }
                    }
                    userContestRanking(username: $username) {
                        attendedContestsCount
                        rating
                        globalRanking
                    }
                    recentAcSubmissionList(username: $username, limit: 20) {
                        title titleSlug timestamp lang
                    }
                }
            `,
            variables: { username }
        };

        const [gqlRes, contestRes, submissionsRes2024, submissionsRes2025] = await Promise.all([
            axios.post('https://leetcode.com/graphql', gqlQuery).catch(() => null),
            axios.get(`${process.env.leetcode_api}/${username}/contest`).catch(() => null),
            axios.get(`${process.env.leetcode_api}/userProfileCalendar?username=${username}&year=2024`).catch(() => null),
            axios.get(`${process.env.leetcode_api}/userProfileCalendar?username=${username}&year=2025`).catch(() => null),
        ]);

        const gqlData = gqlRes?.data?.data;
        const matchedUser = gqlData?.matchedUser;
        const recentAc = gqlData?.recentAcSubmissionList || [];
        const contestData = contestRes?.data || null;

        let profileData = null;
        if (matchedUser) {
            const stats = matchedUser.submitStatsGlobal.acSubmissionNum;
            profileData = {
                ranking: matchedUser.profile.ranking,
                totalSolved: stats.find(s => s.difficulty === 'All')?.count || 0,
                easySolved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
                mediumSolved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
                hardSolved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
                acceptanceRate: 0,
                recentSubmissions: recentAc,
            };
        }

        const parseCalendar = (data) => {
            if (!data?.submissionCalendar) return [];
            try {
                return Object.entries(JSON.parse(data.submissionCalendar)).map(([date, submissions]) => ({
                    date: Number(date), submissions,
                }));
            } catch { return []; }
        };

        const sub2024 = submissionsRes2024?.data || null;
        const sub2025 = submissionsRes2025?.data || null;

        return {
            username,
            fetchedAt: new Date().toISOString(),
            profile: profileData ? {
                ranking: profileData.ranking,
                totalSolved: profileData.totalSolved,
                easySolved: profileData.easySolved,
                mediumSolved: profileData.mediumSolved,
                hardSolved: profileData.hardSolved,
                acceptanceRate: profileData.acceptanceRate,
                recentSubmissions: profileData.recentSubmissions,
            } : null,
            contests: contestData ? {
                contestAttend: contestData.contestAttend,
                contestRating: Math.floor(contestData.contestRating || 0),
                contestParticipation: contestData.contestParticipation || [],
            } : null,
            submissions_2024: sub2024 ? {
                activeYears: sub2024.activeYears || [],
                streak: sub2024.streak || 0,
                totalActiveDays: sub2024.totalActiveDays || 0,
                submissionCalendar: parseCalendar(sub2024),
            } : null,
            submissions_2025: sub2025 ? {
                activeYears: sub2025.activeYears || [],
                streak: sub2025.streak || 0,
                totalActiveDays: sub2025.totalActiveDays || 0,
                submissionCalendar: parseCalendar(sub2025),
            } : null,
        };
    } catch (error) {
        console.error('❌ Error fetching full LeetCode data:', error.message);
        return null;
    }
}

// ──────────────────────────────────────────────────────────
// 2) ADD: Fetch full LeetCode data and store as JSON
// POST /add-leetcode  { username, email }
// ──────────────────────────────────────────────────────────
export const AddLeetCodeAccount = async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Check if already stored
        const existing = readFromJSON(`leetcode_${username}.json`);
        if (existing) {
            return res.status(400).json({ message: 'Leetcode account already exists in saved data' });
        }

        console.log(`📥 Fetching LeetCode data for: ${username}`);

        const leetcodeData = await fetchFullLeetCodeData(username);
        if (!leetcodeData) {
            return res.status(400).json({ message: 'Failed to fetch user data from LeetCode APIs' });
        }

        leetcodeData.email = email || 'demo@test.com';
        const jsonPath = saveToJSON(`leetcode_${username}.json`, leetcodeData);
        console.log(`📄 Full LeetCode data for "${username}" saved to: ${jsonPath}`);

        return res.status(201).json({
            message: 'User data stored successfully as JSON',
            data: leetcodeData,
            jsonPath,
        });
    } catch (error) {
        console.error('Error storing LeetCode user data:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ──────────────────────────────────────────────────────────
// 3) FETCH: Read stored data and return
// GET /fetch/:username
// ──────────────────────────────────────────────────────────
export const fetchLeetCode = async (req, res) => {
    try {
        const { username } = req.params;
        let storedData = readFromJSON(`leetcode_${username}.json`);
        if (!storedData) {
            return res.status(404).json({ message: `No stored data found for "${username}"` });
        }
        return res.status(200).json({
            message: 'LeetCode user data retrieved from JSON',
            data: storedData,
        });
    } catch (error) {
        console.error('Controller Error:', error.message);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// ──────────────────────────────────────────────────────────
// 4) FETCH FROM DB (JSON) by username
// GET /fetch-from-db/:leetid
// ──────────────────────────────────────────────────────────
export const fetchFromDB = async (req, res) => {
    try {
        const { leetid } = req.params;
        const storedData = readFromJSON(`leetcode_${leetid}.json`);
        if (!storedData) {
            return res.status(400).json({ success: false, message: 'LeetCode user not found in JSON storage' });
        }
        return res.status(200).json({
            data: storedData,
            success: true,
            message: 'LeetCode user found',
        });
    } catch (error) {
        console.error('Error reading JSON:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ──────────────────────────────────────────────────────────
// 5) CHECK USERNAME EXISTS in stored data
// GET /fetch-user-name-exist/:leetid
// ──────────────────────────────────────────────────────────
export const fetchUserNameExists = async (req, res) => {
    try {
        const { leetid } = req.params;
        const storedData = readFromJSON(`leetcode_${leetid}.json`);
        if (!storedData) {
            return res.status(400).json({ success: false, message: 'LeetCode user not found' });
        }
        return res.status(200).json({
            data: storedData.username,
            success: true,
            message: 'LeetCode user found',
        });
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ──────────────────────────────────────────────────────────
// 6) DELETE: Remove stored JSON
// DELETE /delete-leetcode/:leetid
// ──────────────────────────────────────────────────────────
export const deleteLeetCodeUser = async (req, res) => {
    try {
        const { leetid } = req.params;
        const filePath = path.join(DATA_DIR, `leetcode_${leetid}.json`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'LeetCodeUser not found.' });
        }
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted: ${filePath}`);

        // Also clean up verification file if it exists
        const verifyPath = path.join(DATA_DIR, `verification_${leetid}.json`);
        if (fs.existsSync(verifyPath)) fs.unlinkSync(verifyPath);

        return res.status(200).json({ success: true, message: 'LeetCodeUser JSON deleted.' });
    } catch (error) {
        console.error('Error deleting:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────
// 7) LIST: Show all stored users
// GET /list-all
// ──────────────────────────────────────────────────────────
export const listAllUsers = async (req, res) => {
    const users = listStoredUsers();
    const allData = users.map(u => readFromJSON(`leetcode_${u}.json`));
    return res.status(200).json({ count: users.length, users, data: allData });
};
