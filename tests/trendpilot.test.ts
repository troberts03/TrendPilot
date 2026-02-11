import { describe, expect, it, vi } from "vitest";
import { createTrendpilotTools } from "../src/index.js";

describe("trendpilot tools", () => {
  it("brief returns required keys without youtubeApiKey", async () => {
    const tools = createTrendpilotTools({});
    const result = await tools.trendpilot_brief.execute({
      niche: "fitness",
      audience: "busy professionals"
    });
    const text = result.content[0].text;
    const obj = JSON.parse(text);
    expect(obj.summary).toBeTruthy();
    expect(obj.angles).toBeTruthy();
    expect(obj.hooks).toBeTruthy();
    expect(obj.facelessStoryboardTemplates).toBeTruthy();
    expect(obj.trendExamples).toEqual([]);
    expect(obj.dataSources).toEqual(["none"]);
  });

  it("series returns correct count and schema", async () => {
    const tools = createTrendpilotTools({});
    const result = await tools.trendpilot_series.execute({
      niche: "devtools",
      platform: "tiktok",
      count: 10,
      goal: "leads"
    });
    const obj = JSON.parse(result.content[0].text);
    expect(obj.calendar.length).toBe(10);
    expect(obj.calendar[0]).toHaveProperty("format");
    expect(obj.calendar[0]).toHaveProperty("shots");
  });

  it("repurpose returns drafts with subtitleScript", async () => {
    const tools = createTrendpilotTools({});
    const result = await tools.trendpilot_repurpose.execute({
      sourceText: "Use short demos to explain complex features.",
      platform: "reels",
      goal: "awareness"
    });
    const obj = JSON.parse(result.content[0].text);
    expect(obj.drafts.length).toBeGreaterThanOrEqual(2);
    expect(obj.drafts[0].subtitleScript).toBeTruthy();
  });

  it("youtube fetch respects maxResults", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            snippet: {
              title: "Video A",
              channelTitle: "Channel A",
              publishedAt: "2026-02-10"
            },
            statistics: {
              viewCount: "12345"
            }
          }
        ]
      })
    });

    const tools = createTrendpilotTools(
      {
        youtubeApiKey: "key",
        youtubeMaxResults: 5,
        youtubeRegionCode: "US"
      },
      fetchMock
    );

    await tools.trendpilot_brief.execute({
      niche: "skincare",
      audience: "founders",
      includeYouTube: true
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("maxResults=5");
  });
});
