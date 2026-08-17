import { ProjectDetailView } from '@/components/modules/ProjectDetailView';
import { useLocalSearchParams } from 'expo-router';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectDetailView projectId={Number(id)} />;
}
