import { TextInput, StyleSheet, TextInputProps } from "react-native";

interface SimpleInputProps extends TextInputProps {
  placeholder: string;
}

export function SimpleInput({ placeholder, style, ...props }: SimpleInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#11181C",
    backgroundColor: "#fff",
    marginTop: 8,
  },
});