import { ApiProperty } from '@nestjs/swagger';
import { Veiculo as PrismaVeiculo } from '@prisma/client';

export class Veiculo implements PrismaVeiculo {
  @ApiProperty({ description: 'ID único do veículo' })
  id: string;

  @ApiProperty({ description: 'Placa do veículo (formato Mercosul ou antigo)' })
  placa: string | null;

  @ApiProperty({ description: 'Placa antiga (caso o veículo tenha sido emplacado no formato antigo)' })
  placaAntiga: string | null;

  @ApiProperty({ description: 'Número do RENAVAM' })
  renavam: string | null;

  @ApiProperty({ description: 'Número do chassi (VIN)' })
  chassi: string | null;

  @ApiProperty({ description: 'Marca do veículo' })
  marca: string;

  @ApiProperty({ description: 'Modelo do veículo' })
  modelo: string;

  @ApiProperty({ description: 'Ano de fabricação' })
  anoFabricacao: number;

  @ApiProperty({ description: 'Ano/modelo do veículo (ex: 2023/2024)' })
  anoModelo: string;

  @ApiProperty({ description: 'Cor do veículo' })
  cor: string;

  @ApiProperty({ description: 'Espécie do veículo (Automóvel, Caminhão, Moto, etc.)' })
  especie: string;

  @ApiProperty({ description: 'Categoria do veículo (Passeio, Passeio Misto, etc.)', required: false })
  categoria: string | null;

  @ApiProperty({ description: 'Tipo de carroceria (Sedan, Hatch, etc.)', required: false })
  carroceria: string | null;

  @ApiProperty({ description: 'Tipos de combustível', type: [String] })
  combustivel: string[];

  @ApiProperty({ description: 'Número de passageiros', required: false })
  numPassageiros: number | null;

  @ApiProperty({ description: 'Potência em CV', required: false })
  potencia: number | null;

  @ApiProperty({ description: 'Cilindradas em cm³', required: false })
  cilindradas: number | null;

  @ApiProperty({ description: 'Número de eixos (para caminhões e ônibus)', required: false })
  numEixos: number | null;

  @ApiProperty({ description: 'Capacidade de carga em kg', required: false })
  capCarga: number | null;

  @ApiProperty({ description: 'Procedência do veículo (Nacional ou Importado)' })
  procedencia: string;

  @ApiProperty({ description: 'Município de emplacamento', required: false })
  municipio: string | null;

  @ApiProperty({ description: 'UF de emplacamento', required: false })
  uf: string | null;

  @ApiProperty({ description: 'Situação atual do veículo (Ativo, Roubado, Leilão, etc.)' })
  situacao: string;

  @ApiProperty({ description: 'Score do veículo (0-1000)' })
  scoreBrasil: number;

  @ApiProperty({ description: 'Status no Detran' })
  statusDetran: string;

  @ApiProperty({ description: 'Status no SINESP (roubo/furto)', required: false })
  statusSinesp: string | null;

  @ApiProperty({ description: 'Data de criação do registro' })
  dataCriacao: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  dataAtualizacao: Date;
}
