$base = "http://127.0.0.1:8000"

Write-Host "1) GET /api/investor"
$inv = Invoke-RestMethod "$base/api/investor"
Write-Host $inv.name

Write-Host "2) GET /api/deals"
$deals = Invoke-RestMethod "$base/api/deals"
Write-Host $deals.deals.Count

Write-Host "3) GET /api/deals/routepilot"
$d = Invoke-RestMethod "$base/api/deals/routepilot"
Write-Host $d.masked_name

Write-Host "4) POST /ask (answerable)"
$a1 = Invoke-RestMethod -Method Post -Uri "$base/api/deals/routepilot/ask" -ContentType "application/json" -Body '{"message":"What is the MRR?"}'
Write-Host $a1.status

Write-Host "5) POST /ask (missing)"
$a2 = Invoke-RestMethod -Method Post -Uri "$base/api/deals/routepilot/ask" -ContentType "application/json" -Body '{"message":"What is the founder salary?"}'
Write-Host $a2.status
$suggested = $a2.ticket_suggestion

Write-Host "6) POST /ticket (using AI suggestion)"
$body = @{ question = $suggested.question; category = $suggested.category } | ConvertTo-Json
$t = Invoke-RestMethod -Method Post -Uri "$base/api/deals/routepilot/ticket" -ContentType "application/json" -Body $body
Write-Host $t.ticket_id

Write-Host "7) POST /voice-call"
$vc = Invoke-RestMethod -Method Post -Uri "$base/api/deals/routepilot/voice-call" -ContentType "application/json" -Body '{"topic":"ops"}'
Write-Host $vc.call_id

Write-Host "8) POST /intro-request"
$ir = Invoke-RestMethod -Method Post -Uri "$base/api/deals/routepilot/intro-request" -ContentType "application/json" -Body '{}'
Write-Host $ir.status

Write-Host "9) GET /lead-view"
$lv = Invoke-RestMethod "$base/api/lead-view/routepilot"
$stats = $lv.summary_stats
Write-Host ("questions_asked=" + $stats.questions_asked + " tickets_open=" + $stats.tickets_open + " tickets_answered=" + $stats.tickets_answered + " voice_calls=" + $stats.voice_calls + " intro_requested=" + $stats.intro_requested)
