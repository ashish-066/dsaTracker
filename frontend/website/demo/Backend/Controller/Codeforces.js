import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/codeforces');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Verification Config
const VERIFY_PROBLEM_ID = "4A";
const VERIFY_PROBLEM_URL = `https://codeforces.com/problemset/problem/4/A`;

const saveJSON = (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
};

const readJSON = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    try {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (!content) return null;
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
};

// ──────────────────────────────────────────────────────────
// 1) Initiation: Check handle and return problem link
// GET /check-handle/:handle
// ──────────────────────────────────────────────────────────
export const initiateVerify = async (req, res) => {
    try {
        const { handle } = req.params;
        console.log(`🔍 CF Verification initiated for: ${handle}`);

        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`).catch(() => null);

        if (!response || response.data.status !== 'OK') {
            return res.status(200).json({ success: false, message: 'Codeforces handle not found' });
        }

        const startTime = Math.floor(Date.now() / 1000);

        return res.status(200).json({
            success: true,
            data: {
                handle,
                problemUrl: VERIFY_PROBLEM_URL,
                problemId: VERIFY_PROBLEM_ID,
                startTime
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'CF API Error' });
    }
};

// ──────────────────────────────────────────────────────────
// 2) Validation: Check recent submissions
// POST /check-submission { handle, startTime }
// ──────────────────────────────────────────────────────────
export const validateSubmission = async (req, res) => {
    try {
        const { handle, startTime } = req.body;
        console.log(`⏱️ Checking CF submission for ${handle} after ${startTime}`);

        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10`);

        if (response.data.status !== 'OK') {
            return res.status(200).json({ success: false, message: 'Could not fetch submissions' });
        }

        const submissions = response.data.result;
        const validMatch = submissions.find(s =>
            (s.problem.contestId + s.problem.index) === VERIFY_PROBLEM_ID &&
            s.creationTimeSeconds >= startTime
        );

        if (validMatch) {
            // Fetch and save full data on successful verification
            const cfData = await fetchFullCodeforcesData(handle);
            if (cfData) {
                cfData.verified = true;
                cfData.verifiedAt = new Date().toISOString();
                saveJSON(`cf_${handle}.json`, cfData);
            }

            return res.status(200).json({
                success: true,
                message: 'Verified!',
                details: validMatch,
                data: cfData
            });
        }

        return res.status(200).json({
            success: false,
            message: "No recent submission found for '4A - Watermelon'. Submit it and try again."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Validation failed' });
    }
};

// ──────────────────────────────────────────────────────────
// HELPER: Fetch full Codeforces data
// ──────────────────────────────────────────────────────────
async function fetchFullCodeforcesData(handle) {
    try {
        const [infoRes, ratingRes, statusRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(() => null),
            axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5000`).catch(() => null),
        ]);

        if (infoRes.data.status !== 'OK') throw new Error('Failed to fetch user info');

        const submissions = statusRes?.data?.status === 'OK' ? statusRes.data.result : [];

        // Deduplicate: only count unique accepted problems
        const solvedSet = new Set();
        const ratingDist = {};
        const topicMap = {};
        for (const sub of submissions) {
            if (sub.verdict !== 'OK') continue;
            const key = `${sub.problem.contestId}-${sub.problem.index}`;
            if (solvedSet.has(key)) continue;
            solvedSet.add(key);
            const rating = sub.problem.rating;
            if (rating) {
                const bucket = Math.floor(rating / 400) * 400;
                const label = `${bucket}-${bucket + 399}`;
                ratingDist[label] = (ratingDist[label] || 0) + 1;
            }
            if (sub.problem.tags) {
                for (const tag of sub.problem.tags) {
                    topicMap[tag] = (topicMap[tag] || 0) + 1;
                }
            }
        }

        return {
            handle,
            fetchedAt: new Date().toISOString(),
            info: infoRes.data.result[0],
            solvedCount: solvedSet.size,
            ratingDistribution: ratingDist,
            topicDistribution: topicMap,
            ratingHistory: ratingRes?.data?.status === 'OK' ? ratingRes.data.result : [],
            recentSubmissions: submissions.slice(0, 50),
        };
    } catch (error) {
        console.error('❌ Error fetching full Codeforces data:', error.message);
        return null;
    }
}

// ──────────────────────────────────────────────────────────
// 3) Store: Fetch and save as JSON
// POST /add-cf { handle }
// ──────────────────────────────────────────────────────────
export const addAccount = async (req, res) => {
    try {
        const { handle } = req.body;

        const userData = await fetchFullCodeforcesData(handle);
        if (!userData) throw new Error('Failed to fetch user data');

        const jsonPath = saveJSON(`cf_${handle}.json`, userData);
        res.status(201).json({ success: true, message: 'Stored successfully', jsonPath, data: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ──────────────────────────────────────────────────────────
// 4) Fetch stored data
// GET /fetch/:handle
// ──────────────────────────────────────────────────────────
export const fetchData = (req, res) => {
    const { handle } = req.params;
    const data = readJSON(`cf_${handle}.json`);
    if (!data) return res.status(404).json({ message: 'User not found in local data' });
    res.json({ success: true, data });
};

// ──────────────────────────────────────────────────────────
// 5) Delete
// DELETE /delete/:handle
// ──────────────────────────────────────────────────────────
export const deleteData = (req, res) => {
    const { handle } = req.params;
    const filePath = path.join(DATA_DIR, `cf_${handle}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'Deleted' });
    }
    res.status(404).json({ message: 'Not found' });
};

// ──────────────────────────────────────────────────────────
// 6) List all
// GET /list-all
// ──────────────────────────────────────────────────────────
export const listAll = (req, res) => {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const handles = files.map(f => f.replace('cf_', '').replace('.json', ''));
    res.json({ success: true, count: handles.length, handles });
};
