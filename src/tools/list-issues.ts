/**
 * List issues for a project
 */

import { json, error, type ToolDefinition } from "../lib/mcp-core.js";
import { getProject, getGitHubToken } from "../lib/config.js";
import { Octokit } from "octokit";

export const listIssuesTool: ToolDefinition = {
  name: "list_issues",
  description: "List issues for a project (excludes PRs)",
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
        description: "Issue state filter (default: open)",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Filter by labels",
      },
      limit: {
        type: "number",
        description: "Maximum issues to return (default: 20)",
      },
    },
    required: ["project_id"],
  },
  handler: async (args) => {
    const projectId = args.project_id as string;
    const state = (args.state as "open" | "closed" | "all") || "open";
    const labels = args.labels as string[] | undefined;
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

      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        labels: labels?.join(","),
        per_page: limit,
        sort: "updated",
        direction: "desc",
      });

      // Filter out PRs (GitHub API returns PRs as issues)
      const realIssues = issues.filter((i) => !i.pull_request);

      return json(
        realIssues.map((issue) => ({
          number: issue.number,
          title: issue.title,
          author: issue.user?.login,
          state: issue.state,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          url: issue.html_url,
          labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
          assignees: issue.assignees?.map((a) => a.login),
          comments: issue.comments,
        }))
      );
    } catch (err) {
      return error(`Failed to fetch issues: ${err instanceof Error ? err.message : err}`);
    }
  },
};