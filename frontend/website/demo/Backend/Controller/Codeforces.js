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

// 1) Initiation: Check handle and return problem link
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

// 2) Validation: Check recent submissions
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
            return res.status(200).json({ success: true, message: 'Verified!', details: validMatch });
        }

        return res.status(200).json({
            success: false,
            message: "No recent submission found for '4A - Watermelon'. Submit it and try again."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Validation failed' });
    }
};

// 3) Store: Fetch and save as JSON
export const addAccount = async (req, res) => {
    try {
        const { handle } = req.body;

        const [infoRes, ratingRes, statusRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`),
            axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`)
        ]);

        if (infoRes.data.status !== 'OK') throw new Error('Failed to fetch user info');

        const userData = {
            handle,
            fetchedAt: new Date().toISOString(),
            info: infoRes.data.result[0],
            ratingHistory: ratingRes.data.status === 'OK' ? ratingRes.data.result : [],
            recentSubmissions: statusRes.data.status === 'OK' ? statusRes.data.result.slice(0, 50) : []
        };

        const jsonPath = saveJSON(`cf_${handle}.json`, userData);
        res.status(201).json({ success: true, message: 'Stored successfully', jsonPath, data: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4) Fetch
export const fetchData = (req, res) => {
    const { handle } = req.params;
    const data = readJSON(`cf_${handle}.json`);
    if (!data) return res.status(404).json({ message: 'User not found in local data' });
    res.json({ success: true, data });
};

// 5) Delete
export const deleteData = (req, res) => {
    const { handle } = req.params;
    const filePath = path.join(DATA_DIR, `cf_${handle}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'Deleted' });
    }
    res.status(404).json({ message: 'Not found' });
};

// 6) List
export const listAll = (req, res) => {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const handles = files.map(f => f.replace('cf_', '').replace('.json', ''));
    res.json({ success: true, count: handles.length, handles });
};
