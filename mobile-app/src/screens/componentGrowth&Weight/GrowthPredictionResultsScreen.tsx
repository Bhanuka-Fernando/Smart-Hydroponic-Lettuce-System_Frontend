import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";

type RouteParams = {
  dateLabel?: string;
  predictedWeight?: number;
  predictedArea?: number;
  predictedDiameter?: number;
  changePct?: number;

  labels?: string[];
  actual?: number[];
  predicted?: number[];
};


function StatCard({
  title,
  value,
  unit,
  changePct,
  rightIcon,
}: {
  title: string;
  value: string;
  unit?: string;
  changePct: number;
  rightIcon?: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-[16px] border border-gray-100 px-4 py-4">
      <View className="flex-row items-start justify-between">
        <Text className="text-[10px] font-extrabold text-gray-500 tracking-[0.5px]">
          {title}
        </Text>
        {rightIcon ? rightIcon : <View />}
      </View>

      <View className="flex-row items-end mt-2">
        <Text className="text-[20px] font-extrabold text-gray-900">{value}</Text>
        {unit ? (
          <Text className="text-[12px] font-bold text-gray-500 ml-1 mb-[2px]">
            {unit}
          </Text>
        ) : null}
      </View>

      <View className="mt-3 self-start px-2.5 py-1 rounded-full bg-[#E9FBEF] flex-row items-center">
        <Ionicons name="trending-up" size={14} color="#16A34A" />
        <Text className="ml-1 text-[10px] font-extrabold text-[#16A34A]">
          +{changePct}%
        </Text>
      </View>
    </View>
  );
}

