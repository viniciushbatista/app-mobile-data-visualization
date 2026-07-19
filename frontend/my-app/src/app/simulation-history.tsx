import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSimulationHistory, SimulationRecord } from '../shared/hooks/useSimulationHistory';
import EmptyState from '../shared/components/EmptyState';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryCard({
  record,
  onSimulateAgain,
  onDelete,
}: {
  record: SimulationRecord;
  onSimulateAgain: (r: SimulationRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      {/* Barra lateral colorida */}
      <View style={styles.cardAccent} />

      <View style={styles.cardBody}>
        {/* Header do card */}
        <View style={styles.cardHeader}>
          <View style={styles.localizacaoBadge}>
            <MaterialIcons
              name={record.tipoLocalizacao === 'municipio' ? 'location-city' : 'map'}
              size={12}
              color="#16A34A"
            />
            <Text style={styles.localizacaoText}>{record.localizacao}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.dateText}>{formatDate(record.dataSalva)}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(record.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags de parâmetros */}
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🌿 {record.substrato}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>📅 {record.anoAlvo}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>📈 +{record.quantidade}%</Text>
          </View>
        </View>

        {/* Resultado */}
        <View style={styles.resultRow}>
          <View>
            <Text style={styles.resultLabel}>Potencial Energético</Text>
            <Text style={styles.resultValue}>
              {record.resultadoTJ.toFixed(2)}{' '}
              <Text style={styles.resultUnit}>TJ</Text>
            </Text>
          </View>

          {/* Botão simular novamente */}
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => onSimulateAgain(record)}
            activeOpacity={0.75}
          >
            <MaterialIcons name="replay" size={14} color="#16A34A" />
            <Text style={styles.replayText}>Repetir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SimulationHistory() {
  const router = useRouter();
  const { history, clearHistory, deleteSimulation } = useSimulationHistory();

  const handleClear = () => {
    Alert.alert(
      'Limpar histórico',
      'Deseja remover todas as simulações salvas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir simulação',
      'Deseja remover este registro do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteSimulation(id),
        },
      ]
    );
  };

  const handleSimulateAgain = (record: SimulationRecord) => {
    router.push({
      pathname: '/(tabs)/simulation',
      params: {
        prefill_substrato: record.substrato,
        prefill_quantidade: record.quantidade,
        prefill_ano: record.anoAlvo,
        prefill_regiao: record.regiao,
        prefill_codigoIbge: record.codigoIbge ?? '',
        prefill_municipioNome: record.municipioNome ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Histórico de Simulações</Text>
          <Text style={styles.headerSub}>
            {history.length} {history.length === 1 ? 'simulação salva' : 'simulações salvas'}
          </Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <EmptyState
          icon="history"
          title="Nenhuma simulação ainda"
          description="Execute uma simulação para que ela apareça aqui. Você poderá revisitá-la a qualquer momento."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {history.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              onSimulateAgain={handleSimulateAgain}
              onDelete={handleDelete}
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  clearBtn: {
    padding: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardAccent: {
    width: 4,
    backgroundColor: '#16A34A',
  },
  deleteBtn: {
    padding: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  localizacaoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  localizacaoText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  resultLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  resultUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  replayText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
});
