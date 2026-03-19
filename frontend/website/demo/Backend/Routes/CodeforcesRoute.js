import express from 'express';
import {
    initiateVerify,
    validateSubmission,
    addAccount,
    fetchData,
    deleteData,
    listAll,
} from '../Controller/Codeforces.js';

const router = express.Router();

// ── Submission-based Verification ──
// Step 1: Check handle exists + get problem link + startTime
router.get('/check-handle/:handle', initiateVerify);
// Step 2: Verify user submitted that problem after startTime
router.post('/check-submission', validateSubmission);

// ── Data CRUD ──
router.post('/add-cf', addAccount);
router.get('/fetch/:handle', fetchData);
router.delete('/delete/:handle', deleteData);
router.get('/list-all', listAll);

export default router;
