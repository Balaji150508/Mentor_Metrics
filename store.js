/* =========================================================
   MentorMetrics shared store
   Both mentee-dashboard.html and mentor-dashboard.html include
   this file and read/write the same localStorage record, so
   actions on one page (add a task, submit a mark request, vote
   on a poll) show up on the other.

   Limitation: this only syncs within the SAME browser, since
   localStorage isn't shared across devices. For real multi-user
   sync you'd need a real backend (see chat for details).
========================================================= */

const MM_STORE_KEY = "mentormetrics_store_v1";

const MM_DEFAULT_STORE = {
  mentor: { name: "Dr. R. Kalaiselvi", email: "r.kalaiselvi@stjosephs.ac.in", dept: "Computer Science Engineering" },

  mentees: [
    {
      id: "s1", name: "Sneha Ramesh", regNo: "21CS0159", email: "sneha.ramesh@stjosephs.ac.in",
      phone: "", customFields: {}, githubStats: null, leetcodeStats: null, otherPlatforms: "", photo: null,
      division: "Hope Elite", domain: null,
      fatherName: "V. Ramesh", fatherOcc: "Software Engineer",
      motherName: "V. Anitha", motherOcc: "Software Engineer",
      scores: { coding: 20, oss: 15, competition: 15, certification: 15, cp: 15, project: 20, aptitude: 12, monthly: 15, gate: 20, internship: 10, language: 15, training: 15 },
    },
    {
      id: "s2", name: "Aarthi Suresh", regNo: "21CS0142", email: "aarthi.suresh@stjosephs.ac.in",
      phone: "", customFields: {}, githubStats: null, leetcodeStats: null, otherPlatforms: "", photo: null,
      division: "Hope", domain: null,
      fatherName: "S. Suresh Kumar", fatherOcc: "Bank Manager",
      motherName: "S. Lakshmi", motherOcc: "Homemaker",
      scores: { coding: 20, oss: 15, competition: 10, certification: 10, cp: 15, project: 15, aptitude: 12, monthly: 15, gate: 15, internship: 10, language: 12, training: 10 },
    },
    {
      id: "s3", name: "Rohan Mehta", regNo: "21CS0198", email: "rohan.mehta@stjosephs.ac.in",
      phone: "", customFields: {}, githubStats: null, leetcodeStats: null, otherPlatforms: "", photo: null,
      division: "PEP", domain: "Cloud Computing",
      fatherName: "A. Mehta", fatherOcc: "Business Owner",
      motherName: "R. Mehta", motherOcc: "Teacher",
      scores: { coding: 10, oss: 3, competition: 4, certification: 5, cp: 5, project: 5, aptitude: 6, monthly: 10, gate: 5, internship: 4, language: 7, training: 5 },
    },
    {
      id: "s4", name: "Divya Kannan", regNo: "21CS0211", email: "divya.kannan@stjosephs.ac.in",
      phone: "", customFields: {}, githubStats: null, leetcodeStats: null, otherPlatforms: "", photo: null,
      division: "Degree Focus", domain: null,
      fatherName: "K. Kannan", fatherOcc: "Government Employee",
      motherName: "K. Meena", motherOcc: "Nurse",
      scores: { coding: 15, oss: 10, competition: 6, certification: 10, cp: 10, project: 10, aptitude: 9, monthly: 10, gate: 10, internship: 6, language: 12, training: 10 },
    },
    {
      id: "s5", name: "Karthik Iyer", regNo: "21CS0173", email: "karthik.iyer@stjosephs.ac.in",
      phone: "", customFields: {}, githubStats: null, leetcodeStats: null, otherPlatforms: "", photo: null,
      division: "Failures", domain: null,
      fatherName: "S. Iyer", fatherOcc: "Farmer",
      motherName: "S. Radha", motherOcc: "Homemaker",
      scores: { coding: 5, oss: 3, competition: 2, certification: 3, cp: 5, project: 3, aptitude: 3, monthly: 5, gate: 3, internship: 2, language: 7, training: 5 },
    },
  ],

  // Mentor-created requests for any piece of info from a mentee — not
  // just fixed fields. Mentee answers in free text; answer is stored
  // in mentee.customFields[requestId].
  infoRequests: [
    { id: "github-username", label: "GitHub Username", assignee: "all" },
    { id: "leetcode-username", label: "LeetCode Username (exact, from leetcode.com/u/<username>)", assignee: "all" },
    { id: "linkedin-profile", label: "LinkedIn Profile URL", assignee: "all" },
  ],

  // type: "task" | "project" | "poll"
  assignedItems: [
    { id: "t1", type: "task", title: "Reach 550 coding problems solved", param: "coding", assignee: "all", due: "10 Sep 2026" },
    { id: "t2", type: "task", title: "Get first PR merged", param: "oss", assignee: "all", due: "15 Sep 2026" },
    { id: "t3", type: "project", title: "Batch mini-project on IoT", desc: "Teams of 3, submit working prototype + report.", assignee: "all", due: "30 Sep 2026" },
    { id: "p1", type: "poll", question: "Preferred time slot for this month's mock aptitude test?", options: ["10:00 AM", "2:00 PM", "5:00 PM"], votes: {} },
    { id: "p2", type: "poll", question: "Would you like an extra doubt-clearing session this week?", options: ["Yes", "No", "Not sure"], votes: {} },
  ],

  // mentee -> mentor: "please change my mark for X"
  markChangeRequests: [
    { id: "r1", studentId: "s3", parameter: "oss", requested: 10, proof: "github.com/rohanmehta/pr-merged-3", status: "Pending" },
    { id: "r2", studentId: "s5", parameter: "coding", requested: 10, proof: "leetcode.com/karthik_i - 350 solved screenshot", status: "Pending" },
  ],

  // mentee -> mentor: "I finished this task, here's proof"
  taskCompletions: [],
};

function mmLoadStore() {
  try {
    const raw = localStorage.getItem(MM_STORE_KEY);
    if (!raw) {
      mmSaveStore(MM_DEFAULT_STORE);
      return JSON.parse(JSON.stringify(MM_DEFAULT_STORE));
    }
    const parsed = JSON.parse(raw);
    // Defensive migration: patch in any fields added to the store shape
    // since this browser first saved data, so old saved sessions don't break.
    if (!parsed.infoRequests) parsed.infoRequests = JSON.parse(JSON.stringify(MM_DEFAULT_STORE.infoRequests));
    if (!parsed.infoRequests.some(r => r.id === "leetcode-username")) {
      parsed.infoRequests.push({ id: "leetcode-username", label: "LeetCode Username (exact, from leetcode.com/u/<username>)", assignee: "all" });
    }
    if (!parsed.mentor) parsed.mentor = { ...MM_DEFAULT_STORE.mentor };
    if (!parsed.taskCompletions) parsed.taskCompletions = [];
    (parsed.mentees || []).forEach(m => {
      if (!m.customFields) m.customFields = {};
      if (m.githubStats === undefined) m.githubStats = null;
      if (m.leetcodeStats === undefined) m.leetcodeStats = null;
      if (m.otherPlatforms === undefined) m.otherPlatforms = "";
      if (m.photo === undefined) m.photo = null;
    });
    return parsed;
  } catch (e) {
    mmSaveStore(MM_DEFAULT_STORE);
    return JSON.parse(JSON.stringify(MM_DEFAULT_STORE));
  }
}

function mmSaveStore(store) {
  localStorage.setItem(MM_STORE_KEY, JSON.stringify(store));
}