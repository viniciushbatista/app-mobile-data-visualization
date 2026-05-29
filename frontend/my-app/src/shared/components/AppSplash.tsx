import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface AppSplashProps {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: AppSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo aparece com scale + fade
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Barra de progresso animada
    Animated.timing(progressWidth, {
      toValue: width * 0.6,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    // Após 2.2s faz fade-out e chama onFinish
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Background gradient via layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Conteúdo central */}
      <Animated.View
        style={[
          styles.centerContent,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Ícone */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="eco" size={56} color="#4ADE80" />
        </View>

        {/* Título */}
        <Text style={styles.title}>Bizu</Text>
        <Text style={styles.subtitle}>Potencial Energético da Paraíba</Text>

        {/* Linha separadora */}
        <View style={styles.divider} />

        {/* Instituição */}
        <Text style={styles.institution}>UFPB · LASTER · PIBIC</Text>
      </Animated.View>

      {/* Barra de progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1B4E',
  },
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1B4E',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#122B7A',
    borderTopLeftRadius: 60,
    opacity: 0.5,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 80,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  institution: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
});
