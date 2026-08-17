import { formatDateDisplay, parseDateOnly } from '@/lib/date';
import { entryDate, entryWeightLbs, roundWeightLbs, type WeightGoal } from '@/lib/weight';
import type { Entry } from '@/api/types';
import { colors, moduleAccents } from '@/theme/colors';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

const accent = moduleAccents.weight;

const CHART_WIDTH = 320;
const CHART_HEIGHT = 180;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

interface WeightChartProps {
  /** Weight log entries only (not the goal entry), any order — chronological sorting happens here. */
  logs: Entry[];
  goal: WeightGoal | null;
}

export function WeightChart({ logs, goal }: WeightChartProps) {
  const points = logs
    .map((entry) => {
      const date = entryDate(entry);
      const weightLbs = entryWeightLbs(entry);
      if (date == null || weightLbs == null) return null;
      return { date, weightLbs, timestamp: parseDateOnly(date).getTime() };
    })
    .filter((p): p is { date: string; weightLbs: number; timestamp: number } => p != null)
    .sort((a, b) => a.timestamp - b.timestamp);

  const weights = points.map((p) => p.weightLbs);
  const values = goal ? [...weights, goal.targetWeightLbs] : weights;
  // With no logged weight yet, fall back to a plausible default band around the
  // goal (or a generic one) so the chart still reads as a chart, not an empty box.
  const minValue = values.length > 0 ? Math.min(...values) : (goal?.targetWeightLbs ?? 150) - 10;
  const maxValue = values.length > 0 ? Math.max(...values) : (goal?.targetWeightLbs ?? 150) + 10;
  const valuePad = (maxValue - minValue || 10) * 0.15;
  const yMin = minValue - valuePad;
  const yMax = maxValue + valuePad;

  const now = Date.now();
  const minTs = points[0]?.timestamp ?? now - 1000 * 60 * 60 * 24 * 6;
  const maxTs = points[points.length - 1]?.timestamp ?? now;
  const tsRange = maxTs - minTs || 1;

  const xFor = (timestamp: number) => PADDING.left + ((timestamp - minTs) / tsRange) * PLOT_WIDTH;
  const yFor = (value: number) => PADDING.top + (1 - (value - yMin) / (yMax - yMin)) * PLOT_HEIGHT;

  const plotted = points.map((p) => ({ ...p, x: xFor(p.timestamp), y: yFor(p.weightLbs) }));
  const polylinePoints = plotted.map((p) => `${p.x},${p.y}`).join(' ');
  const firstPoint = points.length > 0 ? points[0] : null;
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  const topGridY = PADDING.top;
  const bottomGridY = PADDING.top + PLOT_HEIGHT;

  return (
    <View className="rounded-md border border-border bg-surface p-2">
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Line
          x1={PADDING.left}
          y1={topGridY}
          x2={CHART_WIDTH - PADDING.right}
          y2={topGridY}
          stroke={colors.borderSubtle}
          strokeWidth={1}
        />
        <SvgText x={PADDING.left - 6} y={topGridY + 3} fontSize={9} fill={colors.inkFaint} textAnchor="end">
          {Math.round(yMax)}
        </SvgText>
        <Line
          x1={PADDING.left}
          y1={bottomGridY}
          x2={CHART_WIDTH - PADDING.right}
          y2={bottomGridY}
          stroke={colors.borderSubtle}
          strokeWidth={1}
        />
        <SvgText x={PADDING.left - 6} y={bottomGridY + 3} fontSize={9} fill={colors.inkFaint} textAnchor="end">
          {Math.round(yMin)}
        </SvgText>

        {goal && (
          <>
            <Line
              x1={PADDING.left}
              y1={yFor(goal.targetWeightLbs)}
              x2={CHART_WIDTH - PADDING.right}
              y2={yFor(goal.targetWeightLbs)}
              stroke={colors.inkFaint}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={CHART_WIDTH - PADDING.right}
              y={yFor(goal.targetWeightLbs) - 4}
              fontSize={9}
              fill={colors.inkFaint}
              textAnchor="end">
              Goal: {roundWeightLbs(goal.targetWeightLbs)} lbs
            </SvgText>
          </>
        )}

        {points.length >= 2 && <Polyline points={polylinePoints} fill="none" stroke={accent.default} strokeWidth={2} />}
        {plotted.map((p) => (
          <Circle key={p.date} cx={p.x} cy={p.y} r={4} fill={accent.default} />
        ))}

        {firstPoint && lastPoint && (
          <>
            <SvgText x={PADDING.left} y={CHART_HEIGHT - 8} fontSize={9} fill={colors.inkFaint} textAnchor="start">
              {formatDateDisplay(firstPoint.date)}
            </SvgText>
            <SvgText
              x={CHART_WIDTH - PADDING.right}
              y={CHART_HEIGHT - 8}
              fontSize={9}
              fill={colors.inkFaint}
              textAnchor="end">
              {formatDateDisplay(lastPoint.date)}
            </SvgText>
          </>
        )}
      </Svg>
      {points.length < 2 && (
        <Text className="pb-1 pt-2 text-center text-xs text-ink-faint">
          {points.length === 0 ? 'Log a weigh-in to start your chart.' : 'Log one more weigh-in to see a trend.'}
        </Text>
      )}
    </View>
  );
}
