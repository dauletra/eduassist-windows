$ExcludedFolders = @(
    "node_modules",
    "dist-render",
    "dist-electron",
    "dist",
    ".git",
    ".idea"
)

$OutputFile = "structure.txt"

function Get-Structure {
    param(
        [string]$Path = ".",
        [string]$Indent = "",
        [bool]$IsLast = $true
    )

    $currentItem = Get-Item $Path
    $name = $currentItem.Name

    if ($currentItem.PSIsContainer -and ($ExcludedFolders -contains $name)) {
        return
    }

    if ($IsLast) {
        $branch = "+-- "
    } else {
        $branch = "|-- "
    }

    if ($Path -eq ".") {
        Write-Output ($Indent + ".")
    } else {
        Write-Output ($Indent + $branch + $name)
    }

    if ($currentItem.PSIsContainer) {
        $childItems = Get-ChildItem -Path $Path -Force |
            Where-Object {
                -not ($_.PSIsContainer -and ($ExcludedFolders -contains $_.Name))
            }

        # Sort folders first, then files
        $sortedItems = $childItems | Sort-Object @{
            Expression = { if ($_.PSIsContainer) { 0 } else { 1 } }
        }, Name

        $childCount = $sortedItems.Count

        for ($i = 0; $i -lt $childCount; $i++) {
            $childItem = $sortedItems[$i]
            $childIsLast = ($i -eq $childCount - 1)

            if ($Path -eq ".") {
                $newIndent = $Indent
            } else {
                if ($IsLast) {
                    $newIndent = $Indent + "    "
                } else {
                    $newIndent = $Indent + "|   "
                }
            }

            Get-Structure -Path $childItem.FullName -Indent $newIndent -IsLast $childIsLast
        }
    }
}

"Project structure (excluded: $($ExcludedFolders -join ', '))" | Out-File -FilePath $OutputFile -Encoding UTF8
"Generated: $(Get-Date)" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append

Get-Structure | Out-File -FilePath $OutputFile -Encoding UTF8 -Append

Write-Host "Done! File structure (excluding $($ExcludedFolders -join ', ')) saved to $OutputFile"