import express from 'express';
const router = express.Router();

import {
    fetchLeetCode,
    fetchUserExist,
    AddLeetCodeAccount,
    fetchUserNameExists,
    deleteLeetCodeUser,
    fetchFromDB,
    listAllUsers,
    checkSubmission,
} from '../Controller/LeetCode.js';

// ── Submission-based Verification ──
// Step 1: Check username exists + get problem link + startTime
router.get('/check-username/:username', fetchUserExist);
// Step 2: Verify user submitted that problem after startTime
router.post('/check-submission', checkSubmission);

// ── Data CRUD ──
router.post('/add-leetcode', AddLeetCodeAccount);
router.get('/fetch/:username/', fetchLeetCode);
router.get('/fetch-from-db/:leetid', fetchFromDB);
router.get('/fetch-user-name-exist/:leetid', fetchUserNameExists);
router.delete('/delete-leetcode/:leetid', deleteLeetCodeUser);
router.get('/list-all', listAllUsers);

export default router;