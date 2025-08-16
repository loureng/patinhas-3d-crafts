$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828'
}

Write-Host "TESTANDO configuracao das URLs..."

# Teste 1: URLs HTTPS completas (igual ao teste que funcionou)
$body1 = @{
    items = @(
        @{
            title = "Teste 1 - HTTPS"
            quantity = 1
            unit_price = 10.00
        }
    )
    back_urls = @{
        success = "https://jardim-das-patinhas.vercel.app/payment/success"
        failure = "https://jardim-das-patinhas.vercel.app/payment/failure"
        pending = "https://jardim-das-patinhas.vercel.app/payment/pending"
    }
    auto_return = "approved"
    external_reference = "test1-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 4

Write-Host "Teste 1: URLs HTTPS (deve funcionar)..."
try {
    $response1 = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body1
    Write-Host "✅ Teste 1 OK - ID: $($response1.id)"
} catch {
    Write-Host "❌ Teste 1 FALHOU: $($_.Exception.Message)"
}

Write-Host ""

# Teste 2: Sem auto_return (para ver se e o problema)
$body2 = @{
    items = @(
        @{
            title = "Teste 2 - Sem auto_return"
            quantity = 1
            unit_price = 15.00
        }
    )
    back_urls = @{
        success = "https://jardim-das-patinhas.vercel.app/payment/success"
        failure = "https://jardim-das-patinhas.vercel.app/payment/failure"
        pending = "https://jardim-das-patinhas.vercel.app/payment/pending"
    }
    external_reference = "test2-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 4

Write-Host "Teste 2: Sem auto_return..."
try {
    $response2 = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body2
    Write-Host "✅ Teste 2 OK - ID: $($response2.id)"
} catch {
    Write-Host "❌ Teste 2 FALHOU: $($_.Exception.Message)"
}

Write-Host ""

# Teste 3: Localhost (para confirmar que e o problema)
$body3 = @{
    items = @(
        @{
            title = "Teste 3 - Localhost"
            quantity = 1
            unit_price = 20.00
        }
    )
    back_urls = @{
        success = "http://localhost:8081/payment/success"
        failure = "http://localhost:8081/payment/failure"
        pending = "http://localhost:8081/payment/pending"
    }
    auto_return = "approved"
    external_reference = "test3-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 4

Write-Host "Teste 3: Localhost (deve falhar)..."
try {
    $response3 = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body3
    Write-Host "✅ Teste 3 OK - ID: $($response3.id)"
} catch {
    Write-Host "❌ Teste 3 FALHOU (esperado): $($_.Exception.Message)"
}

Write-Host ""
Write-Host "CONCLUSAO: Se Teste 1 OK e Teste 3 falhou, seu site esta correto!"
Write-Host "O problema e apenas URLs localhost que MP nao aceita."