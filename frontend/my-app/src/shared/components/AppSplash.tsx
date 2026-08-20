import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppSplashProps {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: AppSplashProps) {
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const mapOpacity = useRef(new Animated.Value(0)).current;
  const mapTranslateY = useRef(new Animated.Value(-16)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mapa entra vindo de cima
    Animated.parallel([
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(mapTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo e nome entram com delay
    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Rodapé entra por último
    const footerTimer = setTimeout(() => {
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Fade out da splash
    const exitTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2600);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(footerTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={['#0a5c2e', '#0f7a3a', '#14AE5C', '#19d068']}
        style={styles.container}
      >
        {/* ── TOPO: Mapa da Paraíba ── */}
        <Animated.View
          style={[
            styles.mapSection,
            {
              opacity: mapOpacity,
              transform: [{ translateY: mapTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/image/mapapb.png')}
            style={styles.mapImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── CENTRO: Logo + BIOSENSUS ── */}
        <Animated.View style={[styles.centerContent, { opacity: logoOpacity }]}>
          <Animated.Image
            source={require('../../../assets/splash-icon.png')}
            style={[
              styles.logo,
              { transform: [{ scale: logoScale }] },
            ]}
            resizeMode="contain"
          />
          <Animated.Text style={styles.appName}>
            BIOSENSUS
          </Animated.Text>
        </Animated.View>

        {/* ── RODAPÉ: Textos institucionais ── */}
        <Animated.View style={[styles.bottomContent, { opacity: footerOpacity }]}>
          <Text style={styles.grupoText}>@grupo2exa</Text>
          <Text style={styles.labText}>Laboratório de Sistemas Térmicos - LASTER</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  mapSection: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapImage: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.56,
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    tintColor: '#FFFFFF',
  },
  appName: {
    marginTop: -100,
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: 6,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  grupoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    letterSpacing: 1,
    opacity: 0.85,
  },
  labText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    letterSpacing: 0.3,
    opacity: 0.75,
  },
});
