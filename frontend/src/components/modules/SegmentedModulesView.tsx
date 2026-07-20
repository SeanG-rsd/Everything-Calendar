import { useModulesContext } from '@/modules/ModulesContext';
import type { ModuleAccentKey } from '@/theme/colors';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface Section {
  name: string;
  label: string;
  render: () => ReactNode;
}

interface SegmentedModulesViewProps {
  sections: Section[];
  accent: ModuleAccentKey;
}

export function SegmentedModulesView({ sections, accent }: SegmentedModulesViewProps) {
  const { findByName } = useModulesContext();
  const accentClasses = moduleClassNames[accent];
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
    <View className="flex-1 bg-background">
      {visibleSections.length > 1 && (
        <View className="flex-row gap-2 border-b border-border bg-surface p-3">
          {visibleSections.map((s) => (
            <Pressable
              key={s.name}
              onPress={() => setSelected(s.name)}
              className={`flex-1 items-center rounded-md py-2 ${
                activeName === s.name ? accentClasses.bg : 'bg-surface-raised'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  activeName === s.name ? 'text-on-accent' : 'text-ink-muted'
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
