Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 96, 128)
$baseDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$iconsDir = Join-Path $baseDir "icons"

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Background gradient circle
    $rect = New-Object System.Drawing.RectangleF(1, 1, ($sz - 2), ($sz - 2))
    $c1 = [System.Drawing.Color]::FromArgb(255, 0, 198, 255)
    $c2 = [System.Drawing.Color]::FromArgb(255, 160, 51, 255)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillEllipse($brush, $rect)

    # Messenger speech bubble shape
    $scale = $sz / 512.0
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    # Draw simplified lightning bolt inside
    $boltBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    [System.Drawing.PointF[]]$boltPoints = @(
        [System.Drawing.PointF]::new([float](286.3 * $scale), [float](311.2 * $scale)),
        [System.Drawing.PointF]::new([float](234.6 * $scale), [float](256.0 * $scale)),
        [System.Drawing.PointF]::new([float](133.8 * $scale), [float](311.2 * $scale)),
        [System.Drawing.PointF]::new([float](244.6 * $scale), [float](193.6 * $scale)),
        [System.Drawing.PointF]::new([float](297.6 * $scale), [float](248.8 * $scale)),
        [System.Drawing.PointF]::new([float](397.1 * $scale), [float](193.6 * $scale))
    )
    $g.FillPolygon($boltBrush, $boltPoints)

    $destPath = Join-Path $iconsDir "icon-$sz.png"
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated icon-$sz.png"
}
