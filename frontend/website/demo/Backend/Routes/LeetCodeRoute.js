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

// Phase 1: Initiation
router.get('/check-username/:username', fetchUserExist);

// Phase 2: Validation
router.post('/check-submission', checkSubmission);

// Add LeetCode account (fetch + save to JSON)
router.post('/add-leetcode', AddLeetCodeAccount);

// Fetch stored data (from JSON)
router.get('/fetch/:username/', fetchLeetCode);

// Fetch from stored JSON by id
router.get('/fetch-from-db/:leetid', fetchFromDB);

// Check if username exists in stored data
router.get('/fetch-user-name-exist/:leetid', fetchUserNameExists);

// Delete stored user data
router.delete('/delete-leetcode/:leetid', deleteLeetCodeUser);

// List all stored users (demo bonus)
router.get('/list-all', listAllUsers);

export default router;