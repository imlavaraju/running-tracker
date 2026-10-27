import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';
import { formatDuration } from '../utils/formatters';

export default function Timer({ seconds, isRunning }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      opacity.setValue(1);
    }
  }, [isRunning, opacity]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.time, { opacity }]}>
        {formatDuration(seconds)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  time: {
    fontSize: FONT_SIZES.hero,
    fontWeight: '200',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
});

