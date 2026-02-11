import { Type } from "@sinclair/typebox";

export type TrendpilotConfig = {
  youtubeApiKey?: string;
  youtubeRegionCode?: string;
  youtubeMaxResults?: number;
  cacheTtlSeconds?: number;
  enableScheduler?: boolean;
  schedulerProvider?: "none" | "buffer" | "hootsuite";
  schedulerToken?: string;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const TOOL_NAME_BRIEF = "trendpilot_brief";
const TOOL_NAME_SERIES = "trendpilot_series";
const TOOL_NAME_REPURPOSE = "trendpilot_repurpose";
const TOOL_NAME_SCHEDULE = "trendpilot_schedule";

const platformEnum = ["tiktok", "reels", "shorts", "linkedin", "x"] as const;
const formatEnum = [
  "silent-demo",
  "screen-tutorial",
  "carousel",
  "thread",
  "before-after",
  "comment-reply"
] as const;

const briefParams = Type.Object({
  niche: Type.String(),
  audience: Type.String(),
  platforms: Type.Optional(Type.Array(Type.Union(platformEnum.map((p) => Type.Literal(p))))),
  regionCode: Type.Optional(Type.String()),
  includeYouTube: Type.Optional(Type.Boolean()),
  goal: Type.Optional(Type.String())
});

const seriesParams = Type.Object({
  niche: Type.String(),
  platform: Type.Union(platformEnum.map((p) => Type.Literal(p))),
  count: Type.Optional(Type.Number({ default: 10 })),
  goal: Type.String(),
  tone: Type.Optional(Type.Union([
    Type.Literal("practical"),
    Type.Literal("bold"),
    Type.Literal("friendly"),
    Type.Literal("analytical")
  ])),
  faceless: Type.Optional(Type.Boolean())
});

const repurposeParams = Type.Object({
  sourceText: Type.String(),
  platform: Type.Union(platformEnum.map((p) => Type.Literal(p))),
  goal: Type.String(),
  audience: Type.Optional(Type.String()),
  faceless: Type.Optional(Type.Boolean())
});

const scheduleParams = Type.Object({
  provider: Type.Union([Type.Literal("buffer"), Type.Literal("hootsuite")]),
  content: Type.String(),
  whenISO: Type.String()
});

const CACHE_KEY_PREFIX = "yt:";

type TrendExample = {
  title: string;
  channel: string;
  publishedAt: string;
  viewCount: string;
};

type CachedEntry = {
  expiresAt: number;
  items: TrendExample[];
};

const cache = new Map<string, CachedEntry>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const safeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const ensureMaxLen = (value: string, max: number, field: string) => {
  if (value.length > max) {
    throw new Error(`${field} exceeds ${max} characters`);
  }
};

const makeTextResult = (obj: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(obj, null, 2) }]
});

const resolveConfig = (api: any): TrendpilotConfig => {
  const fullConfig = typeof api?.getConfig === "function" ? api.getConfig() : undefined;
  return (
    fullConfig?.plugins?.entries?.trendpilot?.config ??
    api?.config ??
    {}
  );
};

