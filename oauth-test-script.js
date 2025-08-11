// 🔬 Script de Teste - Validação OAuth Status
// Execute este script no console do navegador (F12) na página /auth

console.log('🔍 Iniciando validação do sistema OAuth...');

// 1. Teste direto da API do Supabase
async function testSupabaseOAuthAPI() {
  console.log('📡 Testando endpoint /auth/v1/settings...');
  
  try {
    const response = await fetch('https://znvctabjuloliuzxzwya.supabase.co/auth/v1/settings', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📊 Resposta da API:', data);
    
    const googleEnabled = data.external_providers?.google?.enabled === true;
    console.log(googleEnabled ? '✅ Google OAuth: CONFIGURADO' : '❌ Google OAuth: NÃO CONFIGURADO');
    
    return { success: true, googleEnabled, data };
  } catch (error) {
    console.error('🚫 Erro ao testar API:', error);
    return { success: false, error };
  }
}

// 2. Teste do componente React (se disponível)
function testOAuthIndicator() {
  console.log('🔍 Verificando componente OAuthStatusIndicator...');
  
  const indicator = document.querySelector('[data-testid="oauth-status"]') || 
                   document.querySelector('.oauth-status') ||
                   Array.from(document.querySelectorAll('*')).find(el => 
                     el.textContent?.includes('Google OAuth') || 
                     el.textContent?.includes('OAuth configurado')
                   );
  
  if (indicator) {
    console.log('✅ Indicador OAuth encontrado:', indicator.textContent);
    console.log('📍 Elemento:', indicator);
    return true;
  } else {
    console.log('❌ Indicador OAuth não encontrado');
    return false;
  }
}

// 3. Teste do botão de ajuda
function testHelpButton() {
  console.log('🔍 Verificando botão de ajuda...');
  
  const helpButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Problemas com o login') ||
    btn.textContent?.includes('ajuda') ||
    btn.textContent?.includes('?')
  );
  
  if (helpButton) {
    console.log('✅ Botão de ajuda encontrado:', helpButton.textContent);
    console.log('📍 Elemento:', helpButton);
    return true;
  } else {
    console.log('❌ Botão de ajuda não encontrado');
    return false;
  }
}

// 4. Teste do tratamento de erro ao clicar em login
function testGoogleLoginError() {
  console.log('🔍 Verificando botão de login Google...');
  
  const googleButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Entrar com Google') ||
    btn.textContent?.includes('Google')
  );
  
  if (googleButton) {
    console.log('✅ Botão Google encontrado:', googleButton.textContent);
    console.log('📍 Elemento:', googleButton);
    console.log('💡 Clique no botão para testar tratamento de erro');
    return true;
  } else {
    console.log('❌ Botão Google não encontrado');
    return false;
  }
}

// 5. Execução completa dos testes
async function runFullValidation() {
  console.log('🚀 Executando validação completa...\n');
  
  const results = {
    apiTest: await testSupabaseOAuthAPI(),
    indicatorTest: testOAuthIndicator(),
    helpButtonTest: testHelpButton(),
    googleButtonTest: testGoogleLoginError()
  };
  
  console.log('\n📊 RESULTADOS DA VALIDAÇÃO:');
  console.log('════════════════════════════');
  console.log(`📡 API Supabase: ${results.apiTest.success ? '✅ OK' : '❌ ERRO'}`);
  console.log(`🎯 Indicador OAuth: ${results.indicatorTest ? '✅ OK' : '❌ ERRO'}`);
  console.log(`❓ Botão de Ajuda: ${results.helpButtonTest ? '✅ OK' : '❌ ERRO'}`);
  console.log(`🔐 Botão Google: ${results.googleButtonTest ? '✅ OK' : '❌ ERRO'}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Score: ${successCount}/4 testes passaram`);
  
  if (results.apiTest.success) {
    console.log(`\n🔧 Status OAuth: ${results.apiTest.googleEnabled ? 'CONFIGURADO' : 'PENDENTE CONFIGURAÇÃO'}`);
  }
  
  console.log('\n💡 Para testar o tratamento de erro, clique no botão "Entrar com Google"');
  console.log('💡 Para testar a ajuda, clique em "Problemas com o login?"');
  
  return results;
}

// Auto-execução
runFullValidation().then(results => {
  console.log('\n✅ Validação concluída!');
  window.oauthValidationResults = results; // Salva resultados globalmente
});
