import React from "react";
import { Text, TextProps } from "react-native";

export function H1(props: TextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "Inter_800ExtraBold", fontSize: 28, color: "#111827" }, props.style]}
    />
  );
}

export function H2(props: TextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: "#111827" }, props.style]}
    />
  );
}

export function Body(props: TextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#6B7280" }, props.style]}
    />
  );
}

export function Label(props: TextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "Inter_700Bold", fontSize: 11, color: "#6B7280" }, props.style]}
    />
  );
}
