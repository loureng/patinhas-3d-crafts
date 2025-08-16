$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    items = @(
        @{
            title = "Teste sem AUTH via Desktop Commander"
            quantity = 1
            unit_price = 15.99
        }
    )
    external_reference = "test-noauth-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 3

Write-Host "Testando SEM autorizacao..."

try {
    $response = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCESSO! Resposta:"
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta de erro: $responseBody"
    }
}