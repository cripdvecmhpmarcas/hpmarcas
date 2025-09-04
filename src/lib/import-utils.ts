// src/lib/import-utils.ts
import * as XLSX from 'xlsx';
import { ProductImportData } from '@/types/products';
import { validatePrice, validateBarcode } from './pdv-utils';

export interface ImportColumn {
  key: string
  header: string
  required: boolean
  validator?: (value: string) => { valid: boolean; message?: string }
}

export interface ParsedProduct extends ProductImportData {
  rowIndex: number;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  // Allow additional properties for shipping data
  [key: string]: unknown;
}

export interface ImportResult {
  products: ParsedProduct[];
  totalRows: number;
  validProducts: number;
  invalidProducts: number;
  duplicateSkus: string[];
  duplicateBarcodes: string[];
}

export interface ImportValidationOptions {
  existingSkus: string[];
  existingBarcodes: string[];
  allowEmptyBarcode?: boolean;
}

/**
 * Estrutura esperada do Excel para importação de produtos
 */
export const IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name', header: 'Nome', required: true },
  { key: 'description', header: 'Descrição', required: false },
  { key: 'brand', header: 'Marca', required: true },
  { key: 'category', header: 'Categoria', required: true },
  { key: 'sku', header: 'SKU', required: true },
  { key: 'barcode', header: 'Código de Barras', required: false },
  {
    key: 'cost',
    header: 'Custo',
    required: true,
    validator: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return { valid: false, message: 'Custo deve ser um número positivo' };
      }
      return validatePrice(numValue);
    }
  },
  {
    key: 'wholesale_price',
    header: 'Preço Atacado',
    required: true,
    validator: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return { valid: false, message: 'Preço atacado deve ser um número positivo' };
      }
      return validatePrice(numValue);
    }
  },
  {
    key: 'retail_price',
    header: 'Preço Varejo',
    required: true,
    validator: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return { valid: false, message: 'Preço varejo deve ser um número positivo' };
      }
      return validatePrice(numValue);
    }
  },
  {
    key: 'stock',
    header: 'Estoque',
    required: true,
    validator: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || !Number.isInteger(numValue)) {
        return { valid: false, message: 'Estoque deve ser um número inteiro positivo' };
      }
      return { valid: true };
    }
  },
  {
    key: 'min_stock',
    header: 'Estoque Mínimo',
    required: true,
    validator: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || !Number.isInteger(numValue)) {
        return { valid: false, message: 'Estoque mínimo deve ser um número inteiro positivo' };
      }
      return { valid: true };
    }
  },
  {
    key: 'status',
    header: 'Status',
    required: true,
    validator: (value) => {
      const statusValue = String(value).toLowerCase();
      if (!['ativo', 'inativo', 'active', 'inactive'].includes(statusValue)) {
        return { valid: false, message: 'Status deve ser "Ativo" ou "Inativo"' };
      }
      return { valid: true };
    }
  },
  { key: 'volumes', header: 'Volumes', required: false },
  // Shipping dimensions
  {
    key: 'weight',
    header: 'Peso (g)',
    required: false,
    validator: (value) => {
      if (!value) return { valid: true };
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 99999.99) {
        return { valid: false, message: 'Peso deve ser um número entre 0 e 99999.99' };
      }
      return { valid: true };
    }
  },
  {
    key: 'length',
    header: 'Comprimento (cm)',
    required: false,
    validator: (value) => {
      if (!value) return { valid: true };
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 999.99) {
        return { valid: false, message: 'Comprimento deve ser um número entre 0 e 999.99' };
      }
      return { valid: true };
    }
  },
  {
    key: 'width',
    header: 'Largura (cm)',
    required: false,
    validator: (value) => {
      if (!value) return { valid: true };
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 999.99) {
        return { valid: false, message: 'Largura deve ser um número entre 0 e 999.99' };
      }
      return { valid: true };
    }
  },
  {
    key: 'height',
    header: 'Altura (cm)',
    required: false,
    validator: (value) => {
      if (!value) return { valid: true };
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 999.99) {
        return { valid: false, message: 'Altura deve ser um número entre 0 e 999.99' };
      }
      return { valid: true };
    }
  }
];

/**
 * Lê arquivo Excel e retorna dados brutos
 */
