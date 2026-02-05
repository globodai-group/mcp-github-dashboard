#!/usr/bin/env node

/**
 * GitHub Project Dashboard MCP Server
 * 
 * Provides project monitoring capabilities:
 * - List all projects
 * - Get project status (health, deployments)
 * - View open PRs and issues
 * - Monitor deployments (GitHub Actions, Heroku)
 * - Check URL health
 * 
 * Required Environment Variables:
 * - GITHUB_TOKEN: Your GitHub personal access token
 * - GITHUB_PROJECTS: JSON array of project configurations
 * 
 * Optional Environment Variables:
 * - HEROKU_API_KEY: For Heroku deployments monitoring
 */

import { createMCPServer, startMCPServer } from "./lib/mcp-core.js";
import { listProjectsTool } from "./tools/list-projects.js";
import { getProjectStatusTool } from "./tools/get-project-status.js";
import { listPRsTool } from "./tools/list-prs.js";
import { listIssuesTool } from "./tools/list-issues.js";
import { getDeploymentsTool } from "./tools/get-deployments.js";

const tools = [
  listProjectsTool,
  getProjectStatusTool,
  listPRsTool,
  listIssuesTool,
  getDeploymentsTool,
];

async function main() {
  // Validate required environment variables
  if (!process.env.GITHUB_TOKEN) {
    console.error("Error: GITHUB_TOKEN environment variable is required");
    console.error("Get your token from: https://github.com/settings/tokens");
    process.exit(1);
  }

  if (!process.env.GITHUB_PROJECTS) {
    console.error("Error: GITHUB_PROJECTS environment variable is required");
    console.error("Set it to a JSON array of project configurations");
    process.exit(1);
  }

  const server = createMCPServer(
    {
      name: "mcp-github-dashboard",
      version: "1.0.0",
      description: "Project monitoring and status MCP server",
    },
    tools
  );

  await startMCPServer(server);
}

main().catch(console.error);