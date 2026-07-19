/**
 * Testes para o hook useSimulationHistory.
 * Verifica salvar, deletar, limpar e limitar a 20 registros.
 */
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSimulationHistory } from '../../src/shared/hooks/useSimulationHistory';
import type { SimulationRecord } from '../../src/shared/hooks/useSimulationHistory';

// Helper para criar um registro de simulação de teste
const criarRegistro = (overrides = {}): Omit<SimulationRecord, 'id' | 'dataSalva'> => ({
  substrato: 'Bovino',
  localizacao: 'Sertão Paraibano',
  tipoLocalizacao: 'mesorregiao',
  anoAlvo: '2030',
  resultadoTJ: 150.32,
  quantidade: '10',
  regiao: 'sertao',
  ...overrides,
});

beforeEach(async () => {
  // Limpa o storage antes de cada teste para garantir isolamento
  await AsyncStorage.clear();
});

describe('useSimulationHistory', () => {
  it('inicia com histórico vazio', async () => {
    const { result } = await renderHook(() => useSimulationHistory());
    expect(result.current.history).toHaveLength(0);
  });

  it('salva um registro e ele aparece no histórico', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(criarRegistro());
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].substrato).toBe('Bovino');
    expect(result.current.history[0].resultadoTJ).toBe(150.32);
  });

  it('gera id e dataSalva automaticamente ao salvar', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(criarRegistro());
    });

    const registro = result.current.history[0];
    expect(registro.id).toBeTruthy();
    expect(registro.dataSalva).toBeTruthy();
    expect(new Date(registro.dataSalva).toString()).not.toBe('Invalid Date');
  });

  it('o registro mais recente aparece primeiro (ordem decrescente)', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(criarRegistro({ resultadoTJ: 100 }));
    });
    await act(async () => {
      await result.current.saveSimulation(criarRegistro({ resultadoTJ: 200 }));
    });

    expect(result.current.history[0].resultadoTJ).toBe(200);
    expect(result.current.history[1].resultadoTJ).toBe(100);
  });

  it('deleta um registro específico pelo id', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(criarRegistro({ substrato: 'Bovino' }));
      await result.current.saveSimulation(criarRegistro({ substrato: 'Ovino' }));
    });

    const idParaDeletar = result.current.history[1].id; // Bovino (mais antigo)

    await act(async () => {
      await result.current.deleteSimulation(idParaDeletar);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].substrato).toBe('Ovino');
  });

  it('limpa todo o histórico', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(criarRegistro());
      await result.current.saveSimulation(criarRegistro());
    });

    expect(result.current.history).toHaveLength(2);

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('limita o histórico a 20 registros (descarta os mais antigos)', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    // Salva 22 registros
    await act(async () => {
      for (let i = 1; i <= 22; i++) {
        await result.current.saveSimulation(criarRegistro({ resultadoTJ: i }));
      }
    });

    expect(result.current.history).toHaveLength(20);
    // O mais recente (22) deve estar primeiro
    expect(result.current.history[0].resultadoTJ).toBe(22);
    // O mais antigo que ficou deve ser o 3 (1 e 2 foram descartados)
    expect(result.current.history[19].resultadoTJ).toBe(3);
  });

  it('salva registro com municipio (tipo municipio)', async () => {
    const { result } = await renderHook(() => useSimulationHistory());

    await act(async () => {
      await result.current.saveSimulation(
        criarRegistro({
          tipoLocalizacao: 'municipio',
          localizacao: 'Campina Grande',
          codigoIbge: '2504009',
          municipioNome: 'Campina Grande',
        })
      );
    });

    const registro = result.current.history[0];
    expect(registro.tipoLocalizacao).toBe('municipio');
    expect(registro.codigoIbge).toBe('2504009');
    expect(registro.municipioNome).toBe('Campina Grande');
  });
});
