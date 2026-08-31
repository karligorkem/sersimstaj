import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import type { ErrorCodeDto as ErrorCode } from "~/types";

type Props = {
  error: ErrorCode;
  selected: boolean;
  onSelect: (error: ErrorCode) => void;
};

export default function ErrorCodeItem({ error, selected, onSelect }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(error)}
      className={`p-3 mb-2 rounded-xl ${
        selected ? "bg-blue-500" : "bg-gray-200"
      }`}
    >
      <View>
        <Text
          className={`font-bold ${
            selected ? "text-white" : "text-gray-800"
          }`}
        >
          {error.code}
        </Text>
        <Text className={selected ? "text-white" : "text-gray-600"}>
          {error.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
