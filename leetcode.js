/* =========================================================
   MentorMetrics — LeetCode sync helper
   Shared by mentee-dashboard.html and mentor-dashboard.html.

   Uses alfa-leetcode-api, an open-source wrapper around
   LeetCode's own (unofficial) GraphQL endpoint. It sends the
   right CORS headers, so the browser can call it directly and
   this project stays backend-free, exactly like the GitHub sync.

   Only pulls solved counts (total/easy/medium/hard) — a single
   endpoint, one request per sync. Keeping it to one call is what
   keeps this comfortably under the public instance's rate limit.

   The public demo instance is rate-limited and sleeps when idle,
   so the first call can take 20-30 seconds. For anything beyond a
   demo, self-host it (see the repo README) and change MM_LC_BASE
   below to your own URL.
========================================================= */

const MM_LC_BASE = "https://alfa-leetcode-api.onrender.com";

// Don't allow two syncs for the same username within this window.
// This is what actually prevents the 429 you were hitting before —
// re-clicking Sync within a few seconds now just reuses the last
// result instead of firing another request.
const MM_LC_COOLDOWN_MS = 30000;
const mmLcLastFetch = {}; // username -> { at: timestamp, stats: {...} }

/**
 * Fetch one student's LeetCode solved counts.
 * Returns a plain object ready to store on mentee.leetcodeStats.
 * Throws an Error with a human-readable message on failure.
 */
async function mmFetchLeetcodeStats(username) {
  const name = String(username).trim();
  if (!name) throw new Error("No LeetCode username given.");

  const cached = mmLcLastFetch[name];
  if (cached && Date.now() - cached.at < MM_LC_COOLDOWN_MS) {
    return cached.stats; // reuse — avoids tripping the rate limit on quick re-clicks
  }

  const u = encodeURIComponent(name);
  const res = await fetch(`${MM_LC_BASE}/${u}/solved`);

  if (res.status === 404) {
    throw new Error(`No LeetCode profile found for "${name}". Check the spelling — it must be the username from leetcode.com/u/<username>, not the display name.`);
  }
  if (res.status === 429) {
    throw new Error("The public LeetCode API instance is rate-limiting requests right now. Wait about a minute and try again, or self-host the API for unlimited use.");
  }
  if (!res.ok) {
    throw new Error(`The LeetCode API returned an unexpected error (status ${res.status}). It may be waking up from sleep — try once more in a moment.`);
  }

  const solved = await res.json();
  const stats = {
    username: name,
    totalSolved: solved.solvedProblem ?? 0,
    easySolved: solved.easySolved ?? 0,
    mediumSolved: solved.mediumSolved ?? 0,
    hardSolved: solved.hardSolved ?? 0,
    fetchedAt: new Date().toISOString(),
  };

  mmLcLastFetch[name] = { at: Date.now(), stats };
  return stats;
}

/** Renders a stats object as the same detail-grid markup both dashboards use. */
function mmLeetcodeStatsHtml(s) {
  if (!s) return `<p style="font-size:12.5px;color:var(--text-soft);">Not synced yet.</p>`;
  return `
    <div class="detail-grid" style="margin-bottom:0;">
      <div class="detail-field"><div class="fl">Total Solved</div><div class="fv">${s.totalSolved}</div></div>
      <div class="detail-field"><div class="fl">Easy</div><div class="fv">${s.easySolved}</div></div>
      <div class="detail-field"><div class="fl">Medium</div><div class="fv">${s.mediumSolved}</div></div>
      <div class="detail-field"><div class="fl">Hard</div><div class="fv">${s.hardSolved}</div></div>
    </div>
    <p style="font-size:11.5px;color:var(--text-soft);margin-top:8px;">Last synced: ${new Date(s.fetchedAt).toLocaleString()}</p>
  `;
}

/** Turns a thrown error into a friendly message, matching the GitHub sync's style. */
function mmLeetcodeErrorMessage(err) {
  if (err instanceof TypeError) {
    return "Couldn't reach the LeetCode API. This happens if you're previewing the file somewhere that blocks outside network requests — run it through a real local server instead. The public API instance also sleeps when idle, so a retry often fixes it.";
  }
  return err.message;
}