/** Simple SVG line chart (no extra libs) */
function GrowthTrendChart({
  labels,
  actual,
  predicted,
}: {
  labels: string[];
  actual: number[];
  predicted: number[];
}) {
  const w = 320;
  const h = 170;
  const pad = 22;

  const all = [...actual, ...predicted];
  const min = Math.min(...all);
  const max = Math.max(...all);

  const scaleX = (i: number) =>
    pad + (i * (w - pad * 2)) / (labels.length - 1);

  const scaleY = (v: number) => {
    if (max === min) return h / 2;
    const t = (v - min) / (max - min); // 0..1
    return h - pad - t * (h - pad * 2);
  };

  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
      .join(" ");

  const pathActual = toPath(actual);
  const pathPred = toPath(predicted);

  // last point highlight (tomorrow)
  const lastIdx = labels.length - 1;



  return (
    <View className="bg-white rounded-[16px] border border-[#003B8F] px-4 py-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[12px] font-extrabold text-gray-900">
          Growth Trend
        </Text>

        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            <View className="w-2 h-2 rounded-full bg-[#111827]" />
            <Text className="ml-2 text-[10px] font-bold text-gray-600">
              Actual
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#003B8F]" />
            <Text className="ml-2 text-[10px] font-bold text-gray-600">
              Predicted
            </Text>
          </View>
        </View>
      </View>

      <Svg width={w} height={h}>
        {/* horizontal grid lines */}
        {[0, 1, 2, 3].map((k) => {
          const y = pad + (k * (h - pad * 2)) / 3;
          return (
            <Line
              key={k}
              x1={pad}
              y1={y}
              x2={w - pad}
              y2={y}
              stroke="#D8E3FF"
              strokeWidth={1}
            />
          );
        })}

        {/* paths */}
        <Path d={pathActual} stroke="#111827" strokeWidth={3} fill="none" />
        <Path
          d={pathPred}
          stroke="#003B8F"
          strokeWidth={3}
          fill="none"
          strokeDasharray="6 6"
        />

        {/* points */}
        {actual.map((v, i) => (
          <Circle
            key={`a-${i}`}
            cx={scaleX(i)}
            cy={scaleY(v)}
            r={3}
            fill="#111827"
          />
        ))}
        {predicted.map((v, i) => (
          <Circle
            key={`p-${i}`}
            cx={scaleX(i)}
            cy={scaleY(v)}
            r={3}
            fill="#003B8F"
          />
        ))}

        {/* last point ring */}
        <Circle
          cx={scaleX(lastIdx)}
          cy={scaleY(predicted[lastIdx])}
          r={7}
          stroke="#003B8F"
          strokeWidth={3}
          fill="white"
        />
        <Circle
          cx={scaleX(lastIdx)}
          cy={scaleY(predicted[lastIdx])}
          r={3}
          fill="#003B8F"
        />

        {/* x labels */}
        {labels.map((t, i) => (
          <SvgText
            key={`x-${i}`}
            x={scaleX(i)}
            y={h - 4}
            fontSize="9"
            fill="#6B7280"
            textAnchor="middle"
          >
            {t}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function GrowthPredictionResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: RouteParams = route.params || {};

  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "0.0");


const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toNumArray = (arr: any, fallbackLen = 2) => {
  if (!Array.isArray(arr)) return new Array(fallbackLen).fill(0);
  return arr.map((x) => toNum(x, 0));
};

const model = useMemo(() => {
  const dateLabel = params.dateLabel ?? "Tomorrow";

  const predictedWeight = toNum(params.predictedWeight, 0);
  const predictedArea = toNum(params.predictedArea, 0);
  const predictedDiameter = toNum(params.predictedDiameter, 0);

  const labels = Array.isArray(params.labels) ? params.labels : ["Today", "D+1"];
  const actual = toNumArray(params.actual, labels.length);
  const predicted = toNumArray(params.predicted, labels.length);

  // ✅ make lengths consistent
  const L = labels.length;
  const actualFixed = actual.slice(0, L).concat(new Array(Math.max(0, L - actual.length)).fill(actual[0] ?? 0));
  const predFixed = predicted.slice(0, L).concat(new Array(Math.max(0, L - predicted.length)).fill(predicted[0] ?? 0));

  const changePct =
    params.changePct != null
      ? toNum(params.changePct, 0)
      : predFixed[0] > 0
      ? ((predFixed[1] - predFixed[0]) / predFixed[0]) * 100
      : 0;

  return {
    dateLabel,
    predictedWeight,
    predictedArea,
    predictedDiameter,
    changePct,
    labels,
    actual: actualFixed,
    predicted: predFixed,
  };
}, [params]);



  const onSave = () => {
    // TODO: persist to DB / history
    Alert.alert("Saved", "Prediction saved (demo).");
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[13px] font-extrabold text-gray-900">
            Prediction Results
          </Text>

          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        <Text className="text-[18px] font-extrabold text-gray-900 text-center mt-2">
          Forecast for Tomorrow
        </Text>
        <Text className="text-[11px] text-gray-500 text-center mt-2">
          {model.dateLabel}
        </Text>

        {/* Predicted Weight */}
        <View className="mt-5">
          <StatCard
            title="PREDICTED WEIGHT"
            value={fmt(model.predictedWeight)}
            unit="g"
            changePct={model.changePct}
            rightIcon={<Ionicons name="leaf-outline" size={18} color="#16A34A" />}
          />
        </View>

        {/* Area + Diameter */}
        <View className="flex-row mt-3" style={{ gap: 12 }}>
          <View className="flex-1">
            <StatCard
              title="PREDICTED AREA"
              value={fmt(model.predictedArea)}
              unit="cm²"
              changePct={model.changePct}
              rightIcon={<Ionicons name="resize-outline" size={18} color="#16A34A" />}
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="DIAMETER"
              value={fmt(model.predictedDiameter)}
              unit="cm"
              changePct={model.changePct}
              rightIcon={
                <View className="w-6 h-6 rounded-full bg-[#E9FBEF] items-center justify-center">
                  <View className="w-3 h-3 rounded-full border-2 border-[#16A34A]" />
                </View>
              }
            />
          </View>
        </View>

        {/* Chart */}
        <View className="mt-4">
          <GrowthTrendChart
            labels={model.labels}
            actual={model.actual}
            predicted={model.predicted}
          />
        </View>

        {/* Insight */}
        <View className="mt-4 bg-white rounded-[16px] border border-gray-100 px-4 py-4">
          <View className="flex-row items-center">
            <Ionicons name="sparkles-outline" size={18} color="#003B8F" />
            <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
              Good Growth Rate
            </Text>
          </View>
          <Text className="text-[11px] text-gray-600 mt-2 leading-[16px]">
            Your plant is growing{" "}
            <Text className="font-extrabold text-[#16A34A]">5% faster</Text> than
            the average for plant ID #01.
          </Text>
        </View>

        {/* Bottom Save */}
        <View className="px-4 pb-4 bg-[#F4F6FA]">
            <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSave}
            className="bg-[#003B8F] rounded-[16px] py-4 items-center justify-center flex-row"
            >
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text className="ml-2 text-[12px] font-extrabold text-white">Save</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      
    </SafeAreaView>
  );
}
