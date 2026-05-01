import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'icon';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  iconName,
  style, 
  textStyle,
  disabled 
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isIcon = variant === 'icon';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isIcon && styles.iconButton,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {iconName && (
        <Ionicons 
          name={iconName} 
          size={isIcon ? 20 : 16} 
          color={isPrimary ? Theme.colors.onPrimary : Theme.colors.primary} 
          style={title ? { marginRight: Theme.spacing.sm } : undefined}
        />
      )}
      {title && (
        <Text
          style={[
            styles.textBase,
            isPrimary && styles.textPrimary,
            isSecondary && styles.textSecondary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.rounded.base,
    minHeight: 40,
  },
  primary: {
    backgroundColor: Theme.colors.primary,
  },
  secondary: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  iconButton: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 32,
    height: 32,
    borderRadius: Theme.rounded.sm,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    ...Theme.typography.labelLg,
  },
  textPrimary: {
    color: Theme.colors.onPrimary,
  },
  textSecondary: {
    color: Theme.colors.primary,
  },
});
