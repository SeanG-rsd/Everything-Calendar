import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <RNModal visible animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 p-4">
        <View className="w-full max-w-md rounded-lg bg-white p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-slate-400">✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}
