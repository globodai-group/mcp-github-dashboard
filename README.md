# 📊 MCP GitHub Dashboard

[![npm version](https://badge.fury.io/js/@artik0din%2Fmcp-github-dashboard.svg)](https://badge.fury.io/js/@artik0din%2Fmcp-github-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)

A comprehensive GitHub project dashboard for the Model Context Protocol (MCP). Monitor multiple repositories, pull requests, issues, deployments, and health status through AI assistants like Claude.

## ✨ Features

- 📋 **Multi-Project Management** - Monitor multiple repositories from one place
- 🔍 **Repository Status** - View commits, PRs, issues, and workflow status
- 🚀 **Deployment Tracking** - Monitor GitHub Actions and Heroku deployments
- 🏥 **Health Monitoring** - Check URL health for production/staging environments
- 📊 **Comprehensive Dashboard** - Get complete project overviews at a glance
- 🔒 **Secure** - Uses your GitHub tokens with proper scoping

## 📋 Prerequisites

- **GitHub Personal Access Token** - [Generate here](https://github.com/settings/tokens)
- **Node.js** 16+ for running the MCP server
- **Repository Access** - Token must have access to repos you want to monitor

### GitHub Token Scopes Required
- `repo` - Access to repository data
- `workflow` - Access to GitHub Actions (optional, for deployment monitoring)

## 🚀 Quick Start

### Using with npx (recommended)
```bash
GITHUB_TOKEN=your-token GITHUB_PROJECTS='[{"id":"test","name":"Test","github":{"owner":"user","repo":"repo"}}]' npx @artik0din/mcp-github-dashboard
```

### Install globally
```bash
npm install -g @artik0din/mcp-github-dashboard
export GITHUB_TOKEN=your-token
export GITHUB_PROJECTS='[...]'
mcp-github-dashboard
```

## 🔧 Configuration

### Environment Variables

#### Required
- **GITHUB_TOKEN** - Your GitHub personal access token
- **GITHUB_PROJECTS** - JSON array of project configurations

#### Optional
- **HEROKU_API_KEY** - For Heroku deployment monitoring

### Project Configuration

The `GITHUB_PROJECTS` environment variable should contain a JSON array of project configurations:

```json
[
  {
    "id": "my-app",
    "name": "My Application",
    "description": "Main web application",
    "github": {
      "owner": "my-org",
      "repo": "my-app"
    },
    "heroku": {
      "appName": "my-app-production"
    },
    "urls": {
      "production": "https://my-app.com",
      "staging": "https://staging.my-app.com"
    },
    "tags": ["web", "production"]
  },
  {
    "id": "my-api",
    "name": "My API",
    "description": "Backend API service",
    "github": {
      "owner": "my-org",
      "repo": "my-api"
    },
    "tags": ["api", "backend"]
  }
]
```

#### Configuration Options

- **id** (required) - Unique project identifier
- **name** (required) - Human-readable project name
- **description** (optional) - Project description
- **github** (optional) - GitHub repository information
  - **owner** - GitHub username or organization
  - **repo** - Repository name
- **heroku** (optional) - Heroku app information
  - **appName** - Heroku app name
- **urls** (optional) - Environment URLs for health checking
  - **production** - Production URL
  - **staging** - Staging URL
- **tags** (optional) - Array of tags for filtering

## 🔧 MCP Client Setup

Add this server to your MCP client configuration:

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "github-dashboard": {
      "command": "npx",
      "args": ["@artik0din/mcp-github-dashboard"],
      "env": {
        "GITHUB_TOKEN": "your-github-token",
        "GITHUB_PROJECTS": "[{\"id\":\"my-project\",\"name\":\"My Project\",\"github\":{\"owner\":\"user\",\"repo\":\"repo\"}}]",
        "HEROKU_API_KEY": "your-heroku-api-key"
      }
    }
  }
}
```

### Using .env file
1. Copy `.env.example` to `.env`
2. Fill in your configuration
3. Use without env in MCP config:
```json
{
  "mcpServers": {
    "github-dashboard": {
      "command": "npx",
      "args": ["@artik0din/mcp-github-dashboard"]
    }
  }
}
```

## 📚 Available Tools

### Project Management
- **list_projects** - List all configured projects
  - `tag` (string, optional) - Filter by tag

### Repository Status
- **get_project_status** - Get comprehensive project status
  - `project_id` (string, required) - Project ID
  - Returns: commits, PR/issue counts, workflow status, health checks

- **list_prs** - List pull requests for a project
  - `project_id` (string, required) - Project ID
  - `state` (string) - PR state: open, closed, all (default: open)
  - `limit` (number) - Max PRs to return (default: 20)

- **list_issues** - List issues for a project
  - `project_id` (string, required) - Project ID
  - `state` (string) - Issue state: open, closed, all (default: open)
  - `labels` (array) - Filter by label names
  - `limit` (number) - Max issues to return (default: 20)

### Deployment Monitoring
- **get_deployments** - Get recent deployments
  - `project_id` (string, required) - Project ID
  - `limit` (number) - Max deployments to return (default: 10)
  - Returns: GitHub Actions runs, Heroku releases

## 💡 Usage Examples

### Monitor Project Health
```javascript
// Use get_project_status tool with:
// project_id: "my-app"
// Returns overview of commits, PRs, issues, workflows, URL health
```

### Check Pull Requests
```javascript
// Use list_prs tool with:
// project_id: "my-app"
// state: "open"
// limit: 10
```

### View Recent Deployments
```javascript
// Use get_deployments tool with:
// project_id: "my-app"
// limit: 5
// Returns GitHub Actions and Heroku deployment status
```

### Filter Projects by Tag
```javascript
// Use list_projects tool with:
// tag: "production"
// Returns only projects tagged with "production"
```

## 🏥 Health Monitoring

The dashboard automatically monitors URL health for configured environments:

- **Production/Staging URLs** - HTTP HEAD requests to check availability
- **Response Codes** - Tracks HTTP status and response time
- **Status Summary** - Quick overview of all environment health

## 📈 GitHub Integration

Monitors the following GitHub data:

- **Recent Commits** - Last 5 commits with author and message
- **Pull Requests** - Open/closed PRs with reviewers and labels
- **Issues** - Repository issues (excluding PRs) with assignees
- **GitHub Actions** - Workflow runs and deployment status
- **Repository Health** - Overall activity and status

## 🚀 Heroku Integration

When Heroku app names are configured and `HEROKU_API_KEY` is provided:

- **Release History** - Recent deployments and releases
- **Deployment Status** - Success/failure of deployments
- **User Attribution** - Who deployed what and when

## 🔒 Security

- Uses personal GitHub tokens with minimal required scopes
- No credential storage - reads from environment only
- HTTPS-only API communication
- Respects GitHub API rate limits

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/artik0din/mcp-github-dashboard.git
cd mcp-github-dashboard
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Build and run
npm run build
npm start

# Development mode
npm run dev
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 🔗 Related

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Heroku Platform API](https://devcenter.heroku.com/articles/platform-api-reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)