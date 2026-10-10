$files = @(
    "frontend/lib/shared/workflowStore.js",
    "frontend/lib/talent/TalentContext.js",
    "frontend/lib/recruiter/RecruiterContext.js",
    "frontend/lib/admin/AdminContext.js"
)

$used = @()
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $matches = [regex]::Matches($content, '(\w+Service)\.(\w+)\(')
        foreach ($m in $matches) {
            $used += ($m.Groups[1].Value + "." + $m.Groups[2].Value)
        }
    }
}

$used = $used | Select-Object -Unique | Sort-Object

foreach ($item in $used) {
    $parts = $item -split '\.'
    $svc = $parts[0]
    $fn = $parts[1]
    $svcFile = "frontend/lib/api/services/$svc.js"
    $found = $false
    if (Test-Path $svcFile) {
        $svcContent = Get-Content $svcFile -Raw
        if ($svcContent -match "\b$fn\b") {
            $found = $true
        }
    }
    $status = if ($found) { "OK" } else { "MISSING" }
    "{0,-45} {1}" -f $item, $status
}
