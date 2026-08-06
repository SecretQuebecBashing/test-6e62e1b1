const fs = require('node:fs')
const {
  internalArtifactTwirpClient
} = require('@actions/artifact/lib/internal/shared/artifact-twirp-client')
const {
  getBackendIdsFromToken
} = require('@actions/artifact/lib/internal/shared/util')
const {
  uploadZipToBlobStorage
} = require('@actions/artifact/lib/internal/upload/blob-upload')
const {
  ZipUploadStream
} = require('@actions/artifact/lib/internal/upload/zip')
const { StringValue } = require('@actions/artifact/lib/generated')

async function main() {
  const zipPath = process.argv[2]
  const name = 'comparison'
  const backendIds = getBackendIdsFromToken()
  const artifactClient = internalArtifactTwirpClient()

  const created = await artifactClient.CreateArtifact({
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name,
    version: 4
  })
  if (!created.ok) throw new Error('CreateArtifact failed')

  const stream = new ZipUploadStream(8 * 1024 * 1024)
  const upload = uploadZipToBlobStorage(created.signedUploadUrl, stream)
  fs.createReadStream(zipPath).pipe(stream)
  const uploaded = await upload

  const finalized = await artifactClient.FinalizeArtifact({
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name,
    size: String(uploaded.uploadSize || 0),
    hash: StringValue.create({ value: `sha256:${uploaded.sha256Hash}` })
  })
  if (!finalized.ok) throw new Error('FinalizeArtifact failed')

  console.log(`Finalized dummy artifact ${finalized.artifactId}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
