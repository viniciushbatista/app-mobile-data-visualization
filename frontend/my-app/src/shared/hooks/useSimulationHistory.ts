import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export interface SimulationRecord {
  id: string;
  dataSalva: string; // ISO string
  substrato: string;
  localizacao: string; // nome da mesorregião ou município
  tipoLocalizacao: 'mesorregiao' | 'municipio';
  anoAlvo: string;
  resultadoTJ: number;
  // Parâmetros originais para "Simular novamente"
  quantidade: string;
  regiao: string;
  codigoIbge?: string;
  municipioNome?: string;
}

const STORAGE_KEY = '@bienergia_history';

export function useSimulationHistory() {
  const [history, setHistory] = useState<SimulationRecord[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        setHistory(JSON.parse(json) as SimulationRecord[]);
      }
    } catch (e) {
      console.error('[useSimulationHistory] Erro ao carregar histórico:', e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveSimulation = useCallback(async (record: Omit<SimulationRecord, 'id' | 'dataSalva'>) => {
    try {
      const newRecord: SimulationRecord = {
        ...record,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dataSalva: new Date().toISOString(),
      };
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const current: SimulationRecord[] = json ? JSON.parse(json) : [];
      // Mantém os 20 registros mais recentes
      const updated = [newRecord, ...current].slice(0, 20);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch (e) {
      console.error('[useSimulationHistory] Erro ao salvar:', e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (e) {
      console.error('[useSimulationHistory] Erro ao limpar:', e);
    }
  }, []);

  return { history, saveSimulation, clearHistory, reload: loadHistory };
}
