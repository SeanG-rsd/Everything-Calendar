import { colors } from '@/theme/colors';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaterBottleProps {
  progress: number;
  width?: number;
  height?: number;
}

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 220;
const NECK_LEFT = 46;
const NECK_RIGHT = 74;
const NECK_TOP = 8;
const NECK_BOTTOM = 42;
const SHOULDER_BOTTOM = 78;
const BODY_LEFT = 14;
const BODY_RIGHT = 106;
const BOTTOM_Y = 208;
const CORNER = 14;
const FILL_TOP = 6;

const BOTTLE_PATH = `
  M${NECK_LEFT},${NECK_TOP}
  L${NECK_RIGHT},${NECK_TOP}
  L${NECK_RIGHT},${NECK_BOTTOM}
  C${NECK_RIGHT},${NECK_BOTTOM + 18} ${BODY_RIGHT},${SHOULDER_BOTTOM - 20} ${BODY_RIGHT},${SHOULDER_BOTTOM}
  L${BODY_RIGHT},${BOTTOM_Y - CORNER}
  Q${BODY_RIGHT},${BOTTOM_Y} ${BODY_RIGHT - CORNER},${BOTTOM_Y}
  L${BODY_LEFT + CORNER},${BOTTOM_Y}
  Q${BODY_LEFT},${BOTTOM_Y} ${BODY_LEFT},${BOTTOM_Y - CORNER}
  L${BODY_LEFT},${SHOULDER_BOTTOM}
  C${BODY_LEFT},${SHOULDER_BOTTOM - 20} ${NECK_LEFT},${NECK_BOTTOM + 18} ${NECK_LEFT},${NECK_BOTTOM}
  Z
`;

function wavePath(baselineY: number, phase: number, amplitude: number): string {
  'worklet';
  const steps = 16;
  let d = `M0,${VIEW_HEIGHT} L0,${baselineY}`;
  for (let i = 0; i <= steps; i++) {
    const x = (VIEW_WIDTH * i) / steps;
    const y = baselineY + amplitude * Math.sin((i / steps) * Math.PI * 2 + phase);
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += ` L${VIEW_WIDTH},${VIEW_HEIGHT} Z`;
  return d;
}

export function WaterBottle({ progress, width = 160, height = 300 }: WaterBottleProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const baselineY = useSharedValue(BOTTOM_Y - clamped * (BOTTOM_Y - FILL_TOP));
  const phase = useSharedValue(0);

  useEffect(() => {
    baselineY.value = withTiming(BOTTOM_Y - clamped * (BOTTOM_Y - FILL_TOP), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [baselineY, clamped]);

  useEffect(() => {
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1, false);
  }, [phase]);

  const backAnimatedProps = useAnimatedProps(() => ({
    d: wavePath(baselineY.value, phase.value * 0.8, 3),
  }));
  const frontAnimatedProps = useAnimatedProps(() => ({
    d: wavePath(baselineY.value, phase.value + Math.PI, 4),
  }));

  return (
    <View style={{ width, height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Defs>
          <ClipPath id="waterBottleClip">
            <Path d={BOTTLE_PATH} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#waterBottleClip)">
          <AnimatedPath animatedProps={backAnimatedProps} fill={colors.water.strong} opacity={0.55} />
          <AnimatedPath animatedProps={frontAnimatedProps} fill={colors.water.default} />
        </G>
        <Path d={BOTTLE_PATH} stroke={colors.inkFaint} strokeWidth={4} fill="none" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
