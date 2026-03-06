import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

    username: { type: String, required: true, unique: true },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    mobileno: { type: Number },

    password: { type: String, required: true },

    profilePicture: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/005/544/718/original/profile-icon-design-free-vector.jpg",
    },

    bio: { type: String, maxlength: 500 },

    location: {
        city: { type: String },
        state: { type: String },
        country: { type: String },
    },

    education: {
        degree: { type: String },
        branch: { type: String },
        college: { type: String },
        gryear: { type: Number },
    },

    website: { type: String },
    skills: { type: String },
    position: { type: String },

    combinedSubmissions: {
        type: Object
    },

    hardProblemsSolved:{type:Number},
    totalProblemSolved:{type:Number},
    avgContestRating:{type:Number},
    totalContributions:{type:Number},
    totalSubmissions:{type:Number},
    totalActiveDays:{type:Number},
    overallScore : {type:Number},

    GeeksforGeeks: { type: mongoose.Schema.Types.ObjectId, ref: 'GeeksForGeeksUser' },
    LeetCode: { type: mongoose.Schema.Types.ObjectId, ref: 'LeetCodeUser' },
    CodeChef: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeChefUser' },
    CodeForces: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeforcesUser' },
    Github: { type: mongoose.Schema.Types.ObjectId, ref: 'GitHubUser' },

    // GeeksforGeeks: { type: mongoose.Schema.Types.ObjectId, ref: 'GeeksforGeeks' },
    // LeetCode: { type: mongoose.Schema.Types.ObjectId, ref: 'LeetCode' },
    // CodeChef: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeChef' },
    // CodeForces: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeForces' },
    // Github: { type: mongoose.Schema.Types.ObjectId, ref: 'GitHub' },

    userProfile: {
        geeksforgeeks: { type: String },
        leetcode: { type: String },
        codechef: { type: String },
        codeforces: { type: String },
        github: { type: String },
        linkedin: { type: String },
        twitter: { type: String },
        other: { type: String },
    },

    gender: { type: String },

    birthdate: { type: Date },

    role: { type: String, enum: ['student', 'recruiter', 'admin'], default: 'student' },

}, { timestamps: true });

export default mongoose.model('User', userSchema);
