import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type MentorMember = { id: string; name: string; imageUrl: string };

export interface MentorWallTheme {
  bgGradient: readonly string[];
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  lineColor: string;
}

export interface MentorWallProps {
  mentors: MentorMember[];
  theme: MentorWallTheme;
}

const ROWS = 7;
const ROW_GAP = 18;
const CARD_GAP = 20;
const NAME_HEIGHT = 22;
const MIN_CARD_WIDTH = 60;
const MAX_CARD_WIDTH = 480;
const DEFAULT_ASPECT = 0.78;
const MS_PER_PX = 25;
const SIZE_MULTIPLIER = 2.4;

const fallbackImg = require('../../assets/uiux/person.jpg');

const aspectRatioCache = new Map<string, number>();

function chunkIntoRows(data: MentorMember[], rows: number): MentorMember[][] {
  if (data.length === 0) return Array.from({ length: rows }, () => []);
  if (data.length < rows) {
    return Array.from({ length: rows }, () => data);
  }
  const perRow = Math.ceil(data.length / rows);
  const result: MentorMember[][] = [];
  for (let i = 0; i < rows; i++) {
    const slice = data.slice(i * perRow, (i + 1) * perRow);
    result.push(slice.length > 0 ? slice : data);
  }
  return result;
}

function useAspectRatios(mentors: MentorMember[]): {
  ratios: Record<string, number>;
  ready: boolean;
} {
  const uris = useMemo(
    () => Array.from(new Set(mentors.map((m) => m.imageUrl).filter(Boolean))),
    [mentors]
  );
  const [ratios, setRatios] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    uris.forEach((u) => {
      if (aspectRatioCache.has(u)) initial[u] = aspectRatioCache.get(u)!;
    });
    return initial;
  });

  useEffect(() => {
    let cancelled = false;
    uris.forEach((uri) => {
      if (aspectRatioCache.has(uri)) return;
      Image.getSize(
        uri,
        (w, h) => {
          if (cancelled || !h) return;
          const r = w / h;
          aspectRatioCache.set(uri, r);
          setRatios((prev) => ({ ...prev, [uri]: r }));
        },
        () => {
          if (cancelled) return;
          aspectRatioCache.set(uri, DEFAULT_ASPECT);
          setRatios((prev) => ({ ...prev, [uri]: DEFAULT_ASPECT }));
        }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [uris]);

  const ready = uris.every((u) => u in ratios);
  return { ratios, ready };
}

const MentorCard = memo(function MentorCard({
  item,
  imageHeight,
  aspectRatio,
  theme,
  onPressIn: onPressInRow,
  onPressOut: onPressOutRow,
}: {
  item: MentorMember;
  imageHeight: number;
  aspectRatio: number;
  theme: MentorWallTheme;
  onPressIn?: () => void;
  onPressOut?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    onPressInRow?.();
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    onPressOutRow?.();
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const ratio = aspectRatio || DEFAULT_ASPECT;
  const cardWidth = Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, imageHeight * ratio));
  const cardHeight = cardWidth / ratio;

  return (
    <View style={[styles.cardSlot, { width: cardWidth }]}>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} hitSlop={4}>
        <Animated.View
          style={[
            styles.cardImageWrap,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: theme.cardBg,
              borderColor: theme.lineColor,
              transform: [{ scale }],
            },
          ]}
        >
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : fallbackImg}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </Animated.View>
      </Pressable>
      <Text
        numberOfLines={1}
        style={[styles.cardName, { color: theme.textPrimary, width: cardWidth + 10 }]}
      >
        {item.name}
      </Text>
    </View>
  );
});

