# TrendPilot (CreatorOps)

TrendPilot is an OpenClaw plugin that turns trend signals into actionable content briefs, repeatable series plans, and faceless post/storyboard packs.

## Install

1. Add this plugin to your OpenClaw plugins directory.
2. Build it:
   - `npm install`
   - `npm run build`

## Configuration

Plugin config lives under `plugins.entries.trendpilot.config`.

Example (OpenClaw config snippet):

```json
{
  "plugins": {
    "entries": {
      "trendpilot": {
        "enabled": true,
        "config": {
          "youtubeApiKey": "YOUR_KEY",
          "youtubeRegionCode": "US",
          "youtubeMaxResults": 10,
          "cacheTtlSeconds": 600,
          "enableScheduler": false,
          "schedulerProvider": "none",
          "schedulerToken": ""
        }
      }
    }
  },
  "agents": {
    "list": [
      {
        "name": "creator-agent",
        "tools": {
          "allow": [
            "trendpilot_brief",
            "trendpilot_series",
            "trendpilot_repurpose"
          ]
        }
      }
    ]
  }
}
```

To enable the optional scheduler tool, add it to the allowlist **and** enable it in config:

```json
{
  "plugins": {
    "entries": {
      "trendpilot": {
        "enabled": true,
        "config": {
          "enableScheduler": true,
          "schedulerProvider": "buffer",
          "schedulerToken": "YOUR_TOKEN"
        }
      }
    }
  },
  "agents": {
    "list": [
      {
        "name": "creator-agent",
        "tools": {
          "allow": [
            "trendpilot_brief",
            "trendpilot_series",
            "trendpilot_repurpose",
            "trendpilot_schedule"
          ]
        }
      }
    ]
  }
}
```

## Security notes

- Secrets (API keys/tokens) are never logged.
- The plugin only calls YouTube if `youtubeApiKey` is configured and `includeYouTube` is true.
- No filesystem writes, shell commands, or system tools are used.

## Tests

- `npm test`
