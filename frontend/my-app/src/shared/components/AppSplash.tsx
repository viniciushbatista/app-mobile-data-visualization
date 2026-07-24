import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

interface AppSplashProps {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: AppSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo in
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

    // After 2 seconds, fade out the entire splash
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Center content: logo + app name */}
      <View style={styles.centerContent}>
        <Animated.Image
          source={require('../../../assets/splash-icon.png')}
          style={[
            styles.logo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: logoOpacity }]}>
          BIOSENSUS
        </Animated.Text>
      </View>

      {/* Bottom content: LASTER + copyright */}
      <View style={styles.bottomContent}>
        <Text style={styles.lasterText}>LASTER</Text>
        <Text style={styles.copyrightText}>Todos os direitos reservados</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#14AE5C',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    tintColor: '#FFFFFF',
  },
  appName: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: undefined, // uses system font; swap for a custom font if loaded
  },
  bottomContent: {
    paddingBottom: 48,
    alignItems: 'center',
    gap: 4,
  },
  lasterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
    opacity: 0.9,
  },
  copyrightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    opacity: 0.75,
  },
});
