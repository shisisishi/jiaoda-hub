# 本地启动总控静态页 + /api/status（仅本机 127.0.0.1）。
# 公开仓库不含作者机器上的子项目路径；请自行在相邻目录部署各服务后改端口或扩展脚本。

$Hub = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $Node) {
  Write-Error '未找到 node.exe，请先安装 Node.js。'
  exit 1
}

Start-Process -FilePath $Node -ArgumentList 'server.mjs' -WorkingDirectory $Hub -WindowStyle Minimized
Start-Sleep -Seconds 1
Start-Process 'http://127.0.0.1:8330/'
