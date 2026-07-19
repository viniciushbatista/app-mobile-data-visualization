import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AppSplashProps {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: AppSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const leafPulse = useRef(new Animated.Value(1)).current;

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

    // Ícone de folha pulsa suavemente
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafPulse, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(leafPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
      <LinearGradient
        colors={['#14532D', '#15803D', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Círculos decorativos de fundo */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Conteúdo central */}
      <Animated.View
        style={[
          styles.centerContent,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Ícone de folha animado */}
        <Animated.View style={[styles.leafIconWrap, { transform: [{ scale: leafPulse }] }]}>
          <MaterialCommunityIcons name="leaf" size={32} color="#4ADE80" />
        </Animated.View>

        {/* Logo NEGO */}
        <Image
          source={require('../../../assets/image/logo-nego.png')}
          style={styles.negoLogo}
          resizeMode="contain"
        />

        {/* Título */}
        <Text style={styles.title}>Bizu</Text>
        <Text style={styles.subtitle}>Potencial Energético de Biogás da Paraíba</Text>

        {/* Linha separadora verde clara */}
        <View style={styles.divider} />

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
  },
  bgCircle1: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bgCircle2: {
    position: 'absolute',
    left: -80,
    bottom: 80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 80,
    paddingHorizontal: 24,
  },
  leafIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  negoLogo: {
    width: width * 0.82,
    height: 210,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    letterSpacing: 0.2,
    marginBottom: 18,
    textAlign: 'center',
  },
  divider: {
    width: 44,
    height: 3,
    backgroundColor: '#4ADE80',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
});
