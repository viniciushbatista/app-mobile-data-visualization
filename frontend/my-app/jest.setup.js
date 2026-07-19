// Mock global do AsyncStorage (necessário para testar hooks que usam storage)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock do expo-constants para evitar erro de hostUri em testes
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: null,
    extra: {
      apiUrl: 'http://localhost:8000',
    },
  },
}));

// Mock do expo-router para evitar erros de navegação em testes de componentes
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));