export const readExcelFile = (file: File): Promise<unknown[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Pega a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converte para array de arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as unknown[][];

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Mapeia cabeçalhos do Excel para campos do sistema
 */
export const mapHeaders = (headers: string[]): Record<string, number> => {
  const headerMap: Record<string, number> = {};

  IMPORT_COLUMNS.forEach(col => {
    const headerIndex = headers.findIndex(h =>
      h && h.toLowerCase().trim() === col.header.toLowerCase().trim()
    );

    if (headerIndex !== -1) {
      headerMap[col.key] = headerIndex;
    }
  });

  return headerMap;
};

/**
 * Converte valor para string, tratando valores nulos/vazios
 */
const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).trim();
};

/**
 * Converte status para formato padronizado
 */
const normalizeStatus = (status: string): 'active' | 'inactive' => {
  const normalized = status.toLowerCase().trim();
  return ['ativo', 'active'].includes(normalized) ? 'active' : 'inactive';
};

/**
 * Valida e converte uma linha de dados
 */
export const parseProductRow = (
  row: unknown[],
  headerMap: Record<string, number>,
  rowIndex: number
): ParsedProduct => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Inicializa produto com valores padrão, permitindo propriedades adicionais
  const product: Partial<ProductImportData> & { [key: string]: unknown } = {};

  // Processa cada coluna
  IMPORT_COLUMNS.forEach(col => {
    const columnIndex = headerMap[col.key];
    const rawValue = columnIndex !== undefined ? row[columnIndex] : '';
    const value = normalizeValue(rawValue);

    // Verifica campos obrigatórios
    if (col.required && !value) {
      errors.push(`${col.header} é obrigatório`);
      return;
    }

    // Aplica validador específico se existir
    if (value && col.validator) {
      const validation = col.validator(value);
      if (!validation.valid) {
        errors.push(`${col.header}: ${validation.message}`);
        return;
      }
    }

    // Converte e atribui valor
    switch (col.key) {
      case 'cost':
      case 'wholesale_price':
      case 'retail_price':
        product[col.key] = value ? Number(value) : 0;
        break;
      case 'weight':
      case 'length':
      case 'width':
      case 'height':
        // Store shipping dimensions in shipping_data object
        if (!product.shipping_data) {
          product.shipping_data = { weight: 0, length: 0, width: 0, height: 0 };
        }
        product.shipping_data[col.key] = value ? Number(value) : 0;
        break;
      case 'stock':
      case 'min_stock':
        product[col.key] = value ? parseInt(value) : 0;
        break;
      case 'status':
        product[col.key] = normalizeStatus(value);
        break;
      case 'barcode':
        if (value) {
          const barcodeValidation = validateBarcode(value);
          if (!barcodeValidation.valid) {
            errors.push(`Código de barras: ${barcodeValidation.message}`);
          } else {
            product[col.key] = value;
          }
        } else {
          product[col.key] = '';
        }
        break;
      default:
        // Assign to additional properties allowed by index signature
        product[col.key] = value;
    }
  });

  // Validações de negócio
  if (product.cost && product.wholesale_price && product.cost > product.wholesale_price) {
    warnings.push('Custo é maior que preço atacado');
  }

  if (product.wholesale_price && product.retail_price && product.wholesale_price > product.retail_price) {
    errors.push('Preço atacado não pode ser maior que preço varejo');
  }

  if (product.stock && product.min_stock && product.stock < product.min_stock) {
    warnings.push('Estoque atual é menor que estoque mínimo');
  }

  return {
    ...product as ProductImportData,
    rowIndex,
    errors,
    warnings,
    isValid: errors.length === 0
  };
};

/**
 * Verifica duplicatas dentro do próprio arquivo
 */
