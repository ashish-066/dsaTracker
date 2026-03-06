import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import leetcodeRouter from './Backend/Routes/LeetCodeRoute.js';
import codeforcesRouter from './Backend/Routes/CodeforcesRoute.js';

dotenv.config();

// Error handling for debugging
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Serve the frontend test page
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/server/leetcode', leetcodeRouter);
app.use('/server/codeforces', codeforcesRouter);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Demo LeetCode server (JSON-only, no MongoDB)' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n🚀 Demo server running at http://localhost:${PORT}`);
    console.log(`📄 JSON data directory: ${path.join(__dirname, 'data')}`);
    console.log(`🌐 Test page: http://localhost:${PORT}/index.html\n`);
});
