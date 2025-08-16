$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    items = @(
        @{
            title = "Produto Teste Desktop Commander"
            quantity = 1
            unit_price = 25.99
        }
    )
    external_reference = "test-dc-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 3

Write-Host "🧪 Testando Mercado Pago via Desktop Commander..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ SUCESSO! Resposta do MP:"
    $response | ConvertTo-Json -Depth 5
    
    if ($response.init_point) {
        Write-Host "🚀 URL de Pagamento: $($response.init_point)"
    }
    
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)"
    Write-Host "Detalhes: $($_.Exception.Response)"
}