const getYouTubeTrends = async (
  config: TrendpilotConfig,
  regionCode: string,
  fetchFn?: FetchFn
): Promise<{ items: TrendExample[]; dataSources: string[] }> => {
  if (!config.youtubeApiKey || !fetchFn) {
    return { items: [], dataSources: ["none"] };
  }

  const ttl = clamp(config.cacheTtlSeconds ?? 600, 60, 3600);
  const cacheKey = `${CACHE_KEY_PREFIX}${regionCode}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { items: cached.items, dataSources: ["youtube"] };
  }

  const maxResults = clamp(config.youtubeMaxResults ?? 10, 1, 50);
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("regionCode", regionCode);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", config.youtubeApiKey);

  const response = await fetchFn(url.toString());
  if (!response.ok) {
    return { items: [], dataSources: ["youtube"] };
  }
  const json = (await response.json()) as any;
  const items = Array.isArray(json?.items) ? json.items : [];
  const mapped: TrendExample[] = items.map((item: any) => ({
    title: safeString(item?.snippet?.title),
    channel: safeString(item?.snippet?.channelTitle),
    publishedAt: safeString(item?.snippet?.publishedAt),
    viewCount: safeString(item?.statistics?.viewCount)
  }));

  cache.set(cacheKey, { items: mapped, expiresAt: now + ttl * 1000 });
  return { items: mapped, dataSources: ["youtube"] };
};

const buildAngles = (niche: string, goal: string) => {
  const base = [
    `Fastest path to results in ${niche}`,
    `Common mistakes holding back ${niche} growth`,
    `Budget vs premium tradeoffs in ${niche}`,
    `Before/after outcomes tied to ${goal}`,
    `Step-by-step playbook for ${niche} beginners`,
    `Myth-busting claims in ${niche}`,
    `Tools stack comparison for ${niche}`,
    `Time-saving workflows in ${niche}`,
    `The "one metric" that drives ${niche} outcomes`,
    `What experts do differently in ${niche}`
  ];
  return base.slice(0, 8);
};

const buildHooks = (niche: string, audience: string, seed: number) => {
  const templates = [
    `Why is ${audience} still struggling with ${niche}?`,
    `The ${niche} shortcut nobody tells ${audience} about`,
    `Stop doing this if you want better ${niche} results`,
    `I tested 3 ${niche} methods—here's what worked`,
    `If you have 10 minutes, try this ${niche} fix`,
    `The hidden cost of "good enough" ${niche}`,
    `Is this the simplest ${niche} framework ever?`,
    `What I wish I knew about ${niche} sooner`,
    `You only need these 3 steps for ${niche}`,
    `The mistake that kills ${niche} progress for ${audience}`,
    `Here’s a no-fluff ${niche} checklist`,
    `This ${niche} habit compounds fast—start today`,
    `The 60-second ${niche} audit anyone can do`,
    `If your ${niche} isn’t working, check this first`,
    `The underrated ${niche} move ${audience} ignore`,
    `One tweak that makes ${niche} feel effortless`,
    `A simple ${niche} template you can copy`,
    `What happens when you remove this from ${niche}`,
    `The ${niche} trend that’s quietly winning`,
    `Why most ${niche} advice fails in 2026`
  ];
  const start = seed % 4;
  return templates.slice(start, start + 14);
};

const buildStoryboardTemplates = () => [
  {
    name: "Silent demo loop",
    description: "Show before/after or step change with captions and UI highlights.",
    beats: ["Problem state", "Action", "Result", "CTA"]
  },
  {
    name: "Screen-record tutorial",
    description: "Record a short workflow with text callouts for each step.",
    beats: ["Goal", "Steps 1-3", "Outcome", "CTA"]
  },
  {
    name: "Carousel / thread",
    description: "Multi-slide breakdown with punchy headlines and 1 idea per slide.",
    beats: ["Hook", "Insight", "How-to", "CTA"]
  }
];

const buildShots = (niche: string, platform: string) => [
  `Screen capture showing a ${niche} setup step on ${platform}`,
  `Overlay text highlighting a key metric for ${niche}`,
  `B-roll of tools or UI relevant to ${niche}`,
  `Final result screen with outcome callout`
];

const buildOnScreenText = (niche: string, goal: string) => [
  `${niche} quick win`,
  `Do this for ${goal}`,
  `Step-by-step`,
  `Save for later`
];

const buildStructure = (goal: string) => [
  "Hook",
  "Key idea",
  "Steps",
  "Outcome",
  `CTA for ${goal}`
];

const limitArray = <T>(arr: T[], count: number) => arr.slice(0, count);

