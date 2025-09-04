// src/lib/export-utils.ts
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'currency' | 'date' | 'percentage' | 'number' | 'text';
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  format: 'csv' | 'excel';
}

/**
 * Formata valor baseado no tipo especificado
 */
const formatValue = (value: unknown, format?: string): string | number => {
  if (value === null || value === undefined) return '';

  switch (format) {
    case 'currency':
      return typeof value === 'number' ?
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) :
        String(value);

    case 'date':
      try {
        return value instanceof Date ?
          value.toLocaleDateString('pt-BR') :
          new Date(value as string | number | Date).toLocaleDateString('pt-BR');
      } catch {
        return String(value);
      }

    case 'percentage':
      return typeof value === 'number' ? `${value.toFixed(2)}%` : String(value);

    case 'number':
      return typeof value === 'number' ?
        new Intl.NumberFormat('pt-BR').format(value) :
        String(value);

    default:
      return String(value);
  }
};

/**
 * Converte dados para CSV
 */
export const convertToCSV = (data: Record<string, unknown>[], columns: ExportColumn[]): string => {
  if (!data.length) return '';

  // Cabeçalhos
  const headers = columns.map(col => col.header);

  // Linhas de dados
  const rows = data.map(row =>
    columns.map(col => {
      const value = formatValue(row[col.key], col.format);
      // Escapar aspas duplas e envolver strings com aspas se necessário
      const stringValue = String(value);
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    })
  );

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Cria arquivo Excel usando XLSX
 */
export const createExcelFile = (data: Record<string, unknown>[], columns: ExportColumn[], sheetName = 'Dados'): ArrayBuffer => {
  // Preparar dados para Excel
  const excelData = data.map(row => {
    const formattedRow: Record<string, unknown> = {};
    columns.forEach(col => {
      formattedRow[col.header] = formatValue(row[col.key], col.format);
    });
    return formattedRow;
  });

  // Criar workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Configurar larguras das colunas
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Gerar buffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

/**
 * Baixa arquivo
 */
export const downloadFile = (content: string | ArrayBuffer, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Função principal de exportação
 */
export const exportData = (options: ExportOptions): void => {
  const { filename, sheetName = 'Dados', columns, data, format } = options;

  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}`;

  if (format === 'csv') {
    const csvContent = convertToCSV(data, columns);
    downloadFile(csvContent, `${fullFilename}.csv`, 'text/csv');
  } else if (format === 'excel') {
    const excelBuffer = createExcelFile(data, columns, sheetName);
    downloadFile(
      excelBuffer,
      `${fullFilename}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }
};

/**
 * Configurações padrão para exportação de produtos
 */
export const PRODUCT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'name', header: 'Nome', width: 30 },
  { key: 'brand', header: 'Marca', width: 20 },
  { key: 'category', header: 'Categoria', width: 20 },
  { key: 'sku', header: 'SKU', width: 15 },
  { key: 'barcode', header: 'Código de Barras', width: 18 },
  { key: 'cost', header: 'Custo', width: 12, format: 'currency' },
  { key: 'wholesale_price', header: 'Preço Atacado', width: 15, format: 'currency' },
  { key: 'retail_price', header: 'Preço Varejo', width: 15, format: 'currency' },
  { key: 'stock', header: 'Estoque', width: 10, format: 'number' },
  { key: 'min_stock', header: 'Estoque Mínimo', width: 15, format: 'number' },
  { key: 'stock_status', header: 'Status Estoque', width: 15 },
  { key: 'margin_percentage', header: 'Margem (%)', width: 12, format: 'percentage' },
  { key: 'stock_value', header: 'Valor Estoque', width: 15, format: 'currency' },
  { key: 'status', header: 'Status', width: 10 },
  { key: 'created_at', header: 'Data Criação', width: 15, format: 'date' },
  { key: 'description', header: 'Descrição', width: 40 }
];

/**
 * Configurações padrão para exportação de vendas
 */
export const SALES_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', header: 'ID da Venda', width: 20 },
  { key: 'created_at', header: 'Data', width: 18, format: 'date' },
  { key: 'customer_name', header: 'Cliente', width: 25 },
  { key: 'customer_type', header: 'Tipo Cliente', width: 15 },
  { key: 'customer_email', header: 'Email', width: 25 },
  { key: 'customer_phone', header: 'Telefone', width: 15 },
  { key: 'customer_document', header: 'Documento', width: 18 },
  { key: 'salesperson_name', header: 'Vendedor', width: 20 },
  { key: 'payment_method', header: 'Método Pagamento', width: 18 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'subtotal', header: 'Subtotal', width: 15, format: 'currency' },
  { key: 'discount_amount', header: 'Desconto', width: 15, format: 'currency' },
  { key: 'total', header: 'Total', width: 15, format: 'currency' },
  { key: 'total_cost', header: 'Custo Total', width: 15, format: 'currency' },
  { key: 'total_profit', header: 'Lucro Total', width: 15, format: 'currency' },
  { key: 'profit_margin', header: 'Margem Lucro (%)', width: 18, format: 'percentage' },
  { key: 'items_count', header: 'Qtd Itens', width: 12, format: 'number' },
  { key: 'notes', header: 'Observações', width: 30 }
];
