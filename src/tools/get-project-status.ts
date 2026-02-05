/**
 * Get comprehensive project status
 */

import { json, error, type ToolDefinition } from "../lib/mcp-core.js";
import { getProject, getGitHubToken } from "../lib/config.js";
import { Octokit } from "octokit";

export const getProjectStatusTool: ToolDefinition = {
  name: "get_project_status",
  description: "Get comprehensive status for a project (commits, PRs, issues, deployments)",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Project ID",
      },
    },
    required: ["project_id"],
  },
  handler: async (args) => {
    const projectId = args.project_id as string;
    const project = getProject(projectId);

    if (!project) {
      return error(`Project not found: ${projectId}`);
    }

    const status: Record<string, unknown> = {
      project: {
        id: project.id,
        name: project.name,
      },
    };

    // GitHub status
    if (project.github) {
      const token = getGitHubToken();
      if (token) {
        try {
          const octokit = new Octokit({ auth: token });
          const { owner, repo } = project.github;

          // Get recent commits
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 5,
          });

          // Get open PRs count
          const { data: prs } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: "open",
            per_page: 100,
          });

          // Get open issues count
          const { data: issues } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: "open",
            per_page: 100,
          });

          // Get latest workflow run
          const { data: workflows } = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            per_page: 1,
          });

          status.github = {
            recentCommits: commits.map((c) => ({
              sha: c.sha.substring(0, 7),
              message: c.commit.message.split("\n")[0],
              author: c.commit.author?.name,
              date: c.commit.author?.date,
            })),
            openPRs: prs.length,
            openIssues: issues.filter((i) => !i.pull_request).length,
            lastWorkflowRun: workflows.workflow_runs[0]
              ? {
                  name: workflows.workflow_runs[0].name,
                  status: workflows.workflow_runs[0].status,
                  conclusion: workflows.workflow_runs[0].conclusion,
                  url: workflows.workflow_runs[0].html_url,
                }
              : null,
          };
        } catch (err) {
          status.github = { error: err instanceof Error ? err.message : "Failed to fetch" };
        }
      } else {
        status.github = { error: "No GitHub token configured" };
      }
    }

    // URLs health check (simple)
    if (project.urls) {
      status.health = {};
      for (const [env, url] of Object.entries(project.urls)) {
        if (url) {
          try {
            const response = await fetch(url, { method: "HEAD" });
            (status.health as Record<string, unknown>)[env] = {
              url,
              status: response.status,
              ok: response.ok,
            };
          } catch {
            (status.health as Record<string, unknown>)[env] = {
              url,
              status: "unreachable",
              ok: false,
            };
          }
        }
      }
    }

    return json(status);
  },
};