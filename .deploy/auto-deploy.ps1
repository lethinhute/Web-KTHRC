param(
    [string]$TargetHost = "192.168.1.198",
    [string]$User = "root",
    [int]$Port = 22,
    [string]$KeyPath = "",
    [switch]$SkipTests,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Label"
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

$deployDir = $PSScriptRoot
$repoRoot = Split-Path -Parent $deployDir
$artifactPath = Join-Path $deployDir "web-kthrc-deploy.tar.gz"
$remote = "$User@$TargetHost"
$remoteTarPath = "/root/web-kthrc-deploy.tar.gz"
$remoteDeployScript = "/root/deploy-web-kthrc-final.sh"

$sshCommonArgs = @("-p", "$Port", "-o", "BatchMode=yes", "-o", "ConnectTimeout=12")
if ($KeyPath) {
    $sshCommonArgs += @("-i", $KeyPath)
}

Push-Location $repoRoot
try {
    Invoke-CheckedCommand -Label "Verifying SSH access to $remote" -Command {
        & ssh @sshCommonArgs $remote "echo connected"
    }

    if (-not $SkipTests) {
        Invoke-CheckedCommand -Label "Running backend tests" -Command {
            npm test
        }
    }

    if (-not $SkipBuild) {
        Invoke-CheckedCommand -Label "Building deployable assets" -Command {
            npm run build
        }
    }

    Invoke-CheckedCommand -Label "Packaging deployment artifact" -Command {
        tar -czf $artifactPath `
            --exclude-vcs `
            --exclude=".deploy/web-kthrc-deploy.tar.gz" `
            --exclude="client/node_modules" `
            --exclude="node_modules" `
            --exclude="database/geiger.db" `
            --exclude=".git" `
            --exclude="coverage" `
            --exclude="client/.vite" `
            .
    }

    if (-not (Test-Path $artifactPath)) {
        throw "Deployment artifact was not created at $artifactPath"
    }

    Invoke-CheckedCommand -Label "Uploading artifact" -Command {
        & scp @sshCommonArgs $artifactPath "$remote`:$remoteTarPath"
    }

    Invoke-CheckedCommand -Label "Uploading deploy script" -Command {
        & scp @sshCommonArgs (Join-Path $deployDir "deploy-web-kthrc-final.sh") "$remote`:$remoteDeployScript"
    }

    Invoke-CheckedCommand -Label "Running remote deployment" -Command {
        & ssh @sshCommonArgs $remote "chmod +x $remoteDeployScript; sh $remoteDeployScript; tail -n 60 /root/deploy-web-kthrc-final.log"
    }

    Invoke-CheckedCommand -Label "Checking remote app health" -Command {
        & ssh @sshCommonArgs $remote "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5000/"
    }

    Write-Host "`nDeployment completed successfully."
}
finally {
    Pop-Location
}
