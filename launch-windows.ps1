# REBIRTH v0.65 Windows 10/11 portable launcher. Only loopback; no admin or Python.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
$port = 8765
$url = "http://127.0.0.1:$port/"
$signature = 'INTO_THE_ABYSS_404_REBIRTH_v065'
$mime = @{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.json'='application/json; charset=utf-8';'.png'='image/png';'.webp'='image/webp';'.svg'='image/svg+xml';'.woff2'='font/woff2'}
function Open-Game {
  try { Start-Process -FilePath $url -ErrorAction Stop }
  catch { Write-Host "Abre manualmente $url" -ForegroundColor Yellow }
}
$listener = $null
try {
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
  try { $listener.Start() }
  catch {
    $existing = ''
    try {
      $r = Invoke-WebRequest -Uri ($url + '__abyss_health') -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -eq 200) { $existing = [string]$r.Content }
    } catch {}
    if ($existing.Trim() -eq $signature) {
      Write-Host "Juego ya abierto. Abriendo otra pestana: $url" -ForegroundColor Cyan
      Open-Game
      exit 0
    }
    Write-Host 'ERROR: puerto 8765 ocupado por otro programa. Se mantiene fijo para proteger los guardados.' -ForegroundColor Red
    exit 2
  }
  Write-Host 'INTO THE ABYSS 404 - REBIRTH v0.65' -ForegroundColor Cyan
  Write-Host "Juego: $url   |   Cierra esta ventana para detener el servidor."
  Open-Game
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $client.SendTimeout = 5000
      $stream = $client.GetStream()
      $reader = New-Object IO.StreamReader ($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
      $first = $reader.ReadLine()
      if (-not $first) { continue }
      while ($null -ne ($line = $reader.ReadLine()) -and $line -ne '') {}
      $parts = $first.Split(' ')
      $status = '200 OK'
      $body = [byte[]]@()
      $type = 'text/plain; charset=utf-8'
      if ($parts.Length -lt 2 -or $parts[0] -notin @('GET','HEAD')) { $status = '405 Method Not Allowed' }
      else {
        $requestPath = $parts[1].Split('?')[0]
        try { $decoded = [Uri]::UnescapeDataString($requestPath) } catch { $decoded = '' }
        if ($decoded -eq '/__abyss_health') {
          $body = [Text.Encoding]::UTF8.GetBytes($signature)
        }
        elseif ($decoded.Contains('..') -or $decoded.Contains('\') -or $decoded.Contains([char]0) -or -not $decoded.StartsWith('/')) {
          $status = '403 Forbidden'
        }
        else {
          if ($decoded -eq '/') { $decoded = '/index.html' }
          $target = [IO.Path]::GetFullPath((Join-Path $root $decoded.TrimStart('/')))
          if (-not $target.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { $status = '403 Forbidden' }
          elseif (-not [IO.File]::Exists($target)) { $status = '404 Not Found' }
          else {
            $body = [IO.File]::ReadAllBytes($target)
            $extension = [IO.Path]::GetExtension($target).ToLowerInvariant()
            if ($mime.ContainsKey($extension)) { $type = $mime[$extension] }
            else { $type = 'application/octet-stream' }
          }
        }
      }
      if ($status -ne '200 OK') { $body = [Text.Encoding]::UTF8.GetBytes($status) }
      $headers = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nX-Frame-Options: DENY`r`nConnection: close`r`n`r`n"
      $header = [Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($header,0,$header.Length)
      if ($parts[0] -ne 'HEAD' -and $body.Length) { $stream.Write($body,0,$body.Length) }
    } catch { Write-Warning $_.Exception.Message }
    finally { $client.Dispose() }
  }
} catch { Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }
finally { if ($listener) { $listener.Stop() } }
