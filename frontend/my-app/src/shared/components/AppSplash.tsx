import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';

const { width } = Dimensions.get('window');

interface AppSplashProps {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: AppSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
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

    // Após 2.4s faz fade-out e chama onFinish
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Conteúdo central */}
      <Animated.View
        style={[
          styles.centerContent,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Logo NEGO */}
        <Image
          source={require('../../../assets/image/logo-nego.png')}
          style={styles.negoLogo}
          resizeMode="contain"
        />

        {/* Título */}
        <Text style={styles.title}>Bizu</Text>
        <Text style={styles.subtitle}>Potencial Energético de Biogás da Paraíba</Text>

        {/* Linha separadora vermelha */}
        <View style={styles.divider} />

        {/* Logo LASTER */}
        <Image
          source={require('../../../assets/image/logo-laster.png')}
          style={styles.lasterLogo}
          resizeMode="contain"
        />
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
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 80,
    paddingHorizontal: 24,
  },
  negoLogo: {
    width: width * 0.82,
    height: 210,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 0.2,
    marginBottom: 18,
  },
  divider: {
    width: 44,
    height: 3,
    backgroundColor: '#D32F2F',
    borderRadius: 2,
    marginBottom: 18,
  },
  lasterLogo: {
    width: width * 0.85,
    height: 130,
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
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#9E9E9E',
    letterSpacing: 0.3,
  },
});
