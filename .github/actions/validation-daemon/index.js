const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

if (!process.env.INPUT_AUTHTOKEN) process.exit(0)

const daemonDir = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'validation-daemon-'))
const daemon = spawn('sleep', ['600'], {
  detached: true,
  stdio: 'ignore'
})

fs.writeFileSync(path.join(daemonDir, 'daemon.pid'), String(daemon.pid))
fs.appendFileSync(process.env.GITHUB_ENV, `VALIDATION_DAEMON_DIR=${daemonDir}\n`)
daemon.unref()
