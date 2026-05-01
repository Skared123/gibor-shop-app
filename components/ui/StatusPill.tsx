import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Theme';

export type StatusVariant = 'success' | 'pending' | 'error' | 'neutral';

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  style?: ViewStyle;
}

export function StatusPill({ label, variant = 'neutral', style }: StatusPillProps) {
  const isSuccess = variant === 'success';
  const isPending = variant === 'pending';
  const isError = variant === 'error';

  return (
    <View
      style={[
        styles.pill,
        isSuccess && styles.success,
        isPending && styles.pending,
        isError && styles.error,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isSuccess && styles.textSuccess,
          isPending && styles.textPending,
          isError && styles.textError,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.rounded.full,
    backgroundColor: Theme.colors.surfaceVariant || '#e4e2e1',
    alignSelf: 'flex-start',
  },
  success: {
    backgroundColor: Theme.colors.successTint,
  },
  pending: {
    backgroundColor: Theme.colors.pendingTint,
  },
  error: {
    backgroundColor: Theme.colors.errorContainer,
  },
  text: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  textSuccess: {
    color: Theme.colors.successTintText,
  },
  textPending: {
    color: Theme.colors.pendingTintText,
  },
  textError: {
    color: Theme.colors.onErrorContainer,
  },
});
