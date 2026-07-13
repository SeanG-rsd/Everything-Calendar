import { Text, View } from 'react-native';
import { Button } from '../ui/Button';

interface PaginationProps {
  offset: number;
  limit: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ offset, limit, hasMore, onPrev, onNext }: PaginationProps) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Button variant="secondary" onPress={onPrev} disabled={offset === 0}>
        Previous
      </Button>
      <Text className="text-sm text-slate-500">
        Showing {offset + 1}–{offset + limit}
      </Text>
      <Button variant="secondary" onPress={onNext} disabled={!hasMore}>
        Next
      </Button>
    </View>
  );
}
