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
    content: Array<{
        type: "text";
        text: string;
    }>;
};
type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export declare const createTrendpilotTools: (config: TrendpilotConfig, fetchFn?: FetchFn) => {
    trendpilot_brief: {
        name: string;
        description: string;
        parameters: import("@sinclair/typebox").TObject<{
            niche: import("@sinclair/typebox").TString;
            audience: import("@sinclair/typebox").TString;
            platforms: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<import("@sinclair/typebox").TLiteral<"tiktok" | "reels" | "shorts" | "linkedin" | "x">[]>>>;
            regionCode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            includeYouTube: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            goal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        execute: (input: any) => Promise<ToolResult>;
    };
    trendpilot_series: {
        name: string;
        description: string;
        parameters: import("@sinclair/typebox").TObject<{
            niche: import("@sinclair/typebox").TString;
            platform: import("@sinclair/typebox").TUnion<import("@sinclair/typebox").TLiteral<"tiktok" | "reels" | "shorts" | "linkedin" | "x">[]>;
            count: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            goal: import("@sinclair/typebox").TString;
            tone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"practical">, import("@sinclair/typebox").TLiteral<"bold">, import("@sinclair/typebox").TLiteral<"friendly">, import("@sinclair/typebox").TLiteral<"analytical">]>>;
            faceless: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
        execute: (input: any) => Promise<ToolResult>;
    };
    trendpilot_repurpose: {
        name: string;
        description: string;
        parameters: import("@sinclair/typebox").TObject<{
            sourceText: import("@sinclair/typebox").TString;
            platform: import("@sinclair/typebox").TUnion<import("@sinclair/typebox").TLiteral<"tiktok" | "reels" | "shorts" | "linkedin" | "x">[]>;
            goal: import("@sinclair/typebox").TString;
            audience: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            faceless: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
        execute: (input: any) => Promise<ToolResult>;
    };
    trendpilot_schedule: {
        name: string;
        description: string;
        parameters: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"buffer">, import("@sinclair/typebox").TLiteral<"hootsuite">]>;
            content: import("@sinclair/typebox").TString;
            whenISO: import("@sinclair/typebox").TString;
        }>;
        execute: (input: any) => Promise<ToolResult>;
    };
};
export default function register(api: any): void;
export {};
