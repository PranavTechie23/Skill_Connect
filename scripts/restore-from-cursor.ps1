# Merge newest Cursor checkpoint + Local History per file. No git commands.
$ErrorActionPreference = "Stop"
$projectRoot = "D:\Projects\CEP_Project"
$checkpointsRoot = "$env:APPDATA\Cursor\User\globalStorage\anysphere.cursor-commits\checkpoints"
$historyRoot = "$env:APPDATA\Cursor\User\History"
$index = @{}

function Normalize-PathKey([string]$p) {
    return ($p -replace '\\', '/').ToLower()
}

function Register-Version([string]$dest, [long]$ts, [string]$src, [string]$source) {
    $key = Normalize-PathKey $dest
    if (-not $index.ContainsKey($key) -or $ts -gt $index[$key].ts) {
        $index[$key] = @{ dest = $dest; ts = $ts; src = $src; source = $source }
    }
}

# Checkpoints
Get-ChildItem $checkpointsRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $metaPath = Join-Path $_.FullName "metadata.json"
    if (-not (Test-Path $metaPath)) { return }
    $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
    $ts = [long]$meta.startTrackingDateUnixMilliseconds
    foreach ($rf in $meta.requestFiles) {
        if ($rf.fsPath -notlike "$projectRoot*") { continue }
        $src = Join-Path $_.FullName "files\$($rf.fileUuid)"
        if (Test-Path $src) { Register-Version $rf.fsPath $ts $src "checkpoint" }
    }
}

# Local History — every entry, newest timestamp wins
Get-ChildItem $historyRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $entriesPath = Join-Path $_.FullName "entries.json"
    if (-not (Test-Path $entriesPath)) { return }
    try { $json = Get-Content $entriesPath -Raw | ConvertFrom-Json } catch { return }
    if ($json.resource -notmatch "CEP_Project") { return }
    $uri = [Uri]$json.resource
    $dest = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
    if ($dest -match '^/([A-Za-z]:)') { $dest = $dest.Substring(1) }
    $dest = $dest -replace '/', '\'
    if ($dest -notlike "$projectRoot*") { return }
    foreach ($entry in $json.entries) {
        $src = Join-Path $_.FullName $entry.id
        if (-not (Test-Path $src)) { continue }
        $ts = [long]$entry.timestamp
        Register-Version $dest $ts $src "history"
    }
}

$restored = 0
foreach ($kv in $index.Values) {
    $dest = $kv.dest
    $dir = Split-Path $dest -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -Path $kv.src -Destination $dest -Force
    $restored++
}
Write-Host "Indexed $($index.Count) unique paths; copied $restored files."

# Re-apply deletions from pre-reset snapshot (working tree had these removed)
$deleted = @(
    "client/src/components/ErrorDisplay.tsx",
    "client/src/components/JobCategoryDropdown.tsx",
    "client/src/components/MagicCard.css",
    "client/src/components/MagicCard.tsx",
    "client/src/components/NoAuthWrapper.tsx",
    "client/src/components/PixelCard.css",
    "client/src/components/PixelCard.tsx",
    "client/src/components/ProfileCard.d.ts",
    "client/src/components/ProfileCard.tsx",
    "client/src/components/RadixDropdownMenuDemo.tsx",
    "client/src/components/SuccessCard.css",
    "client/src/components/SuccessCard.tsx",
    "client/src/components/footer.tsx",
    "client/src/components/layouts/public-layout.tsx",
    "client/src/components/main-nav.tsx",
    "client/src/components/mobile-nav.tsx",
    "client/src/components/profile-form.tsx",
    "client/src/components/share-story-form.tsx",
    "client/src/components/site-header.tsx",
    "client/src/components/submit-story-form.tsx",
    "client/src/contexts/ThemeContext.tsx",
    "client/src/hooks/use-auth.ts",
    "client/src/pages/employer/candidates.tsx",
    "client/src/pages/employer/story.tsx",
    "client/src/pages/share-story.tsx",
    "client/src/pages/stories.tsx",
    "public/global.css",
    "scripts/migrate.js",
    "scripts/package-lock.json",
    "scripts/package.json",
    "server/drizzle.config.ts",
    "server/routes/admin/stories.ts",
    "server/routes/stories.ts",
    "server/src/routes/stories.ts",
    "server/src/schema.ts",
    "server/src/schemas/job.ts",
    "server/src/utils/db.ts",
    "src/components/GlareHover.tsx"
)
$removed = 0
foreach ($rel in $deleted) {
    $full = Join-Path $projectRoot $rel
    if (Test-Path $full) {
        Remove-Item -Path $full -Force -Recurse -ErrorAction SilentlyContinue
        $removed++
    }
}
Write-Host "Removed $removed files that were deleted in your pre-reset working tree."
