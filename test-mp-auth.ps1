$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5NzMyNTQsImV4cCI6MjAzODU0OTI1NH0.fGfLEJnAqAjNRMa-o9mGJxCa3pXFdWVf2LnUeZqGvqg'
}

$body = @{
    items = @(
        @{
            title = "Teste com AUTH via Desktop Commander"
            quantity = 1
            unit_price = 19.99
        }
    )
    external_reference = "test-auth-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json -Depth 3

Write-Host "Testando com autorizacao Supabase..."

try {
    $response = Invoke-RestMethod -Uri 'https://znvctabjuloliuzxzwya.functions.supabase.co/create-payment-preference' -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCESSO! Resposta:"
    $response | ConvertTo-Json -Depth 5
    
    if ($response.init_point) {
        Write-Host "URL de Pagamento: $($response.init_point)"
        Write-Host "ID da Preferencia: $($response.id)"
    }
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta de erro: $responseBody"
    }
}