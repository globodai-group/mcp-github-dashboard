/**
 * List all configured projects
 */

import { json, type ToolDefinition } from "../lib/mcp-core.js";
import { getProjects } from "../lib/config.js";

export const listProjectsTool: ToolDefinition = {
  name: "list_projects",
  description: "List all configured projects with their integrations",
  inputSchema: {
    type: "object",
    properties: {
      tag: {
        type: "string",
        description: "Filter by tag",
      },
    },
    required: [],
  },
  handler: async (args) => {
    let projects = getProjects();
    
    if (args.tag) {
      projects = projects.filter((p) => p.tags?.includes(args.tag as string));
    }

    return json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        integrations: {
          github: !!p.github,
          heroku: !!p.heroku,
        },
        urls: p.urls,
        tags: p.tags,
      }))
    );
  },
};