const MentorRow = memo(function MentorRow({
  mentors,
  direction,
  imageHeight,
  theme,
  ratios,
  ready,
}: {
  mentors: MentorMember[];
  direction: 'left' | 'right';
  imageHeight: number;
  theme: MentorWallTheme;
  ratios: Record<string, number>;
  ready: boolean;
}) {
  // Build repeated data for infinite loop
  const repeatCount = Math.max(4, Math.ceil(20 / Math.max(1, mentors.length)));
  const allItems = useMemo(() => {
    const arr: (MentorMember & { _key: string })[] = [];
    for (let r = 0; r < repeatCount; r++) {
      mentors.forEach((m, i) => {
        arr.push({ ...m, _key: `${m.id}-${r}-${i}` });
      });
    }
    return arr;
  }, [mentors, repeatCount]);

  // Measure width of one full set
  const [setWidth, setSetWidth] = useState(0);
  const measuredSetWidth = useRef(0);
  const onSetLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - measuredSetWidth.current) > 0.5) {
      measuredSetWidth.current = w;
      setSetWidth(w);
    }
  }, []);

  // posX is a native-driven Animated.Value. Autoplay animates it directly on
  // the UI thread (no per-frame JS/bridge traffic), and manual drag/momentum
  // write to it via PanResponder — the two never run at the same time, so
  // there's nothing for a touch gesture to compete with.
  const posX = useRef(new Animated.Value(0)).current;
  const posXNumeric = useRef(0);
  const dragStartValue = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasInitialized = useRef(false);
  const isDragging = useRef(false);

  const wrap = useCallback(
    (v: number) => {
      if (setWidth <= 0) return v;
      return ((v % setWidth) + setWidth) % setWidth;
    },
    [setWidth]
  );

  const stopLoop = useCallback(() => {
    animRef.current?.stop();
    animRef.current = null;
  }, []);

  const startLoop = useCallback(
    (fromValue: number) => {
      if (setWidth === 0 || !ready || isDragging.current) return;
      const speed = 1 / MS_PER_PX; // px per ms, same pace as before
      const remaining = direction === 'left' ? setWidth - fromValue : fromValue;
      const duration = Math.max(1, remaining / speed);
      const toValue = direction === 'left' ? setWidth : 0;

      const anim = Animated.timing(posX, {
        toValue,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      animRef.current = anim;
      anim.start(({ finished }) => {
        if (!finished) return;
        // Content is repeated, so wrapping the value here is visually seamless.
        const resetValue = direction === 'left' ? 0 : setWidth;
        posXNumeric.current = resetValue;
        posX.setValue(resetValue);
        startLoop(resetValue);
      });
    },
    [direction, posX, ready, setWidth]
  );

  // The PanResponder below is created once (via useRef) so its handlers must
  // not close over startLoop/stopLoop/wrap directly — those are recreated on
  // every render as setWidth/ready/direction settle in, and a handler frozen
  // at mount time would keep calling stale versions (e.g. one that still
  // thinks setWidth is 0) forever. Refs let the handlers always reach the
  // current logic.
  const startLoopRef = useRef(startLoop);
  useEffect(() => {
    startLoopRef.current = startLoop;
  }, [startLoop]);
  const stopLoopRef = useRef(stopLoop);
  useEffect(() => {
    stopLoopRef.current = stopLoop;
  }, [stopLoop]);
  const wrapRef = useRef(wrap);
  useEffect(() => {
    wrapRef.current = wrap;
  }, [wrap]);

  // Kick off autoplay once, at the right starting edge for this row's direction
  useEffect(() => {
    if (ready && setWidth > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const start = direction === 'left' ? 0 : setWidth;
      posXNumeric.current = start;
      posX.setValue(start);
      startLoop(start);
    }
    return () => stopLoop();
  }, [ready, setWidth, direction, startLoop, stopLoop, posX]);

  // ---------- Manual drag (PanResponder) + momentum ----------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        isDragging.current = true;
        stopLoopRef.current();
        posX.stopAnimation((v) => {
          posXNumeric.current = v;
          dragStartValue.current = v;
        });
      },
      onPanResponderMove: (_evt, g) => {
        const next = wrapRef.current(dragStartValue.current - g.dx);
        posXNumeric.current = next;
        posX.setValue(next);
      },
      onPanResponderRelease: (_evt, g) => {
        isDragging.current = false;
        Animated.decay(posX, {
          velocity: -g.vx,
          deceleration: 0.996,
          useNativeDriver: true,
        }).start(() => {
          posX.stopAnimation((v) => {
            const wrapped = wrapRef.current(v);
            posXNumeric.current = wrapped;
            posX.setValue(wrapped);
            startLoopRef.current(wrapped);
          });
        });
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        posX.stopAnimation((v) => {
          const wrapped = wrapRef.current(v);
          posXNumeric.current = wrapped;
          posX.setValue(wrapped);
          startLoopRef.current(wrapped);
        });
      },
    })
  ).current;

  // ---------- Pause on photo touch, resume on release ----------
  const onCardPressIn = useCallback(() => {
    isDragging.current = true;
    stopLoop();
  }, [stopLoop]);

  const onCardPressOut = useCallback(() => {
    isDragging.current = false;
    startLoop(posXNumeric.current);
  }, [startLoop]);

  const translateX = Animated.multiply(posX, -1);

  // ---------- Render ----------
  return (
    <View style={styles.rowClip}>
      <Animated.View
        style={[styles.rowInner, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* First set (used for measuring width) */}
        <View style={styles.rowInner} onLayout={onSetLayout}>
          {allItems.slice(0, mentors.length).map((item) => (
            <MentorCard
              key={item._key}
              item={item}
              imageHeight={imageHeight}
              aspectRatio={ratios[item.imageUrl] || DEFAULT_ASPECT}
              theme={theme}
              onPressIn={onCardPressIn}
              onPressOut={onCardPressOut}
            />
          ))}
        </View>
        {/* The rest of the repeated sets */}
        {allItems.slice(mentors.length).map((item) => (
          <MentorCard
            key={item._key}
            item={item}
            imageHeight={imageHeight}
            aspectRatio={ratios[item.imageUrl] || DEFAULT_ASPECT}
            theme={theme}
            onPressIn={onCardPressIn}
            onPressOut={onCardPressOut}
          />
        ))}
      </Animated.View>
    </View>
  );
});

export default function MentorWall({ mentors, theme }: MentorWallProps) {
  const [availableHeight, setAvailableHeight] = useState(0);
  const { ratios, ready } = useAspectRatios(mentors);

  const rows = useMemo(() => chunkIntoRows(mentors, ROWS), [mentors]);

  const rowSlotHeight = availableHeight > 0 ? Math.floor(availableHeight / ROWS) : 92;
  const baseImageHeight = Math.max(46, rowSlotHeight - NAME_HEIGHT - ROW_GAP);
  const imageHeight = baseImageHeight * SIZE_MULTIPLIER;

  const edgeColor = theme.bgGradient[0];

  return (
    <View
      style={styles.wallContainer}
      onLayout={(e: LayoutChangeEvent) => setAvailableHeight(e.nativeEvent.layout.height)}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rows.map((rowData, idx) => (
          <MentorRow
            key={`row-${idx}`}
            mentors={rowData}
            direction={idx % 2 === 0 ? 'left' : 'right'}
            imageHeight={imageHeight}
            theme={theme}
            ratios={ratios}
            ready={ready}
          />
        ))}
      </ScrollView>

      <LinearGradient
        pointerEvents="none"
        colors={[edgeColor, `${edgeColor}00`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edgeFade, { left: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${edgeColor}00`, edgeColor]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edgeFade, { right: 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wallContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  rowClip: {
    overflow: 'hidden',
    marginBottom: ROW_GAP,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardSlot: {
    alignItems: 'center',
    marginRight: CARD_GAP,
  },
  cardImageWrap: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
  },
});