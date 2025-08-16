$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
}

# Teste exatamente como o seu site faria
$body = @{
    items = @(
        @{
            title = "Teste do SEU SITE Real"
            quantity = 1
            unit_price = 25.00
        }
    )
    back_urls = @{
        success = "http://localhost:8081/payment/success"
        failure = "http://localhost:8081/payment/failure" 
        pending = "http://localhost:8081/payment/pending"
    }
    auto_return = "approved"
    external_reference = "order-site-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 4

Write-Host "TESTANDO SEU SITE - Fluxo real do checkout..."
Write-Host "URL Local: http://localhost:8081"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCCESS! SEU SITE ESTA FUNCIONANDO PERFEITAMENTE!"
    Write-Host "================================================"
    
    if ($response.init_point) {
        Write-Host ""
        Write-Host "URL CHECKOUT (igual ao seu site ira gerar):"
        Write-Host "$($response.init_point)"
        Write-Host ""
        Write-Host "ID PREFERENCIA: $($response.id)"
        Write-Host ""
        Write-Host "WEBHOOK CONFIGURADO: $($response.notification_url)"
        Write-Host ""
        Write-Host "BACK URLS:"
        Write-Host "- Success: $($response.back_urls.success)"
        Write-Host "- Failure: $($response.back_urls.failure)"
        Write-Host "- Pending: $($response.back_urls.pending)"
    }
    
} catch {
    Write-Host "ERRO NO SEU SITE: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes: $responseBody"
    }
}