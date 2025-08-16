$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
}

$body = @{
    items = @(
        @{
            title = "CHECKOUT PRO FUNCIONANDO!"
            quantity = 1
            unit_price = 99.99
        }
    )
    back_urls = @{
        success = "https://jardim-das-patinhas.vercel.app/payment/success"
        failure = "https://jardim-das-patinhas.vercel.app/payment/failure"
        pending = "https://jardim-das-patinhas.vercel.app/payment/pending"
    }
    auto_return = "approved"
    external_reference = "test-completo-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 4

Write-Host "TESTE COMPLETO com URLs de retorno..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body
    
    Write-Host ""
    Write-Host "SUCCESS!!! CHECKOUT PRO FUNCIONANDO 100%"
    Write-Host "========================================="
    $response | ConvertTo-Json -Depth 5
    
    if ($response.init_point) {
        Write-Host ""
        Write-Host "URL CHECKOUT MERCADO PAGO:"
        Write-Host "$($response.init_point)"
        Write-Host ""
        Write-Host "ID PREFERENCIA: $($response.id)"
        Write-Host "STATUS: $($response.status)"
    }
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes: $responseBody"
    }
}