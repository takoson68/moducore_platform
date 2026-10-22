export const releaseRetentionPolicy = Object.freeze({
  releaseRetention: 'permanent',
  actionsArtifactDays: 7,
  minimumVerifiedReleasesPerProject: 3,
  deletionCooldownDays: 30,
  warning: Object.freeze({ projectVersions: 20, projectBytes: 1024 ** 3, repositoryVersions: 50, repositoryBytes: 3 * 1024 ** 3 }),
  critical: Object.freeze({ projectVersions: 40, projectBytes: 2 * 1024 ** 3, repositoryVersions: 100, repositoryBytes: 5 * 1024 ** 3 }),
})

const dayMs = 24 * 60 * 60 * 1000

function verified(release) {
  return release?.artifact?.completeness === 'complete' && release?.artifact?.integrity === 'verified'
}

export function assertReleaseDeletionAllowed(project, deletionTags, now = new Date().toISOString()) {
  const tags = new Set(deletionTags)
  const verifiedReleases = project.releases.filter(verified)
  const remaining = verifiedReleases.filter((release) => !tags.has(release.tag))
  const minimum = Math.min(releaseRetentionPolicy.minimumVerifiedReleasesPerProject, verifiedReleases.length)
  if (remaining.length < minimum) throw new Error('MINIMUM_VERIFIED_RELEASES')

  const cutoff = Date.parse(now) - releaseRetentionPolicy.deletionCooldownDays * dayMs
  for (const release of verifiedReleases.filter((item) => tags.has(item.tag))) {
    const publishedAt = Date.parse(release.publishedAt)
    if (!Number.isFinite(publishedAt)) throw new Error('RELEASE_PUBLISHED_AT_REQUIRED')
    if (publishedAt > cutoff) throw new Error('RELEASE_COOLDOWN_ACTIVE')
  }
  return true
}

export function assessReleaseStorage(projects) {
  const projectResults = projects.map((project) => {
    const releases = project.releases.filter(verified)
    const bytes = releases.reduce((sum, release) => sum + Object.values(release.artifact || {})
      .filter((asset) => asset && typeof asset === 'object' && Number.isFinite(asset.size))
      .reduce((assetSum, asset) => assetSum + asset.size, 0), 0)
    const severity = releases.length >= releaseRetentionPolicy.critical.projectVersions || bytes >= releaseRetentionPolicy.critical.projectBytes
      ? 'critical'
      : releases.length >= releaseRetentionPolicy.warning.projectVersions || bytes >= releaseRetentionPolicy.warning.projectBytes
        ? 'warning'
        : 'normal'
    return { project: project.key, versions: releases.length, bytes, severity }
  })
  const versions = projectResults.reduce((sum, item) => sum + item.versions, 0)
  const bytes = projectResults.reduce((sum, item) => sum + item.bytes, 0)
  const severity = projectResults.some((item) => item.severity === 'critical') || versions >= releaseRetentionPolicy.critical.repositoryVersions || bytes >= releaseRetentionPolicy.critical.repositoryBytes
    ? 'critical'
    : projectResults.some((item) => item.severity === 'warning') || versions >= releaseRetentionPolicy.warning.repositoryVersions || bytes >= releaseRetentionPolicy.warning.repositoryBytes
      ? 'warning'
      : 'normal'
  return { versions, bytes, severity, projects: projectResults, evaluateR2: severity === 'critical' }
}
