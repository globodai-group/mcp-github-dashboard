/**
 * Get deployment status for a project
 */

import { json, error, type ToolDefinition } from "../lib/mcp-core.js";
import { getProject, getGitHubToken, getHerokuApiKey } from "../lib/config.js";
import { Octokit } from "octokit";

export const getDeploymentsTool: ToolDefinition = {
  name: "get_deployments",
  description: "Get recent deployments and their status for a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Project ID",
      },
      limit: {
        type: "number",
        description: "Maximum deployments to return (default: 10)",
      },
    },
    required: ["project_id"],
  },
  handler: async (args) => {
    const projectId = args.project_id as string;
    const limit = (args.limit as number) || 10;

    const project = getProject(projectId);
    if (!project) {
      return error(`Project not found: ${projectId}`);
    }

    const deployments: Record<string, unknown> = {};

    // GitHub Actions / Deployments
    if (project.github) {
      const token = getGitHubToken();
      if (token) {
        try {
          const octokit = new Octokit({ auth: token });
          const { owner, repo } = project.github;

          // Get workflow runs (CI/CD)
          const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            per_page: limit,
          });

          deployments.github = {
            workflowRuns: runs.workflow_runs.map((run) => ({
              id: run.id,
              name: run.name,
              branch: run.head_branch,
              status: run.status,
              conclusion: run.conclusion,
              startedAt: run.run_started_at,
              url: run.html_url,
              commit: {
                sha: run.head_sha.substring(0, 7),
                message: run.head_commit?.message?.split("\n")[0],
              },
            })),
          };

          // Get GitHub Deployments (if using GitHub Deployments API)
          const { data: ghDeployments } = await octokit.rest.repos.listDeployments({
            owner,
            repo,
            per_page: limit,
          });

          if (ghDeployments.length > 0) {
            deployments.githubDeployments = await Promise.all(
              ghDeployments.slice(0, 5).map(async (d) => {
                const { data: statuses } = await octokit.rest.repos.listDeploymentStatuses({
                  owner,
                  repo,
                  deployment_id: d.id,
                  per_page: 1,
                });
                return {
                  id: d.id,
                  environment: d.environment,
                  ref: d.ref,
                  createdAt: d.created_at,
                  status: statuses[0]?.state ?? "unknown",
                  url: statuses[0]?.environment_url,
                };
              })
            );
          }
        } catch (err) {
          deployments.github = { error: err instanceof Error ? err.message : "Failed" };
        }
      }
    }

    // Heroku deployments
    if (project.heroku) {
      const apiKey = getHerokuApiKey();
      if (apiKey) {
        try {
          const response = await fetch(
            `https://api.heroku.com/apps/${project.heroku.appName}/releases`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/vnd.heroku+json; version=3",
              },
            }
          );

          if (response.ok) {
            const releases = await response.json() as any[];
            deployments.heroku = {
              appName: project.heroku.appName,
              releases: releases.slice(0, limit).map((r: any) => ({
                version: r.version,
                status: r.status,
                description: r.description,
                createdAt: r.created_at,
                user: r.user?.email,
              })),
            };
          } else {
            deployments.heroku = { error: `HTTP ${response.status}` };
          }
        } catch (err) {
          deployments.heroku = { error: err instanceof Error ? err.message : "Failed" };
        }
      } else {
        deployments.heroku = { error: "No Heroku API key configured" };
      }
    }

    return json({
      project: { id: project.id, name: project.name },
      deployments,
    });
  },
};