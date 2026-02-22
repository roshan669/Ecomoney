import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

// ── Math helpers ──────────────────────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;

const polar = (cx: number, cy: number, r: number, deg: number) => ({
  x: cx + r * Math.cos(toRad(deg)),
  y: cy + r * Math.sin(toRad(deg)),
});

/**
 * SVG path for one donut slice with all 4 corners rounded.
 *
 * Each corner (outer-start, outer-end, inner-end, inner-start) is replaced
 * with a small arc of radius `cornerR` using sweep=1 (all are clockwise turns
 * when traversing the outer boundary of the shape).
 */
const buildSlicePath = (
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
  cornerR: number,
): string => {
  // Angular offsets on each arc corresponding to cornerR.
  const outerAng = (cornerR / outerR) * (180 / Math.PI);
  const innerAng = (cornerR / innerR) * (180 / Math.PI);
  const f = (n: number) => n.toFixed(3);

  // Outer corners (where outer arc meets flat faces).
  const p1a = polar(cx, cy, outerR, startDeg + outerAng); // outer arc start
  const p1b = polar(cx, cy, outerR - cornerR, startDeg); // start face, outer end
  const p2a = polar(cx, cy, outerR, endDeg - outerAng); // outer arc end
  const p2b = polar(cx, cy, outerR - cornerR, endDeg); // end face, outer end

  // Inner corners (where inner arc meets flat faces).
  const p3a = polar(cx, cy, innerR, endDeg - innerAng); // inner arc end
  const p3b = polar(cx, cy, innerR + cornerR, endDeg); // end face, inner end
  const p4a = polar(cx, cy, innerR, startDeg + innerAng); // inner arc start
  const p4b = polar(cx, cy, innerR + cornerR, startDeg); // start face, inner end

  const lg = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${f(p1b.x)} ${f(p1b.y)}`,
    // start-outer corner
    `A ${f(cornerR)} ${f(cornerR)} 0 0 1 ${f(p1a.x)} ${f(p1a.y)}`,
    // outer arc
    `A ${outerR} ${outerR} 0 ${lg} 1 ${f(p2a.x)} ${f(p2a.y)}`,
    // end-outer corner
    `A ${f(cornerR)} ${f(cornerR)} 0 0 1 ${f(p2b.x)} ${f(p2b.y)}`,
    // end face (outer end → inner end)
    `L ${f(p3b.x)} ${f(p3b.y)}`,
    // end-inner corner
    `A ${f(cornerR)} ${f(cornerR)} 0 0 1 ${f(p3a.x)} ${f(p3a.y)}`,
    // inner arc (counter-clockwise)
    `A ${innerR} ${innerR} 0 ${lg} 0 ${f(p4a.x)} ${f(p4a.y)}`,
    // start-inner corner
    `A ${f(cornerR)} ${f(cornerR)} 0 0 1 ${f(p4b.x)} ${f(p4b.y)}`,
    // Z closes with start face (p4b → p1b straight line)
    "Z",
  ].join(" ");
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

interface RoundedSemiDonutProps {
  data: DonutSlice[];
  focusedKey: string | null;
  onSlicePress: (key: string) => void;
  centerLabelComponent?: () => React.ReactNode;
  outerRadius?: number;
  innerRadius?: number;
  /** Degrees of empty space between adjacent slices. */
  gapDeg?: number;
  /** Colour of the thin stroke separating slices (use card background colour). */
  separatorColor?: string;
  /** Stroke width of the separator. Defaults to 2. */
  separatorWidth?: number;
  /**
   * Radius of the rounded corner arc at each slice end.
   * Keep small (4–10) for subtle rounding; max is half the ring thickness.
   */
  cornerRadius?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
const FOCUS_OFFSET = 10;

export const RoundedSemiDonut: React.FC<RoundedSemiDonutProps> = ({
  data,
  focusedKey,
  onSlicePress,
  centerLabelComponent,
  outerRadius = 155,
  innerRadius = 95,
  gapDeg = 2,
  separatorColor = "transparent",
  separatorWidth = 2,
  cornerRadius = 6,
}) => {
  const ringThickness = outerRadius - innerRadius;
  const hPad = 12;
  const svgW = (outerRadius + hPad + FOCUS_OFFSET) * 2;
  const cx = svgW / 2;
  const cy = outerRadius + hPad + FOCUS_OFFSET;
  const svgH = cy + ringThickness / 2 + 10;

  const total = useMemo(
    () => data.reduce((s, d) => s + (d.value ?? 0), 0),
    [data],
  );

  const slices = useMemo(() => {
    if (!data.length || total === 0) return [];
    const usable = 180 - gapDeg * data.length;
    let cursor = 180;
    return data.map((item) => {
      const span = (item.value / total) * usable;
      const start = cursor + gapDeg / 2;
      const end = start + span;
      cursor = end + gapDeg / 2;
      return {
        ...item,
        startDeg: start,
        endDeg: end,
        midAngle: (start + end) / 2,
      };
    });
  }, [data, total, gapDeg]);

  const labelBottom =
    Math.round(ringThickness / 2) + Math.round(innerRadius * 0.28);

  return (
    <View style={styles.wrapper}>
      <Svg width={svgW} height={svgH}>
        {slices.map((slice, i) => {
          const focused = slice.key === focusedKey;
          const dx = focused
            ? (FOCUS_OFFSET * Math.cos(toRad(slice.midAngle))).toFixed(1)
            : "0";
          const dy = focused
            ? (FOCUS_OFFSET * Math.sin(toRad(slice.midAngle))).toFixed(1)
            : "0";
          return (
            <Path
              key={i}
              d={buildSlicePath(
                cx,
                cy,
                outerRadius,
                innerRadius,
                slice.startDeg,
                slice.endDeg,
                cornerRadius,
              )}
              fill={slice.color}
              opacity={focused ? 1 : 0.9}
              stroke={separatorColor}
              strokeWidth={separatorWidth}
              transform={`translate(${dx}, ${dy})`}
              onPress={() => onSlicePress(slice.key)}
            />
          );
        })}
      </Svg>

      {centerLabelComponent && (
        <View style={[styles.centerLabel, { bottom: labelBottom }]}>
          {centerLabelComponent()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
