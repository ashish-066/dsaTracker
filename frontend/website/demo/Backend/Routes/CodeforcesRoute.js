import express from 'express';
import {
    initiateVerify,
    validateSubmission,
    addAccount,
    fetchData,
    deleteData,
    listAll
} from '../Controller/Codeforces.js';

const router = express.Router();

router.get('/check-handle/:handle', initiateVerify);
router.post('/check-submission', validateSubmission);
router.post('/add-cf', addAccount);
router.get('/fetch/:handle', fetchData);
router.delete('/delete/:handle', deleteData);
router.get('/list-all', listAll);

export default router;
