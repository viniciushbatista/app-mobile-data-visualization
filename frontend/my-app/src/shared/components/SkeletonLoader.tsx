import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width, height, borderRadius = 8, style }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#CBD5E1',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton pré-montado para um card de gráfico (dashboard / simulationoutput)
export function ChartCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Título */}
      <SkeletonLoader width="55%" height={14} borderRadius={6} style={{ marginBottom: 20 }} />
      {/* Barras do gráfico */}
      <View style={styles.barsRow}>
        {[0.4, 0.7, 0.55, 0.85, 0.65, 0.9, 0.5].map((h, i) => (
          <SkeletonLoader
            key={i}
            width={24}
            height={120 * h}
            borderRadius={4}
            style={{ alignSelf: 'flex-end' }}
          />
        ))}
      </View>
      {/* Eixo X */}
      <SkeletonLoader width="100%" height={1} borderRadius={0} style={{ marginTop: 8, opacity: 0.4 }} />
    </View>
  );
}

// Skeleton para card de resultado (simulationoutput)
export function ResultCardSkeleton() {
  return (
    <View style={[styles.card, { gap: 10 }]}>
      <SkeletonLoader width="40%" height={14} borderRadius={6} />
      <SkeletonLoader width="70%" height={36} borderRadius={8} />
      <SkeletonLoader width="55%" height={12} borderRadius={6} />
    </View>
  );
}

// Skeleton para uma linha de lista (index / history)
export function ListRowSkeleton() {
  return (
    <View style={styles.listRow}>
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonLoader width="60%" height={14} borderRadius={6} />
        <SkeletonLoader width="40%" height={11} borderRadius={6} />
      </View>
      <SkeletonLoader width={48} height={20} borderRadius={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 130,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
});
