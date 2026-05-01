import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  rightIconName?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, iconName, rightIconName, onRightIconPress, containerStyle, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {iconName && (
          <MaterialIcons name={iconName} size={20} color={Theme.colors.onSurfaceVariant} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Theme.colors.onSurfaceVariant}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIconName && (
          <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7} style={styles.rightIcon}>
            <MaterialIcons name={rightIconName} size={20} color={Theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: Theme.rounded.base,
    paddingHorizontal: Theme.spacing.md,
    minHeight: 44,
  },
  icon: {
    marginRight: Theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  inputFocused: {
    borderColor: Theme.colors.primary,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  errorText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
});
