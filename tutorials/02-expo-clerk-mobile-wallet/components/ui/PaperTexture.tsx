import { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

/**
 * Subtle horizontal hairlines (editorial paper) — RN approximation of the design-system texture.
 */
export function PaperTextureOverlay() {
  const { width, height } = useWindowDimensions();
  const h = Math.max(height * 2, 1200);
  const patternId = `monoHairlines-${useId().replace(/:/g, '')}`;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={width} height={4}>
            <Line x1="0" y1="1" x2={width} y2="1" stroke="#000000" strokeWidth={1} opacity={0.06} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={h} fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}