export const checkInternalDuplicates = (products: ParsedProduct[]): {
  duplicateSkus: string[];
  duplicateBarcodes: string[];
} => {
  const skuMap = new Map<string, number[]>();
  const barcodeMap = new Map<string, number[]>();

  products.forEach((product, index) => {
    // SKU duplicado
    if (product.sku) {
      const existing = skuMap.get(product.sku) || [];
      existing.push(index);
      skuMap.set(product.sku, existing);
    }

    // Barcode duplicado (apenas se preenchido)
    if (product.barcode) {
      const existing = barcodeMap.get(product.barcode) || [];
      existing.push(index);
      barcodeMap.set(product.barcode, existing);
    }
  });

  const duplicateSkus: string[] = [];
  const duplicateBarcodes: string[] = [];

  // Marca produtos com SKU duplicado
  skuMap.forEach((indices, sku) => {
    if (indices.length > 1) {
      duplicateSkus.push(sku);
      indices.forEach(index => {
        products[index].errors.push(`SKU "${sku}" duplicado no arquivo (linhas ${indices.map(i => i + 2).join(', ')})`);
        products[index].isValid = false;
      });
    }
  });

  // Marca produtos com barcode duplicado
  barcodeMap.forEach((indices, barcode) => {
    if (indices.length > 1) {
      duplicateBarcodes.push(barcode);
      indices.forEach(index => {
        products[index].errors.push(`Código de barras "${barcode}" duplicado no arquivo (linhas ${indices.map(i => i + 2).join(', ')})`);
        products[index].isValid = false;
      });
    }
  });

  return { duplicateSkus, duplicateBarcodes };
};

/**
 * Verifica conflitos com banco de dados
 */
export const checkDatabaseConflicts = (
  products: ParsedProduct[],
  options: ImportValidationOptions
): void => {
  products.forEach(product => {
    // Verifica SKU existente
    if (product.sku && options.existingSkus.includes(product.sku)) {
      product.errors.push(`SKU "${product.sku}" já existe no sistema`);
      product.isValid = false;
    }

    // Verifica barcode existente (apenas se preenchido)
    if (product.barcode && options.existingBarcodes.includes(product.barcode)) {
      product.errors.push(`Código de barras "${product.barcode}" já existe no sistema`);
      product.isValid = false;
    }
  });
};

/**
 * Processa arquivo Excel e retorna resultado da importação
 */
export const processExcelImport = async (
  file: File,
  validationOptions: ImportValidationOptions
): Promise<ImportResult> => {
  try {
    // Lê dados do Excel
    const rawData = await readExcelFile(file);

    if (rawData.length < 2) {
      throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
    }

    // Mapeia cabeçalhos
    const headers = rawData[0] as string[];
    const headerMap = mapHeaders(headers);

    // Verifica se campos obrigatórios estão presentes
    const missingHeaders = IMPORT_COLUMNS
      .filter(col => col.required && !(col.key in headerMap))
      .map(col => col.header);

    if (missingHeaders.length > 0) {
      throw new Error(`Colunas obrigatórias não encontradas: ${missingHeaders.join(', ')}`);
    }

    // Processa linhas de dados
    const dataRows = rawData.slice(1);
    const products: ParsedProduct[] = [];

    dataRows.forEach((row, index) => {
      // Ignora linhas completamente vazias
      const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');

      if (hasData) {
        const product = parseProductRow(row, headerMap, index + 2); // +2 porque linha 1 é cabeçalho
        products.push(product);
      }
    });

    if (products.length === 0) {
      throw new Error('Nenhum produto válido encontrado no arquivo');
    }

    // Verifica duplicatas internas
    const { duplicateSkus, duplicateBarcodes } = checkInternalDuplicates(products);

    // Verifica conflitos com banco
    checkDatabaseConflicts(products, validationOptions);

    // Calcula estatísticas
    const validProducts = products.filter(p => p.isValid).length;
    const invalidProducts = products.length - validProducts;

    return {
      products,
      totalRows: products.length,
      validProducts,
      invalidProducts,
      duplicateSkus,
      duplicateBarcodes
    };

  } catch (error) {
    throw new Error(`Erro ao processar arquivo: ${(error as Error).message}`);
  }
};

/**
 * Gera template de importação
 */
export const generateImportTemplate = (): ArrayBuffer => {
  const templateData = [
    // Cabeçalhos
    IMPORT_COLUMNS.map(col => col.header),
    // Linha de exemplo
    [
      'Perfume Masculino Exemplo',
      'Perfume com fragrância amadeirada',
      'HP Marcas',
      'Perfumes Masculinos',
      'PERF-001',
      '7891234567890',
      '45.50',
      '85.00',
      '120.00',
      '10',
      '3',
      'Ativo',
      ''
    ]
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Configura larguras das colunas
  const colWidths = IMPORT_COLUMNS.map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produtos');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

/**
 * Download do template
 */
export const downloadImportTemplate = (): void => {
  const buffer = generateImportTemplate();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template_importacao_produtos.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