export const createTrendpilotTools = (config: TrendpilotConfig, fetchFn?: FetchFn) => {
  const resolvedFetch = fetchFn ?? (typeof fetch === "function" ? fetch : undefined);

  const trendpilot_brief = {
    name: TOOL_NAME_BRIEF,
    description: "Generate a trend brief with angles, hooks, and faceless storyboard templates.",
    parameters: briefParams,
    execute: async (input: any): Promise<ToolResult> => {
      const niche = safeString(input?.niche);
      const audience = safeString(input?.audience);
      const goal = safeString(input?.goal ?? "awareness");

      ensureMaxLen(niche, 200, "niche");
      ensureMaxLen(audience, 200, "audience");
      ensureMaxLen(goal, 200, "goal");

      const platforms = Array.isArray(input?.platforms)
        ? input.platforms
        : ["tiktok", "reels", "shorts"];
      const includeYouTube = input?.includeYouTube !== false;
      const regionCode = safeString(
        input?.regionCode ?? config.youtubeRegionCode ?? "US"
      );

      const seed = hashString(`${niche}|${audience}|${goal}`);
      const hooks = buildHooks(niche, audience, seed);
      const angles = buildAngles(niche, goal);

      let trendExamples: TrendExample[] = [];
      let dataSources = ["none"] as string[];

      if (includeYouTube) {
        const yt = await getYouTubeTrends(config, regionCode, resolvedFetch);
        trendExamples = yt.items;
        dataSources = yt.dataSources;
      }

      const summary = [
        `Audience: ${audience}`,
        `Primary goal: ${goal}`,
        `Platforms: ${platforms.join(", ")}`,
        `Focus on faceless-friendly formats and short loops`
      ];

      return makeTextResult({
        summary,
        angles: limitArray(angles, 8),
        hooks: limitArray(hooks, 14),
        facelessStoryboardTemplates: buildStoryboardTemplates(),
        compliance: "avoid misleading claims, avoid spam, cite sources if you quote stats",
        trendExamples,
        dataSources
      });
    }
  };

  const trendpilot_series = {
    name: TOOL_NAME_SERIES,
    description: "Generate a multi-post series plan with faceless-friendly formats.",
    parameters: seriesParams,
    execute: async (input: any): Promise<ToolResult> => {
      const niche = safeString(input?.niche);
      const goal = safeString(input?.goal);
      const platform = safeString(input?.platform);
      const count = clamp(Number(input?.count ?? 10), 7, 14);
      const tone = safeString(input?.tone ?? "practical");

      ensureMaxLen(niche, 200, "niche");
      ensureMaxLen(goal, 200, "goal");

      const seed = hashString(`${niche}|${platform}|${goal}|${tone}`);

      const calendar = Array.from({ length: count }).map((_, index) => {
        const format = formatEnum[(seed + index) % formatEnum.length];
        const hook = buildHooks(niche, "creators", seed + index)[0];
        const title = `${niche} ${format} #${index + 1}`;
        const shots = buildShots(niche, platform);
        const onScreenText = buildOnScreenText(niche, goal);
        const base = {
          dayIndex: index + 1,
          title,
          hook,
          format,
          shots,
          onScreenText,
          CTA: `Follow for more ${niche} ${goal} wins`
        } as any;

        if (index < 3) {
          base.abVariants = [
            hook,
            buildHooks(niche, "creators", seed + index + 9)[0],
            buildHooks(niche, "creators", seed + index + 18)[0]
          ];
        }

        return base;
      });

      return makeTextResult({ calendar });
    }
  };

  const trendpilot_repurpose = {
    name: TOOL_NAME_REPURPOSE,
    description: "Repurpose source text into faceless-friendly drafts for a platform.",
    parameters: repurposeParams,
    execute: async (input: any): Promise<ToolResult> => {
      const sourceText = safeString(input?.sourceText);
      const platform = safeString(input?.platform);
      const goal = safeString(input?.goal);
      const audience = safeString(input?.audience ?? "creators");

      ensureMaxLen(sourceText, 20000, "sourceText");
      ensureMaxLen(goal, 200, "goal");
      ensureMaxLen(audience, 200, "audience");

      const seed = hashString(`${sourceText}|${platform}|${goal}`);
      const baseTitle = sourceText.split(/\s+/).slice(0, 6).join(" ").trim() || "Key insight";

      const drafts = [0, 1, 2].map((i) => {
        const hook = buildHooks(platform, audience, seed + i)[0];
        const structure = buildStructure(goal);
        const facelessShots = [
          `Screen capture of the main point for ${platform}`,
          "Overlay text summarizing the insight",
          "Quick b-roll or UI highlight",
          "Final CTA slide"
        ];
        return {
          title: `${baseTitle} (${platform} cut ${i + 1})`,
          caption: `${hook} | ${goal}`,
          structure,
          facelessShots,
          subtitleScript: `${hook}\n${sourceText}\nCTA: ${goal}`,
          CTA: `Save this if you're focused on ${goal}`
        };
      });

      return makeTextResult({ drafts });
    }
  };

  const trendpilot_schedule = {
    name: TOOL_NAME_SCHEDULE,
    description: "Schedule a post via a supported provider (optional tool).",
    parameters: scheduleParams,
    execute: async (input: any): Promise<ToolResult> => {
      if (!config.enableScheduler || config.schedulerProvider === "none") {
        return makeTextResult({
          message: "Scheduling is not enabled for this plugin."
        });
      }

      return makeTextResult({
        message: "Scheduling not implemented yet.",
        provider: safeString(input?.provider)
      });
    }
  };

  return {
    trendpilot_brief,
    trendpilot_series,
    trendpilot_repurpose,
    trendpilot_schedule
  };
};

export default function register(api: any) {
  const config = resolveConfig(api);
  const tools = createTrendpilotTools(config);

  api.registerTool(tools.trendpilot_brief);
  api.registerTool(tools.trendpilot_series);
  api.registerTool(tools.trendpilot_repurpose);
  api.registerTool(tools.trendpilot_schedule, { optional: true });
}
