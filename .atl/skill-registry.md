# Skill Registry — retro-scrum

Generated: 2026-05-20

## User Skills

| Skill | Source | Trigger |
|-------|--------|---------|
| jira-creator | ~/.config/opencode/skills/jira-creator/SKILL.md | When user requests to create a project, generate an epic, or initialize a new service based on a name or Jira issue. |
| issue-creation | ~/.config/opencode/skills/issue-creation/SKILL.md | When creating a GitHub issue, reporting a bug, or requesting a feature. |
| branch-pr | ~/.config/opencode/skills/branch-pr/SKILL.md | When creating a pull request, opening a PR, or preparing changes for review. |
| skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md | When user asks to create a new skill, add agent instructions, or document patterns for AI. |
| go-testing | ~/.config/opencode/skills/go-testing/SKILL.md | When writing Go tests, using teatest, or adding test coverage. |
| judgment-day | ~/.config/opencode/skills/judgment-day/SKILL.md | When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". |
| customize-opencode | ~/.config/opencode/skills/customize-opencode (built-in) | When editing opencode's own configuration: opencode.json, opencode.jsonc, .opencode/, ~/.config/opencode/ |
| sdd-init | ~/.config/opencode/skills/sdd-init/SKILL.md | Initialize SDD context. Trigger: "sdd init", "iniciar sdd", "openspec init". |
| sdd-explore | ~/.config/opencode/skills/sdd-explore/SKILL.md | Explore/investigate ideas before committing to a change. |
| sdd-propose | ~/.config/opencode/skills/sdd-propose/SKILL.md | Create a change proposal with intent, scope, and approach. |
| sdd-spec | ~/.config/opencode/skills/sdd-spec/SKILL.md | Write specifications with requirements and scenarios. |
| sdd-design | ~/.config/opencode/skills/sdd-design/SKILL.md | Create technical design document with architecture decisions. |
| sdd-tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md | Break down a change into an implementation task checklist. |
| sdd-apply | ~/.config/opencode/skills/sdd-apply/SKILL.md | Implement tasks from the change, writing actual code. |
| sdd-verify | ~/.config/opencode/skills/sdd-verify/SKILL.md | Validate implementation matches specs, design, and tasks. |
| sdd-archive | ~/.config/opencode/skills/sdd-archive/SKILL.md | Sync delta specs to main specs and archive a completed change. |
| sdd-onboard | ~/.config/opencode/skills/sdd-onboard/SKILL.md | Guided end-to-end walkthrough of the SDD workflow. |
| skill-registry | ~/.config/opencode/skills/skill-registry/SKILL.md | When user says "update skills", "skill registry", "actualizar skills". |

## Project Conventions

No project-level conventions files found (fresh project).

## Compact Rules

### jira-creator
- When creating Jira epics/tasks, follow the cookiecutter-integration-service standard.
- Use conventional commit format for all generated content.

### issue-creation
- Follow issue-first enforcement system.
- Always create a GitHub issue before implementing a change.

### branch-pr
- Follow PR creation workflow with issue-first enforcement.
- Always verify the issue exists before creating a PR.

### judgment-day
- Launch two independent blind judge sub-agents simultaneously.
- Synthesize findings, apply fixes, re-judge until both pass or escalate after 2 iterations.
- Never mix the two judges' outputs during review.

### go-testing
- Use teatest for Bubbletea TUI testing.
- Follow Gentleman.Dots testing patterns.

### customize-opencode
- Used ONLY for opencode's own configuration files.
- Not for user application code.
