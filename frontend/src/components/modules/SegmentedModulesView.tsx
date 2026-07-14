import { useModulesContext } from '@/modules/ModulesContext';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface Section {
  name: string;
  label: string;
  render: () => ReactNode;
}

interface SegmentedModulesViewProps {
  sections: Section[];
}

export function SegmentedModulesView({ sections }: SegmentedModulesViewProps) {
  const { findByName } = useModulesContext();
  const [selected, setSelected] = useState(sections[0]?.name);

  const visibleSections = sections.filter((s) => {
    const module = findByName(s.name);
    return !module || module.is_active;
  });

  const activeName = visibleSections.some((s) => s.name === selected)
    ? selected
    : (visibleSections[0]?.name ?? selected);

  const activeSection = visibleSections.find((s) => s.name === activeName);

  return (
    <View className="flex-1 bg-slate-50">
      {visibleSections.length > 1 && (
        <View className="flex-row gap-2 border-b border-slate-200 bg-white p-3">
          {visibleSections.map((s) => (
            <Pressable
              key={s.name}
              onPress={() => setSelected(s.name)}
              className={`flex-1 items-center rounded-md py-2 ${
                activeName === s.name ? 'bg-slate-900' : 'bg-slate-100'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  activeName === s.name ? 'text-white' : 'text-slate-600'
                }`}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {activeSection?.render()}
    </View>
  );
}
