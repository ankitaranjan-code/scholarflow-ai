/**
 * Mock data for the ScholarFlow AI platform.
 * Simulates API responses for all three modules.
 */

// ── Student Profile ──
export const studentProfile = {
  id: 1,
  username: "ankita_sharma",
  displayName: "Ankita Sharma",
  avatarUrl: "",
  bio: "CS student passionate about AI & Machine Learning 🚀",
  email: "ankita@scholarflow.ai",
  totalPoints: 1250,
  currentStreak: 12,
  longestStreak: 24,
  level: 8,
};

// ── Performance Trajectory (ML Output) ──
export const trajectoryData = [
  { month: "Jan", score: 68 },
  { month: "Feb", score: 72 },
  { month: "Mar", score: 78 },
  { month: "Apr", score: 84 },
  { month: "May", score: 88 },
  { month: "Jun", score: 92 },
];

export const predictionResult = {
  predictedGrade: "A+",
  confidence: 0.91,
  riskLevel: "low",
  actionItems: [
    "Focus on Quadratic Equations — regression detected in Algebra modules.",
    "Increase daily study hours to 4 hours for optimal retention.",
    "Maintain your 12-day streak — consistency is your superpower!",
    "Try 10 minutes of mindfulness before study sessions.",
  ],
};

// ── Subject Scores ──
export const subjects = [
  { id: 1, name: "Mathematics", icon: "calculate", score: 72, maxScore: 100, status: "critical", accent: "error" },
  { id: 2, name: "Physics", icon: "rocket_launch", score: 89, maxScore: 100, status: "steady", accent: "primary" },
  { id: 3, name: "Biology", icon: "biotech", score: 94, maxScore: 100, status: "peak", accent: "tertiary" },
  { id: 4, name: "Chemistry", icon: "science", score: 81, maxScore: 100, status: "steady", accent: "secondary" },
];

// ── AI Insights ──
export const insights = [
  { type: "warning", title: "Critical Performance Dip", message: "Your math score is dropping by 10%. Regression detected in Algebra modules.", tip: "Focus on Quadratic Equations this week.", icon: "warning" },
  { type: "success", title: "Mastery Reached", message: "Top 2% in Biology: Molecular Genetics. Your consistency is peaking.", icon: "check_circle" },
  { type: "info", title: "Study Pattern Insight", message: "You perform 23% better in morning study sessions vs evening.", icon: "insights" },
];

// ── Routine Tasks ──
export const routineTasks = [
  { id: 1, title: "Morning meditation (10 min)", category: "wellness", icon: "self_improvement", points: 15, timeSlot: "06:00", completed: false },
  { id: 2, title: "Math revision — Algebra", category: "study", icon: "calculate", points: 25, timeSlot: "07:00", completed: false },
  { id: 3, title: "Physics problem set", category: "study", icon: "rocket_launch", points: 25, timeSlot: "09:00", completed: false },
  { id: 4, title: "30 min exercise", category: "wellness", icon: "fitness_center", points: 20, timeSlot: "11:00", completed: false },
  { id: 5, title: "Biology chapter review", category: "study", icon: "biotech", points: 25, timeSlot: "14:00", completed: false },
  { id: 6, title: "Chemistry lab prep", category: "study", icon: "science", points: 20, timeSlot: "16:00", completed: false },
  { id: 7, title: "Evening journaling", category: "personal", icon: "edit_note", points: 10, timeSlot: "21:00", completed: false },
  { id: 8, title: "Sleep by 11 PM", category: "wellness", icon: "bedtime", points: 15, timeSlot: "23:00", completed: false },
];

// ── Badges ──
export const badges = [
  { id: 1, name: "First Steps", emoji: "🌱", category: "milestone", rarity: "common", earned: true, earnedAt: "2026-01-15" },
  { id: 2, name: "Rising Scholar", emoji: "📚", category: "milestone", rarity: "common", earned: true, earnedAt: "2026-02-20" },
  { id: 3, name: "7-Day Warrior", emoji: "🔥", category: "streak", rarity: "common", earned: true, earnedAt: "2026-03-01" },
  { id: 4, name: "Knowledge Seeker", emoji: "🔬", category: "milestone", rarity: "rare", earned: true, earnedAt: "2026-03-28" },
  { id: 5, name: "Early Bird", emoji: "🌅", category: "wellness", rarity: "common", earned: true, earnedAt: "2026-04-05" },
  { id: 6, name: "Zen Master", emoji: "🧘", category: "wellness", rarity: "rare", earned: false },
  { id: 7, name: "Academic Warrior", emoji: "⚔️", category: "milestone", rarity: "epic", earned: false },
  { id: 8, name: "30-Day Legend", emoji: "🏆", category: "streak", rarity: "epic", earned: false },
  { id: 9, name: "Night Owl Scholar", emoji: "🦉", category: "academic", rarity: "rare", earned: false },
  { id: 10, name: "Social Butterfly", emoji: "🦋", category: "social", rarity: "legendary", earned: false },
];

// ── Mood History ──
export const moodHistory = [
  { mood: "motivated", energy: 8, date: "2026-04-28" },
  { mood: "happy", energy: 7, date: "2026-04-27" },
  { mood: "stressed", energy: 4, date: "2026-04-26" },
  { mood: "tired", energy: 3, date: "2026-04-25" },
  { mood: "motivated", energy: 9, date: "2026-04-24" },
];

// ── Chat Messages ──
export const chatMessages = [
  { id: 1, role: "assistant", content: "Hey Ankita! 👋 How's it going today? I'm here to help with your studies, cheer you on, or just chat. What's on your mind?", type: "text", time: "10:00 AM" },
  { id: 2, role: "user", content: "I'm feeling a bit stressed about the math exam next week 😰", type: "text", time: "10:02 AM" },
  { id: 3, role: "assistant", content: "I hear you! Math exams can feel overwhelming. But here's the good news — you've been consistently improving. Your scores went from 68% to 72% this month. Let's break this down:\n\n📌 **Focus areas:** Quadratic Equations & Algebra\n⏰ **Suggested plan:** 45 min/day for the next 6 days\n💪 **You've got this!**\n\nWant me to create a study plan for you?", type: "text", time: "10:02 AM" },
  { id: 4, role: "user", content: "Yes please! That would really help", type: "text", time: "10:05 AM" },
  { id: 5, role: "assistant", content: "Here's your personalized 6-day Math Blitz plan! 🎯\n\n**Day 1-2:** Quadratic Equations basics + practice\n**Day 3-4:** Algebra review + past paper questions\n**Day 5:** Mixed problem set (timed)\n**Day 6:** Light review + rest\n\nI've added these to your routine tracker. You'll earn **150 bonus points** if you complete all sessions! 🔥", type: "text", time: "10:05 AM" },
];

// ── Upcoming Exams (for chat context) ──
export const upcomingExams = [
  { subject: "Mathematics", date: "2026-05-05", daysLeft: 7, type: "Final Exam" },
  { subject: "Physics", date: "2026-05-08", daysLeft: 10, type: "Lab Practical" },
  { subject: "Biology", date: "2026-05-12", daysLeft: 14, type: "Unit Test V" },
];
