/**
 * Testes para os mapeamentos e utilitários do serviço de API.
 * Garante que as chaves do frontend batem com as esperadas pelo backend.
 */
import {
  SUBSTRATO_MAP,
  SUBSTRATO_LABEL_MAP,
  REGION_NAME_MAP,
  REVERSE_REGION_NAME_MAP,
} from '../../src/services/api';

describe('SUBSTRATO_MAP — mapeamento frontend → banco de dados', () => {
  it('mapeia suino corretamente', () => {
    expect(SUBSTRATO_MAP['suino']).toBe('Suíno - total');
  });

  it('mapeia bovino corretamente', () => {
    expect(SUBSTRATO_MAP['bovino']).toBe('Bovino');
  });

  it('mapeia caprino corretamente', () => {
    expect(SUBSTRATO_MAP['caprino']).toBe('Caprino');
  });

  it('mapeia ovino corretamente', () => {
    expect(SUBSTRATO_MAP['ovino']).toBe('Ovino');
  });

  it('mapeia equino corretamente', () => {
    expect(SUBSTRATO_MAP['equino']).toBe('Equino');
  });

  it('mapeia galinaceo corretamente', () => {
    expect(SUBSTRATO_MAP['galinaceo']).toBe('Galináceos - total');
  });

  it('tem exatamente 6 substratos mapeados', () => {
    expect(Object.keys(SUBSTRATO_MAP)).toHaveLength(6);
  });
});

describe('REGION_NAME_MAP — chave curta → nome completo', () => {
  it('mapeia mata → Mata Paraibana', () => {
    expect(REGION_NAME_MAP['mata']).toBe('Mata Paraibana');
  });

  it('mapeia agreste → Agreste Paraibano', () => {
    expect(REGION_NAME_MAP['agreste']).toBe('Agreste Paraibano');
  });

  it('mapeia borborema → Borborema', () => {
    expect(REGION_NAME_MAP['borborema']).toBe('Borborema');
  });

  it('mapeia sertao → Sertão Paraibano', () => {
    expect(REGION_NAME_MAP['sertao']).toBe('Sertão Paraibano');
  });

  it('tem exatamente 4 mesorregiões', () => {
    expect(Object.keys(REGION_NAME_MAP)).toHaveLength(4);
  });
});

describe('REVERSE_REGION_NAME_MAP — nome completo → chave curta (inverso)', () => {
  it('é o inverso exato de REGION_NAME_MAP', () => {
    Object.entries(REGION_NAME_MAP).forEach(([chave, nomeCompleto]) => {
      expect(REVERSE_REGION_NAME_MAP[nomeCompleto]).toBe(chave);
    });
  });
});

describe('SUBSTRATO_LABEL_MAP — label display → valor do banco', () => {
  it('mapeia Bovino display para valor do banco', () => {
    expect(SUBSTRATO_LABEL_MAP['Bovino']).toBe('Bovino');
  });

  it('mapeia Suíno display para valor do banco', () => {
    expect(SUBSTRATO_LABEL_MAP['Suíno']).toBe('Suíno - total');
  });

  it('mapeia Galináceo display para valor do banco', () => {
    expect(SUBSTRATO_LABEL_MAP['Galináceo']).toBe('Galináceos - total');
  });
});
