import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detecção dinâmica de IP para funcionar em Emuladores (Android/iOS) e dispositivos físicos via Expo Go
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();
console.log('[API] Conectando na URL base:', API_BASE_URL);

// Mapeamentos de chaves do Frontend para o Banco de Dados (Backend)
export const SUBSTRATO_MAP: Record<string, string> = {
  suino: 'Suíno - total',
  bovino: 'Bovino',
  caprino: 'Caprino',
  ovino: 'Ovino',
  equino: 'Equino',
  galinaceo: 'Galináceos - total',
};

export const SUBSTRATO_LABEL_MAP: Record<string, string> = {
  'Suíno': 'Suíno - total',
  'Bovino': 'Bovino',
  'Caprino': 'Caprino',
  'Ovino': 'Ovino',
  'Equino': 'Equino',
  'Galináceo': 'Galináceos - total',
};

export const REGION_NAME_MAP: Record<string, string> = {
  mata: 'Mata Paraibana',
  agreste: 'Agreste Paraibano',
  borborema: 'Borborema',
  sertao: 'Sertão Paraibano',
};

export const REVERSE_REGION_NAME_MAP: Record<string, string> = {
  'Mata Paraibana': 'mata',
  'Agreste Paraibano': 'agreste',
  'Borborema': 'borborema',
  'Sertão Paraibano': 'sertao',
};

// Interfaces para os tipos de dados do Backend
export interface RebanhoMesorregiaoItem {
  ano: number;
  mesorregiao: string;
  substrato: string;
  quantidade: number;
}

export interface SerieItem {
  ano: number;
  quantidade: number;
}

export interface SerieMesorregiaoResponse {
  mesorregiao: string;
  substrato: string | null;
  dados: SerieItem[];
}

export interface TotalMunicipioItem {
  codigo_ibge: number;
  municipio: string;
  mesorregiao: string;
  total: number;
}

export interface TotaisMunicipioResponse {
  ano: number;
  substrato: string | null;
  dados: TotalMunicipioItem[];
}

export interface EnergiaMunicipioItem {
  municipio: string;
  mesorregiao: string;
  codigo_ibge: number;
  ano: number;
  substrato: string;
  cabecas: number;
  massa_anual_kg: number;
  pcs_kj_kg: number;
  potencial_tj: number;
}

export interface EnergiaMunicipioResponse {
  codigo_ibge: number;
  ano: number;
  resultados: EnergiaMunicipioItem[];
}

export interface EnergiaMesorregiaoTotalItem {
  ano: number;
  mesorregiao: string;
  potencial_tj: number;
}

export interface EnergiaMesorregiaoSerieItem {
  ano: number;
  potencial_tj: number;
}

export interface EnergiaMesorregiaoSerieResponse {
  mesorregiao: string;
  substrato: string | null;
  dados: EnergiaMesorregiaoSerieItem[];
}

export interface EnergiaMunicipioSerieResponse {
  codigo_ibge: number;
  municipio: string;
  substrato: string | null;
  dados: EnergiaMesorregiaoSerieItem[];
}


export interface EnergiaMesorregiaoResponse {
  mesorregiao: string;
  ano: number;
  potencial_tj: number;
  detalhes: EnergiaMunicipioItem[] | null;
}

// Funções auxiliares para requisições fetch
const fetchFromApi = async <T>(path: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na API HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`[API] Erro ao buscar dados de ${path}:`, error);
    throw error;
  }
};

// Funções da API
export const api = {
  // Obter potenciais energéticos totais por mesorregião para o mapa
  getEnergiaMesorregioesTotais: (ano: number): Promise<EnergiaMesorregiaoTotalItem[]> => {
    return fetchFromApi<EnergiaMesorregiaoTotalItem[]>(`/energia/mesorregiao/totais?ano=${ano}`);
  },

  // Obter potencial de uma mesorregião específica (com ou sem substrato)
  getEnergiaMesorregiao: (
    nome: string,
    ano: number,
    substrato?: string
  ): Promise<EnergiaMesorregiaoResponse> => {
    const substratoParam = substrato ? `&substrato=${encodeURIComponent(substrato)}` : '';
    return fetchFromApi<EnergiaMesorregiaoResponse>(
      `/energia/mesorregiao/${encodeURIComponent(nome)}?ano=${ano}${substratoParam}`
    );
  },

  // Obter a lista de todos os municípios da Paraíba para o ano
  getMunicipiosTotais: (ano: number, substrato?: string): Promise<TotaisMunicipioResponse> => {
    const substratoParam = substrato ? `&substrato=${encodeURIComponent(substrato)}` : '';
    return fetchFromApi<TotaisMunicipioResponse>(`/municipio/totais?ano=${ano}${substratoParam}`);
  },

  // Obter energia detalhada de um município
  getEnergiaMunicipio: (codigoIbge: number, ano: number): Promise<EnergiaMunicipioResponse> => {
    return fetchFromApi<EnergiaMunicipioResponse>(`/energia/municipio/${codigoIbge}?ano=${ano}`);
  },

  // Obter série histórica de rebanho de uma mesorregião
  getMesorregiaoSerie: (nome: string, substrato?: string): Promise<SerieMesorregiaoResponse> => {
    const substratoParam = substrato ? `?substrato=${encodeURIComponent(substrato)}` : '';
    return fetchFromApi<SerieMesorregiaoResponse>(
      `/mesorregiao/${encodeURIComponent(nome)}/serie${substratoParam}`
    );
  },

  // Obter série histórica de POTENCIAL ENERGÉTICO de uma mesorregião (1 chamada = todos os anos)
  getEnergiaMesorregioSerie: (
    nome: string,
    substrato?: string
  ): Promise<EnergiaMesorregiaoSerieResponse> => {
    const substratoParam = substrato ? `?substrato=${encodeURIComponent(substrato)}` : '';
    return fetchFromApi<EnergiaMesorregiaoSerieResponse>(
      `/energia/mesorregiao/${encodeURIComponent(nome)}/serie${substratoParam}`
    );
  },

  // Obter série histórica de POTENCIAL ENERGÉTICO de um município (1 chamada = todos os anos)
  getEnergiaMunicipioSerie: (
    codigoIbge: number,
    substrato?: string
  ): Promise<EnergiaMunicipioSerieResponse> => {
    const substratoParam = substrato ? `?substrato=${encodeURIComponent(substrato)}` : '';
    return fetchFromApi<EnergiaMunicipioSerieResponse>(
      `/energia/municipio/${codigoIbge}/serie${substratoParam}`
    );
  },


};
