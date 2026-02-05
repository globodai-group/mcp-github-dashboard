/**
 * List open PRs for a project
 */

import { json, error, type ToolDefinition } from "../lib/mcp-core.js";
import { getProject, getGitHubToken } from "../lib/config.js";
import { Octokit } from "octokit";

export const listPRsTool: ToolDefinition = {
  name: "list_prs",
  description: "List open pull requests for a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Project ID",
      },
      state: {
        type: "string",
        enum: ["open", "closed", "all"],
        description: "PR state filter (default: open)",
      },
      limit: {
        type: "number",
        description: "Maximum PRs to return (default: 20)",
      },
    },
    required: ["project_id"],
  },
  handler: async (args) => {
    const projectId = args.project_id as string;
    const state = (args.state as "open" | "closed" | "all") || "open";
    const limit = (args.limit as number) || 20;

    const project = getProject(projectId);
    if (!project) {
      return error(`Project not found: ${projectId}`);
    }

    if (!project.github) {
      return error(`Project ${projectId} has no GitHub integration`);
    }

    const token = getGitHubToken();
    if (!token) {
      return error("No GitHub token configured");
    }

    try {
      const octokit = new Octokit({ auth: token });
      const { owner, repo } = project.github;

      const { data: prs } = await octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page: limit,
        sort: "updated",
        direction: "desc",
      });

      return json(
        prs.map((pr) => ({
          number: pr.number,
          title: pr.title,
          author: pr.user?.login,
          state: pr.state,
          draft: pr.draft,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          url: pr.html_url,
          labels: pr.labels.map((l) => (typeof l === "string" ? l : l.name)),
          reviewers: pr.requested_reviewers?.map((r) => 
            typeof r === "object" && "login" in r ? r.login : "team"
          ),
        }))
      );
    } catch (err) {
      return error(`Failed to fetch PRs: ${err instanceof Error ? err.message : err}`);
    }
  },
};