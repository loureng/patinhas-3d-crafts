import * as XLSX from 'xlsx';
import { SalesData, ProductSalesData, PeriodSalesData, formatCurrency, formatDate } from './reports';

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Exporta dados para Excel
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados'): void {
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, filename);
}

/**
 * Prepara dados de vendas para exportação
 */
export function prepareSalesDataForExport(salesData: SalesData[]) {
  return salesData.map(sale => ({
    'ID Pedido': sale.id,
    'Data': formatDate(sale.created_at),
    'Status': sale.status,
    'Total': formatCurrency(sale.total_amount),
    'Cliente ID': sale.user_id,
    'Quantidade Itens': sale.items.length,
    'Produtos': sale.items.map(item => item.product.name).join('; ')
  }));
}

/**
 * Prepara dados de produtos para exportação
 */
export function prepareProductDataForExport(productData: ProductSalesData[]) {
  return productData.map(product => ({
    'ID Produto': product.productId,
    'Nome': product.productName,
    'Categoria': product.category,
    'Quantidade Vendida': product.totalQuantity,
    'Receita Total': formatCurrency(product.totalRevenue),
    'Número de Pedidos': product.orderCount,
    'Receita Média por Pedido': formatCurrency(product.totalRevenue / product.orderCount)
  }));
}

/**
 * Prepara dados de período para exportação
 */
export function preparePeriodDataForExport(periodData: PeriodSalesData[]) {
  return periodData.map(period => ({
    'Período': period.period,
    'Data': formatDate(period.date),
    'Receita': formatCurrency(period.revenue),
    'Número de Pedidos': period.orders,
    'Ticket Médio': formatCurrency(period.revenue / period.orders)
  }));
}

/**
 * Exporta relatório completo com múltiplas abas
 */
export function exportCompleteReport(
  salesData: SalesData[],
  productData: ProductSalesData[],
  periodData: PeriodSalesData[],
  filename: string = 'relatorio-completo.xlsx'
): void {
  const workbook = XLSX.utils.book_new();

  // Aba de vendas
  if (salesData.length > 0) {
    const salesSheet = XLSX.utils.json_to_sheet(prepareSalesDataForExport(salesData));
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Vendas');
  }

  // Aba de produtos
  if (productData.length > 0) {
    const productsSheet = XLSX.utils.json_to_sheet(prepareProductDataForExport(productData));
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');
  }

  // Aba de períodos
  if (periodData.length > 0) {
    const periodsSheet = XLSX.utils.json_to_sheet(preparePeriodDataForExport(periodData));
    XLSX.utils.book_append_sheet(workbook, periodsSheet, 'Por Período');
  }

  XLSX.writeFile(workbook, filename);
}

/**
 * Função auxiliar para download de arquivos
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}