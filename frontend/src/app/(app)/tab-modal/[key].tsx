import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TAB_DEFINITIONS } from '@/lib/tabs';
import { TabContent } from '@/tabs/TabContent';
import { colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function TabModalScreen() {
  const router = useRouter();
  const { key, action } = useLocalSearchParams<{ key: string; action?: string }>();
  const def = TAB_DEFINITIONS.find((candidate) => candidate.key === key);

  return (
    <SafeAreaScreen>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="text-lg font-semibold text-ink">{def?.label ?? ''}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-1">
          <Ionicons name="close" size={24} color={colors.inkMuted} />
        </Pressable>
      </View>
      {def && <TabContent tabKey={def.key} action={action} />}
    </SafeAreaScreen>
  );
}
