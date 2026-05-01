import React from 'react';
import { View, StyleSheet, ViewProps, Text } from 'react-native';
import { Theme } from '@/constants/Theme';

interface CardProps extends ViewProps {
  title?: string;
  rightAction?: React.ReactNode;
}

export function Card({ title, rightAction, style, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {(title || rightAction) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {rightAction && <View>{rightAction}</View>}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.lg,
    ...Theme.elevation.level1,
    marginVertical: Theme.spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  title: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  content: {
    padding: Theme.spacing.md,
  },
});
