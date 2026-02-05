/**
 * GitHub Dashboard Configuration
 * 
 * Simplified configuration via environment variables
 */

export interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  github?: {
    owner: string;
    repo: string;
  };
  heroku?: {
    appName: string;
  };
  urls?: {
    production?: string;
    staging?: string;
  };
  tags?: string[];
}

/**
 * Parse projects from environment variable
 * Expected format: JSON string containing array of ProjectConfig
 */
export function getProjects(): ProjectConfig[] {
  const projectsEnv = process.env.GITHUB_PROJECTS;
  if (!projectsEnv) {
    return [];
  }

  try {
    const projects = JSON.parse(projectsEnv);
    return Array.isArray(projects) ? projects : [];
  } catch {
    console.error("Invalid GITHUB_PROJECTS format. Expected JSON array.");
    return [];
  }
}

export function getProject(id: string): ProjectConfig | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export function getGitHubToken(): string | null {
  return process.env.GITHUB_TOKEN ?? null;
}

export function getHerokuApiKey(): string | null {
  return process.env.HEROKU_API_KEY ?? null;
}