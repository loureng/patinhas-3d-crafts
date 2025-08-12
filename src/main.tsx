import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🚀 INICIALIZAR LOGGER DE PRODUÇÃO PRIMEIRO
import './utils/productionLogger'

createRoot(document.getElementById("root")!).render(<App />);
