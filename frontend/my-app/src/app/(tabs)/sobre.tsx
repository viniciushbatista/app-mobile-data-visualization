import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface InfoCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}

function InfoCard({ icon, title, children, accentColor = '#2D6EFF' }: InfoCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconContainer, { backgroundColor: accentColor + '18' }]}>
          <MaterialIcons name={icon} size={20} color={accentColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function DataBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataBadge}>
      <Text style={styles.dataBadgeLabel}>{label}</Text>
      <Text style={styles.dataBadgeValue}>{value}</Text>
    </View>
  );
}

export default function Sobre() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Sobre o Projeto */}
      <InfoCard icon="info" title="Sobre o Projeto" accentColor="#2D6EFF">
        <Text style={styles.bodyText}>
          Este aplicativo é resultado de uma pesquisa de Iniciação Científica (PIBIC) da{' '}
          <Text style={styles.bold}>Universidade Federal da Paraíba (UFPB)</Text>, com foco na
          análise e projeção do potencial energético gerado a partir de resíduos de biomassa animal
          nos municípios e mesorregiões do estado.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 10 }]}>
          O objetivo é fornecer uma ferramenta de apoio à tomada de decisão para pesquisadores,
          gestores públicos e profissionais da área de energia renovável.
        </Text>
      </InfoCard>

      {/* Base de Dados */}
      <InfoCard icon="storage" title="Base de Dados" accentColor="#10B981">
        <Text style={styles.bodyText}>
          Os dados de efetivo de rebanho são fornecidos pelo{' '}
          <Text style={styles.bold}>IBGE</Text> por meio da{' '}
          <Text style={styles.bold}>Pesquisa Pecuária Municipal (PPM)</Text>.
        </Text>

        <View style={styles.badgeRow}>
          <DataBadge label="Fonte" value="IBGE / PPM" />
          <DataBadge label="Cobertura" value="Paraíba" />
          <DataBadge label="Dados disponíveis" value="1974 – 2024" />
        </View>

        <View style={styles.noteBox}>
          <MaterialIcons name="info-outline" size={14} color="#059669" />
          <Text style={styles.noteText}>
            Projeções são calculadas a partir do último ano disponível na base (2024).
          </Text>
        </View>
      </InfoCard>

      {/* Créditos */}
      <InfoCard icon="people" title="Créditos" accentColor="#F59E0B">
        <View style={styles.creditRow}>
          <MaterialCommunityIcons name="account-school" size={16} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.creditLabel}>Instituição</Text>
            <Text style={styles.creditValue}>Universidade Federal da Paraíba — UFPB</Text>
          </View>
        </View>
        <View style={styles.creditRow}>
          <MaterialCommunityIcons name="office-building" size={16} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.creditLabel}>Centro</Text>
            <Text style={styles.creditValue}>
              Centro de Energias Alternativas e Renováveis — CEAR
            </Text>
          </View>
        </View>
        <View style={styles.creditRow}>
          <MaterialCommunityIcons name="flask" size={16} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.creditLabel}>Laboratório</Text>
            <Text style={styles.creditValue}>
              Laboratório de Sistemas Térmicos — LASTER
            </Text>
          </View>
        </View>
      </InfoCard>

      {/* Rodapé */}
      <View style={styles.footer}>
        <MaterialIcons name="copyright" size={13} color="#9CA3AF" />
        <Text style={styles.footerText}>UFPB/CEAR</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Laboratório de Sistemas Térmicos — LASTER</Text>
      </View>
      <Text style={styles.footerVersion}>Todos os direitos reservados</Text>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: '#0D1B4E',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(74,222,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2D6EFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cardIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  bodyText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 21,
  },
  bold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  formulaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formulaLegend: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dataBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dataBadgeLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dataBadgeValue: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  creditLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  creditValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
});
