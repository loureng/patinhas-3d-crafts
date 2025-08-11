import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SalesData, ProductSalesData, PeriodSalesData } from '@/lib/reports';
import {
  exportToCSV,
  exportToExcel,
  prepareSalesDataForExport,
  prepareProductDataForExport,
  preparePeriodDataForExport,
  exportCompleteReport
} from '@/lib/export';

interface ExportButtonProps {
  salesData: SalesData[];
  productData: ProductSalesData[];
  periodData: PeriodSalesData[];
  disabled?: boolean;
}

export function ExportButton({ 
  salesData, 
  productData, 
  periodData, 
  disabled = false 
}: ExportButtonProps) {
  const handleExportSalesCSV = () => {
    const data = prepareSalesDataForExport(salesData);
    exportToCSV(data, 'relatorio-vendas.csv');
  };

  const handleExportProductsCSV = () => {
    const data = prepareProductDataForExport(productData);
    exportToCSV(data, 'relatorio-produtos.csv');
  };

  const handleExportPeriodCSV = () => {
    const data = preparePeriodDataForExport(periodData);
    exportToCSV(data, 'relatorio-periodo.csv');
  };

  const handleExportSalesExcel = () => {
    const data = prepareSalesDataForExport(salesData);
    exportToExcel(data, 'relatorio-vendas.xlsx', 'Vendas');
  };

  const handleExportProductsExcel = () => {
    const data = prepareProductDataForExport(productData);
    exportToExcel(data, 'relatorio-produtos.xlsx', 'Produtos');
  };

  const handleExportPeriodExcel = () => {
    const data = preparePeriodDataForExport(periodData);
    exportToExcel(data, 'relatorio-periodo.xlsx', 'Por Período');
  };

  const handleExportCompleteExcel = () => {
    exportCompleteReport(salesData, productData, periodData);
  };

  const hasData = salesData.length > 0 || productData.length > 0 || periodData.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || !hasData}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Exportação CSV */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Formato CSV
        </div>
        {salesData.length > 0 && (
          <DropdownMenuItem onClick={handleExportSalesCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Vendas (CSV)
          </DropdownMenuItem>
        )}
        {productData.length > 0 && (
          <DropdownMenuItem onClick={handleExportProductsCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Produtos (CSV)
          </DropdownMenuItem>
        )}
        {periodData.length > 0 && (
          <DropdownMenuItem onClick={handleExportPeriodCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Por Período (CSV)
          </DropdownMenuItem>
        )}

        {/* Exportação Excel */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
          Formato Excel
        </div>
        {salesData.length > 0 && (
          <DropdownMenuItem onClick={handleExportSalesExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Vendas (Excel)
          </DropdownMenuItem>
        )}
        {productData.length > 0 && (
          <DropdownMenuItem onClick={handleExportProductsExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Produtos (Excel)
          </DropdownMenuItem>
        )}
        {periodData.length > 0 && (
          <DropdownMenuItem onClick={handleExportPeriodExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Por Período (Excel)
          </DropdownMenuItem>
        )}
        
        {/* Relatório Completo */}
        {hasData && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
              Relatório Completo
            </div>
            <DropdownMenuItem onClick={handleExportCompleteExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Todas as Abas (Excel)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}