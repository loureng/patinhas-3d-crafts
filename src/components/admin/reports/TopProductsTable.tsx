import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductSalesData, formatCurrency } from '@/lib/reports';

interface TopProductsTableProps {
  data: ProductSalesData[];
  isLoading?: boolean;
  maxItems?: number;
}

export function TopProductsTable({ 
  data, 
  isLoading = false, 
  maxItems = 10 
}: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-8 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum produto vendido no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const topProducts = data.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos.</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Qtd. Vendida</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Médio/Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.map((product, index) => (
              <TableRow key={product.productId}>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {product.productName}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {product.totalQuantity}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(product.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {product.orderCount}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(product.totalRevenue / product.orderCount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {data.length > maxItems && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Mostrando {maxItems} de {data.length} produtos
          </div>
        )}
      </CardContent>
    </Card>
  );
}