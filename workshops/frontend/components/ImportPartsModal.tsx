'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { partsApi, CreatePartDto } from '@/lib/api/parts';

interface ImportPartsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

interface ParsedPart {
  row: number;
  data: CreatePartDto;
  errors: string[];
}

export function ImportPartsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportPartsModalProps) {
  const [parsedParts, setParsedParts] = useState<ParsedPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails: Array<{
      row: number;
      partNumber?: string;
      name?: string;
      error: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função auxiliar para decodificar arquivo com fallback de encoding
  const decodeFileWithFallback = async (
    arrayBuffer: ArrayBuffer,
    originalError: unknown,
  ): Promise<string> => {
    // Tentar diferentes encodings
    const decoders = [
      () => new TextDecoder('utf-8').decode(arrayBuffer),
      () => new TextDecoder('windows-1252').decode(arrayBuffer),
      () => new TextDecoder('iso-8859-1').decode(arrayBuffer),
    ];
    
    for (const decoder of decoders) {
      try {
        return decoder();
      } catch (decodeError: unknown) {
        // Ignorar erro de decoder e tentar próximo
        console.warn('Erro ao decodificar com encoding:', decodeError);
        continue;
      }
    }
    
    // Se ainda não conseguiu, usar UTF-8 como fallback
    // Se falhar, relançar o erro original
    try {
      return new TextDecoder('utf-8').decode(arrayBuffer);
    } catch {
      const errorMessage = originalError instanceof Error ? originalError.message : 'Erro desconhecido';
      throw new Error(`Erro ao decodificar arquivo: ${errorMessage}`);
    }
  };

  // Função auxiliar para normalizar encoding
  const normalizeEncoding = (text: string): string => {
    // Normalizar caracteres especiais comuns (encoding incorreto)
    // Usar replaceAll com strings (não regex) para melhor performance
    return text
      // Minúsculas
      .replaceAll('Ã¡', 'á')
      .replaceAll('Ã©', 'é')
      .replaceAll('Ã­', 'í')
      .replaceAll('Ã³', 'ó')
      .replaceAll('Ãº', 'ú')
      .replaceAll('Ã£', 'ã')
      .replaceAll('Ãµ', 'õ')
      .replaceAll('Ã§', 'ç')
      // Maiúsculas
      .replaceAll('Ã€', 'À')
      .replaceAll('Ã‰', 'É')
      .replaceAll('Ã', 'Í')
      .replaceAll('Ã"', 'Ó')
      .replaceAll('Ãš', 'Ú')
      .replaceAll('Ãƒ', 'Ã')
      .replaceAll('Ã•', 'Õ')
      .replaceAll('Ã‡', 'Ç')
      // Casos especiais do Excel
      .replaceAll('Å"leo', 'Óleo')
      .replaceAll('A"leo', 'Óleo')
      .replaceAll('Ã"leo', 'Óleo')
      .replaceAll('Ã³leo', 'óleo')
      .replaceAll('sintÃ©tico', 'sintético')
      .replaceAll('igniÃ§Ã£o', 'ignição')
      .replaceAll('IgniÃ§Ã£o', 'Ignição');
  };

  // Função auxiliar para parsear linha CSV considerando aspas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let idx = 0; idx < line.length; idx++) {
      const char = line[idx];
      const nextChar = line[idx + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Aspas duplas dentro de aspas (escape)
          current += '"';
          // Pular próximo caractere (necessário para pular aspas duplas)
          // eslint-disable-next-line sonarjs/no-increment-decrement, @typescript-eslint/no-unused-expressions
          idx += 1; // NOSONAR
        } else {
          // Toggle aspas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Separador de campo
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Adicionar ultimo campo
    result.push(current.trim());
    return result;
  };

  // Função auxiliar para validar peça
  const validatePart = (part: Partial<CreatePartDto>, errors: string[]): void => {
    if (!part.name || part.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    part.quantity ??= 0;
    part.minQuantity ??= 0;
    part.isActive ??= true;

    if (part.costPrice === undefined) {
      errors.push('Preço de custo é obrigatório');
    }

    if (part.sellPrice === undefined) {
      errors.push('Preço de venda é obrigatório');
    }
  };

  // Função auxiliar para mapear valor para campo
  const mapValueToField = (
    value: string,
    mappedField: string,
    part: Partial<CreatePartDto>,
    errors: string[],
  ): void => {
    switch (mappedField) {
      case 'partNumber':
      case 'name':
      case 'description':
      case 'category':
      case 'brand':
      case 'supplierId':
      case 'location':
        part[mappedField] = value;
        break;
      case 'quantity':
      case 'minQuantity': {
        const qty = Number.parseInt(value, 10);
        if (Number.isNaN(qty) || qty < 0) {
          errors.push(`${mappedField} deve ser um número inteiro >= 0`);
        } else {
          part[mappedField] = qty;
        }
        break;
      }
      case 'costPrice':
      case 'sellPrice': {
        // Remover caracteres não numéricos e substituir vírgula por ponto
        // eslint-disable-next-line @typescript-eslint/prefer-string-replace-all
        const cleanedValue = value.replace(/[^\d,.-]/g, '').replaceAll(',', '.');
        const price = Number.parseFloat(cleanedValue);
        if (Number.isNaN(price) || price < 0) {
          errors.push(`${mappedField} deve ser um número >= 0`);
        } else {
          part[mappedField] = price;
        }
        break;
      }
      case 'isActive':
        part[mappedField] = value.toLowerCase() === 'true' || value.toLowerCase() === 'sim' || value === '1';
        break;
    }
  };

  // Mapear colunas esperadas (suporta variações de encoding)
  const columnMap: Record<string, string> = {
      'codigo': 'partNumber',
      'código': 'partNumber',
      'cÃ³digo': 'partNumber', // Encoding incorreto comum
      'partnumber': 'partNumber',
      'part_number': 'partNumber',
      'nome': 'name',
      'name': 'name',
      'descricao': 'description',
      'descrição': 'description',
      'descriÃ§Ã£o': 'description', // Encoding incorreto comum
      'description': 'description',
      'categoria': 'category',
      'category': 'category',
      'marca': 'brand',
      'brand': 'brand',
      'fornecedor': 'supplierId',
      'supplierid': 'supplierId',
      'supplier_id': 'supplierId',
      'quantidade': 'quantity',
      'quantity': 'quantity',
      'qtd': 'quantity',
      'quantidade_minima': 'minQuantity',
      'quantidade mínima': 'minQuantity',
      'quantidade mÃ-nima': 'minQuantity', // Encoding incorreto comum
      'minquantity': 'minQuantity',
      'min_quantity': 'minQuantity',
      'preco_custo': 'costPrice',
      'preço custo': 'costPrice',
      'preço de custo': 'costPrice',
      'preÃ§o custo': 'costPrice', // Encoding incorreto comum
      'costprice': 'costPrice',
      'cost_price': 'costPrice',
      'preco_venda': 'sellPrice',
      'preço venda': 'sellPrice',
      'preço de venda': 'sellPrice',
      'preÃ§o venda': 'sellPrice', // Encoding incorreto comum
      'sellprice': 'sellPrice',
      'sell_price': 'sellPrice',
      'localizacao': 'location',
      'localização': 'location',
      'localizaÃ§Ã£o': 'location', // Encoding incorreto comum
      'location': 'location',
      'ativo': 'isActive',
      'isactive': 'isActive',
      'is_active': 'isActive',
    };

  const parseCSV = (csvText: string): ParsedPart[] => {
    // Normalizar quebras de linha (regex necessário para múltiplas ocorrências)
    // eslint-disable-next-line @typescript-eslint/prefer-string-replace-all
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter((line) => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error('Arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
    }

    // Parse header (regex necessário para múltiplas ocorrências - replaceAll não funciona com regex)
    // eslint-disable-next-line @typescript-eslint/prefer-string-replace-all
    const header = parseCSVLine(lines[0])
      .map((h) => h.trim().replace(/(^"|"$)/g, '').toLowerCase()); // NOSONAR - replace necessário pois replaceAll não suporta regex
    
    const parsed: ParsedPart[] = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
      const line = lines[rowIndex];
      // eslint-disable-next-line @typescript-eslint/prefer-string-replace-all
      const values = parseCSVLine(line).map((v) => v.trim().replace(/(^"|"$)/g, ''));
      
      const part: Partial<CreatePartDto> = {};
      const errors: string[] = [];

      // Mapear valores para campos
      header.forEach((colName, index) => {
        const mappedField = columnMap[colName];
        if (mappedField && values[index] !== undefined && values[index] !== '') {
          const value = values[index];
          mapValueToField(value, mappedField, part, errors);
        }
      });

      // Validações obrigatórias
      validatePart(part, errors);

      parsed.push({
        row: rowIndex + 1,
        data: part as CreatePartDto,
        errors,
      });
    }

    return parsed;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      alert('Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)');
      return;
    }

    setParsedParts([]);
    setImportResult(null);

    try {
      setLoading(true);
      
      if (isExcel) {
        alert('Importação de arquivos Excel será implementada em breve. Por enquanto, exporte o arquivo como CSV e tente novamente.');
        setParsedParts([]);
        setImportResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Ler arquivo CSV com diferentes encodings
      let text = '';
      try {
        // Tentar UTF-8 primeiro
        text = await selectedFile.text();
      } catch (error: unknown) {
        // Se falhar, tentar ler como ArrayBuffer e converter
        const arrayBuffer = await selectedFile.arrayBuffer();
        text = await decodeFileWithFallback(arrayBuffer, error);
      }

      // Normalizar encoding e parsear CSV
      const normalizedText = normalizeEncoding(text);
      const parsed = parseCSV(normalizedText);
      setParsedParts(parsed);
    } catch (error: unknown) {
      console.error('Erro ao processar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao processar arquivo: ${errorMessage}`);
      setParsedParts([]);
      setImportResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedParts.length === 0) {
      alert('Nenhuma peça válida para importar');
      return;
    }

    // Filtrar apenas peças sem erros
    const validParts = parsedParts
      .filter((p) => p.errors.length === 0)
      .map((p) => p.data);

    if (validParts.length === 0) {
      alert('Nenhuma peça válida para importar. Corrija os erros antes de continuar.');
      return;
    }

    try {
      setImporting(true);
      const result = await partsApi.import(validParts);
      setImportResult(result);
      
      if (result.errors === 0) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao importar peças:', error);
      alert(`Erro ao importar peças: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsedParts([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const validPartsCount = parsedParts.filter((p) => p.errors.length === 0).length;
  const invalidPartsCount = parsedParts.length - validPartsCount;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Peças via Planilha">
      <div className="space-y-6">
        {/* Upload */}
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-[#D0D6DE] mb-2">
            Selecione o arquivo CSV
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="block w-full text-sm text-[#7E8691] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00E0B8] file:text-[#0F1115] hover:file:bg-[#3ABFF8] file:cursor-pointer cursor-pointer"
          />
          <p className="mt-2 text-xs text-[#7E8691]">
            Formatos aceitos: CSV, Excel (.xlsx, .xls)
          </p>
          <p className="mt-1 text-xs text-[#7E8691]">
            Colunas esperadas: Código, Nome, Descrição, Categoria, Marca, Quantidade, Quantidade Mínima, Preço Custo, Preço Venda, Localização, Ativo
          </p>
          <p className="mt-1 text-xs text-[#FFA500]">
            ⚠️ Se o arquivo tiver problemas de acentuação, salve como CSV com codificação UTF-8 no Excel
          </p>
          <div className="mt-2 space-y-1">
            <a
              href="/template-parts.csv"
              download
              className="inline-block text-xs text-[#00E0B8] hover:text-[#3ABFF8] underline mr-4"
            >
              📥 Baixar template CSV
            </a>
            <a
              href="/template-parts-utf8.csv"
              download
              className="inline-block text-xs text-[#00E0B8] hover:text-[#3ABFF8] underline"
            >
              📥 Baixar template CSV (UTF-8)
            </a>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-2 text-sm text-[#7E8691]">Processando arquivo...</p>
          </div>
        )}

        {/* Preview */}
        {parsedParts.length > 0 && !importResult && (
          <div>
            <div className="mb-4 p-3 bg-[#0F1115] border border-[#2A3038] rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#D0D6DE]">
                  Total de linhas: <strong>{parsedParts.length}</strong>
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-[#00E0B8]">
                    Válidas: <strong>{validPartsCount}</strong>
                  </span>
                  {invalidPartsCount > 0 && (
                    <span className="text-[#FF4E3D]">
                      Com erros: <strong>{invalidPartsCount}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-[#2A3038] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#2A3038] sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-[#D0D6DE]">Linha</th>
                    <th className="px-4 py-2 text-left text-[#D0D6DE]">Código</th>
                    <th className="px-4 py-2 text-left text-[#D0D6DE]">Nome</th>
                    <th className="px-4 py-2 text-left text-[#D0D6DE]">Quantidade</th>
                    <th className="px-4 py-2 text-left text-[#D0D6DE]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3038]">
                  {parsedParts.map((part) => (
                    <tr
                      key={part.row}
                      className={part.errors.length > 0 ? 'bg-[#FF4E3D]/10' : ''}
                    >
                      <td className="px-4 py-2 text-[#7E8691]">{part.row}</td>
                      <td className="px-4 py-2 text-[#D0D6DE]">
                        {part.data.partNumber || '-'}
                      </td>
                      <td className="px-4 py-2 text-[#D0D6DE]">{part.data.name}</td>
                      <td className="px-4 py-2 text-[#D0D6DE]">{part.data.quantity || 0}</td>
                      <td className="px-4 py-2">
                        {part.errors.length > 0 ? (
                          <div className="text-xs text-[#FF4E3D]">
                            {part.errors.join(', ')}
                          </div>
                        ) : (
                          <span className="text-xs text-[#00E0B8]">✓ Válido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {importResult && (
          <div className="p-4 bg-[#0F1115] border border-[#2A3038] rounded-lg">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Resultado da Importação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#7E8691]">Total processado:</span>
                <span className="text-[#D0D6DE] font-semibold">{importResult.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7E8691]">Criadas:</span>
                <span className="text-[#00E0B8] font-semibold">{importResult.created}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7E8691]">Atualizadas:</span>
                <span className="text-[#3ABFF8] font-semibold">{importResult.updated}</span>
              </div>
              {importResult.errors > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[#7E8691]">Erros:</span>
                  <span className="text-[#FF4E3D] font-semibold">{importResult.errors}</span>
                </div>
              )}
            </div>

            {importResult.errorDetails.length > 0 && (
              <div className="mt-4 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-semibold text-[#FF4E3D] mb-2">Detalhes dos Erros:</h4>
                <div className="space-y-1 text-xs">
                  {importResult.errorDetails.map((error) => (
                    <div key={`error-${error.row}-${error.partNumber || error.name || 'unknown'}`} className="text-[#FF4E3D]">
                      Linha {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#2A3038]">
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            {importResult ? 'Fechar' : 'Cancelar'}
          </Button>
          {parsedParts.length > 0 && importResult === null && (
            <Button
              variant="primary"
              onClick={handleImport}
              isLoading={importing}
              disabled={validPartsCount === 0}
            >
              Importar {validPartsCount} Peça{validPartsCount === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

