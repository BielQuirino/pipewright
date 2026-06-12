export const GITLAB_CONFIG = {
  id: "gitlab" as const,
  label: "GitLab CI",
  outputFile: ".gitlab-ci.yml",
  templateDir: "pipelines/gitlab",
} as const;
