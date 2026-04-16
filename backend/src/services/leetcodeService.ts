import axios from 'axios';
import problems from '../../data/problems.json';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql/';

// Headers that mimic a browser request — required for LeetCode to respond
const makeHeaders = () => ({
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'x-csrftoken': 'dummy',
});

// ─── GraphQL Queries ──────────────────────────────────────────────────────────

const USER_PROFILE_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
  }
}
`;

const USER_TAG_STATS_QUERY = `
query userTagStats($username: String!) {
  matchedUser(username: $username) {
    tagProblemCounts {
      advanced {
        tagName
        tagSlug
        problemsSolved
      }
      intermediate {
        tagName
        tagSlug
        problemsSolved
      }
      fundamental {
        tagName
        tagSlug
        problemsSolved
      }
    }
  }
}
`;

const SUBMISSION_CALENDAR_QUERY = `
query userProfileCalendar($username: String!, $year: Int) {
  matchedUser(username: $username) {
    userCalendar(year: $year) {
      submissionCalendar
      streak
      totalActiveDays
    }
  }
}
`;

const RECENT_SUBMISSIONS_QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}
`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagCount {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface LeetCodeRawData {
  username: string;
  submitStats: {
    acSubmissionNum: { difficulty: string; count: number; submissions: number }[];
  };
  tagProblemCounts: {
    advanced: TagCount[];
    intermediate: TagCount[];
    fundamental: TagCount[];
  };
  submissionCalendar: Record<string, number>;
  streak: number;
  recentAcceptedSubmissions: {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: number;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
    topics: string[];
  }[];
}

const difficultyBySlug = new Map(
  (problems as { slug: string; difficulty: 'Easy' | 'Medium' | 'Hard' }[]).map((p) => [p.slug, p.difficulty])
);

const topicsBySlug = new Map(
  (problems as { slug: string; topics?: string[] }[]).map((p) => [p.slug, p.topics || []])
);

// ─── GraphQL helper ───────────────────────────────────────────────────────────

async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await axios.post(
    LEETCODE_GRAPHQL,
    { query, variables },
    { headers: makeHeaders(), timeout: 20000 }
  );

  if (response.data?.errors?.length) {
    const msg = response.data.errors[0]?.message || 'GraphQL error';
    throw new Error(msg);
  }

  return response.data.data as T;
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

export async function fetchLeetCodeData(username: string): Promise<LeetCodeRawData> {
  // Run profile + calendar + recent submissions in parallel; tag stats separately (some accounts lack it)
  const [profileData, calendarData, recentData] = await Promise.all([
    gqlRequest<{
      matchedUser: {
        username: string;
        submitStats: {
          acSubmissionNum: { difficulty: string; count: number; submissions: number }[];
        };
      } | null;
    }>(USER_PROFILE_QUERY, { username }),

    gqlRequest<{
      matchedUser: {
        userCalendar: {
          submissionCalendar: string;
          streak: number;
          totalActiveDays: number;
        } | null;
      } | null;
    }>(SUBMISSION_CALENDAR_QUERY, { username, year: new Date().getFullYear() }),

    gqlRequest<{
      recentAcSubmissionList: {
        id: string;
        title: string;
        titleSlug: string;
        timestamp: string;
      }[];
    }>(RECENT_SUBMISSIONS_QUERY, { username, limit: 50 }),
  ]);

  if (!profileData.matchedUser) {
    throw new Error(`User "${username}" not found on LeetCode`);
  }

  // Tag stats — optional, don't fail if unavailable
  let tagProblemCounts: LeetCodeRawData['tagProblemCounts'] = {
    advanced: [],
    intermediate: [],
    fundamental: [],
  };

  try {
    const tagData = await gqlRequest<{
      matchedUser: {
        tagProblemCounts: LeetCodeRawData['tagProblemCounts'];
      } | null;
    }>(USER_TAG_STATS_QUERY, { username });

    if (tagData.matchedUser?.tagProblemCounts) {
      tagProblemCounts = tagData.matchedUser.tagProblemCounts;
    }
  } catch {
    // tag stats unavailable — continue with empty
  }

  // Parse calendar
  const cal = calendarData.matchedUser?.userCalendar;
  let submissionCalendar: Record<string, number> = {};
  let streak = 0;

  if (cal) {
    try {
      submissionCalendar = JSON.parse(cal.submissionCalendar || '{}');
    } catch {
      submissionCalendar = {};
    }
    streak = cal.streak ?? 0;
  }

  const recentAcceptedSubmissions = (recentData.recentAcSubmissionList || []).map((s) => {
    const difficulty: LeetCodeRawData['recentAcceptedSubmissions'][number]['difficulty'] =
      difficultyBySlug.get(s.titleSlug) ?? 'Unknown';

    return {
      id: s.id,
      title: s.title,
      titleSlug: s.titleSlug,
      timestamp: Number(s.timestamp),
      difficulty,
      topics: topicsBySlug.get(s.titleSlug) || [],
    };
  });

  return {
    username: profileData.matchedUser.username,
    submitStats: profileData.matchedUser.submitStats,
    tagProblemCounts,
    submissionCalendar,
    streak,
    recentAcceptedSubmissions,
  };
}
