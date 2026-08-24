import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { computeCardLayout, computeCardLayoutFromWidth } from '../constants/CardLayout';
import { COLORS } from '../constants/Colors';
import { AchievementId } from '../constants/Achievements';
import { DEFAULT_DIFFICULTY, DEFAULT_SUIT_COUNT, SUIT_COUNT_LABELS, SuitCount, clampDifficulty, clampSuitCount, difficultyLabel } from '../constants/Difficulty';
import { CardBackId, DEFAULT_CARD_BACK, DEFAULT_TABLE_THEME, TABLE_THEMES, TableThemeId } from '../constants/Themes';
import { gameService } from '../services/gameService';
import { GameState } from '../types/gameTypes';
import { achievementTitle, unlockAchievementsForWin } from '../utils/achievements';
import {
    loadCardBack,
    loadSoundEnabled,
    loadTableTheme,
    saveCardBack,
    saveSoundEnabled,
    saveTableTheme,
} from '../utils/appearance';
import { IMAGES, preloadImages } from '../utils/assets';
import { warmCardFaceCache } from '../utils/cardFaceCache';
import {
    loadLastDailyWinDate,
    loadPlayerStats,
    loadPreferredDifficulty,
    loadPreferredSuitCount,
    recordGameStarted,
    recordWin,
    savePreferredDifficulty,
    savePreferredSuitCount,
} from '../utils/playerStats';
import { computeScore, formatElapsed } from '../utils/score';
import { buildWinShareText, shareWin } from '../utils/shareWin';
import { initSounds, playSound, setSoundEnabled } from '../utils/sound';
import { DifficultyModal } from './DifficultyModal';
import { GameButton, GameButtonVariant } from './GameButton';
import { HelpModal } from './HelpModal';
import { HudStat } from './HudStat';
import { Pile, PileRef } from './Pile';
import { StatsModal } from './StatsModal';
import { StockPile } from './StockPile';
import { ThemeModal } from './ThemeModal';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';

const SPARKLE_COUNT = 8;
const SUIT_IMAGE_MAP: Record<string, any> = {
    spades: IMAGES.spades,
    clubs: IMAGES.clubs,
    hearts: IMAGES.hearts,
    diamonds: IMAGES.diamonds,
};
const SUIT_COLOR_MAP: Record<string, string> = {
    hearts: COLORS.hearts,
    diamonds: COLORS.diamonds,
    clubs: COLORS.clubs,
    spades: COLORS.spades,
};
const CARD_BACK_IMAGES: Record<CardBackId, number> = {
    classic: IMAGES.card_back,
    navy: IMAGES.card_back_navy,
    crimson: IMAGES.card_back_crimson,
};
const MAX_COMPLETED = 8;
const ICON_SPARKLE_COUNT = 6;
const CONGRATS_SPARKLE_COUNT = 20;
/** Delay between frames for normal moves (multi-step server animation). */
const MOVE_REPLAY_DELAY_MS = 90;
/** Solve can emit many steps; a bit slower makes each step visible (80ms often looks like a single jump). */
const SOLVE_REPLAY_DELAY_MS = 80;

function actionErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message.trim()) {
        const m = err.message.trim();
        return m.length > 180 ? `${m.slice(0, 177)}…` : m;
    }
    return fallback;
}

const BUTTON_DESCRIPTIONS: Record<string, string> = {
    new: 'Pick difficulty, suits, or play the daily deal',
    deal: 'Deal 1 card to each pile from the stock',
    hint: 'Highlight one legal move',
    solve: 'Auto-solve the game showing all moves',
    undo: 'Undo the last move you made',
    help: 'Read game rules and strategy tips',
};

export const GameBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isStartingNewGame, setIsStartingNewGame] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isSolving, setIsSolving] = useState<boolean>(false);
    const [isMovingCard, setIsMovingCard] = useState<boolean>(false);
    const [hoveredCard, setHoveredCard] = useState<{ pileIndex: number; cardIndex: number } | null>(null);
    const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
    const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
    const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
    const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
    const [tableTheme, setTableTheme] = useState<TableThemeId>(DEFAULT_TABLE_THEME);
    const [cardBack, setCardBack] = useState<CardBackId>(DEFAULT_CARD_BACK);
    const [soundOn, setSoundOn] = useState(true);
    const [difficulty, setDifficulty] = useState<number>(DEFAULT_DIFFICULTY);
    const [suitCount, setSuitCount] = useState<SuitCount>(DEFAULT_SUIT_COUNT);
    const [isDailyGame, setIsDailyGame] = useState(false);
    const [dailyCompleted, setDailyCompleted] = useState(false);
    const [dailyStreak, setDailyStreak] = useState(0);
    const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
    const [sharing, setSharing] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [winScore, setWinScore] = useState<number | null>(null);
    const [hintedCard, setHintedCard] = useState<{ pileIndex: number; cardIndex: number } | null>(null);
    const [expandedPileIndex, setExpandedPileIndex] = useState<number | null>(null);
    const pileRefs = useRef<(PileRef | null)[]>([]);
    const isMountedRef = useRef(true);
    const solveRunIdRef = useRef(0);
    const moveRunIdRef = useRef(0);
    const winRecordedRef = useRef(false);
    const difficultyRef = useRef(DEFAULT_DIFFICULTY);
    const isDailyRef = useRef(false);
    const usedUndoRef = useRef(false);
    const shareShotRef = useRef<ViewShotRef>(null);

    // Button tooltip state
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const tooltipOpacity = useRef(new Animated.Value(0)).current;
    const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [tableLayout, setTableLayout] = useState({ width: 0, height: 0 });
    const cardLayout = useMemo(() => {
        if (tableLayout.width > 0) {
            return computeCardLayoutFromWidth(
                tableLayout.width,
                tableLayout.height,
                screenWidth,
                screenHeight
            );
        }
        return computeCardLayout(screenWidth, screenHeight);
    }, [tableLayout.width, tableLayout.height, screenWidth, screenHeight]);

    useEffect(() => {
        warmCardFaceCache(cardLayout.cardWidth);
    }, [cardLayout.cardWidth]);

    // Completion animation state
    const [animatingSuit, setAnimatingSuit] = useState<string | null>(null);
    const prevCompletedRef = useRef<Record<number, number>>({});
    const animationQueueRef = useRef<string[]>([]);
    const isAnimatingRef = useRef(false);

    // Animated values
    const centerScale = useRef(new Animated.Value(0)).current;
    const centerOpacity = useRef(new Animated.Value(0)).current;
    const moveTranslateX = useRef(new Animated.Value(0)).current;
    const moveTranslateY = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const sparkleRadius = useRef(new Animated.Value(0)).current;
    const sparkleOpacities = useRef(
        (() => { const arr: Animated.Value[] = []; for (let i = 0; i < SPARKLE_COUNT; i++) arr.push(new Animated.Value(0)); return arr; })()
    ).current;

    // Completed suit icons displayed above bottom bar
    const [completedIcons, setCompletedIcons] = useState<string[]>([]);
    const iconScales = useRef(
        (() => { const arr: Animated.Value[] = []; for (let i = 0; i < MAX_COMPLETED; i++) arr.push(new Animated.Value(0)); return arr; })()
    ).current;
    const iconGlows = useRef(
        (() => { const arr: Animated.Value[] = []; for (let i = 0; i < MAX_COMPLETED; i++) arr.push(new Animated.Value(0)); return arr; })()
    ).current;
    // Per-icon sparkle particles (ICON_SPARKLE_COUNT per icon slot)
    const iconSparkleOpacities = useRef(
        (() => {
            const outer: Animated.Value[][] = [];
            for (let i = 0; i < MAX_COMPLETED; i++) {
                const inner: Animated.Value[] = [];
                for (let j = 0; j < ICON_SPARKLE_COUNT; j++) inner.push(new Animated.Value(0));
                outer.push(inner);
            }
            return outer;
        })()
    ).current;
    const iconSparkleRadii = useRef(
        (() => { const arr: Animated.Value[] = []; for (let i = 0; i < MAX_COMPLETED; i++) arr.push(new Animated.Value(0)); return arr; })()
    ).current;

    // Congratulations screen state
    const [showCongrats, setShowCongrats] = useState(false);
    const showCongratsRef = useRef(false);
    const congratsOpacity = useRef(new Animated.Value(0)).current;
    const congratsTextScale = useRef(new Animated.Value(0)).current;
    const congratsMovesOpacity = useRef(new Animated.Value(0)).current;
    const congratsButtonOpacity = useRef(new Animated.Value(0)).current;
    const congratsSuitScales = useRef(
        (() => { const arr: Animated.Value[] = []; for (let i = 0; i < 4; i++) arr.push(new Animated.Value(0)); return arr; })()
    ).current;
    const congratsSparkleAnims = useRef(
        (() => {
            const arr: { opacity: Animated.Value; translateX: Animated.Value; translateY: Animated.Value }[] = [];
            for (let i = 0; i < CONGRATS_SPARKLE_COUNT; i++) {
                arr.push({
                    opacity: new Animated.Value(0),
                    translateX: new Animated.Value(0),
                    translateY: new Animated.Value(0),
                });
            }
            return arr;
        })()
    ).current;

    useEffect(() => {
        difficultyRef.current = difficulty;
    }, [difficulty]);

    useEffect(() => {
        const initGame = async () => {
            try {
                setLoading(true);
                await preloadImages();
                await initSounds();
                const [preferred, preferredSuits, lastDailyWin, savedTable, savedBack, savedSound, stats] = await Promise.all([
                    loadPreferredDifficulty(),
                    loadPreferredSuitCount(),
                    loadLastDailyWinDate(),
                    loadTableTheme(),
                    loadCardBack(),
                    loadSoundEnabled(),
                    loadPlayerStats(),
                ]);
                if (!isMountedRef.current) return;
                setTableTheme(savedTable);
                setCardBack(savedBack);
                setSoundOn(savedSound);
                setSoundEnabled(savedSound);
                setDifficulty(preferred);
                difficultyRef.current = preferred;
                setSuitCount(preferredSuits);
                setDailyCompleted(lastDailyWin === new Date().toISOString().slice(0, 10));
                setDailyStreak(stats.dailyCurrentStreak ?? 0);
                const state = await gameService.startNewGame(preferred, { suitCount: preferredSuits });
                if (!isMountedRef.current) return;
                setGameState(state[0]);
                setElapsedSeconds(0);
                setTimerRunning(true);
                winRecordedRef.current = false;
                setWinScore(null);
                setIsDailyGame(false);
                isDailyRef.current = false;
                setHintedCard(null);
                usedUndoRef.current = false;
                setNewAchievements([]);
                void recordGameStarted();
                setError(null);
            } catch (err) {
                if (isMountedRef.current) {
                    setError('Failed to initialize game');
                }
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };
        initGame();
    }, []);

    // Strict Mode runs mount → unmount → mount; without resetting refs, cleanup leaves
    // isMountedRef false forever and move/solve think every run was cancelled.
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            solveRunIdRef.current += 1;
            moveRunIdRef.current += 1;
        };
    }, []);

    const isRunActive = (runId: number, runRef: React.MutableRefObject<number>) => {
        return runId === runRef.current && isMountedRef.current;
    };

    const playStateSequence = async (
        states: GameState[],
        runId: number,
        runRef: React.MutableRefObject<number>,
        delayMs: number = MOVE_REPLAY_DELAY_MS
    ): Promise<boolean> => {
        if (!states || states.length === 0) return false;
        if (!isRunActive(runId, runRef)) return false;

        if (states.length === 1) {
            setGameState(states[0]);
            return true;
        }

        for (let i = 0; i < states.length; i++) {
            if (!isRunActive(runId, runRef)) return false;
            setGameState(states[i]);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        return true;
    };

    // Start the next animation from the queue
    const startNextAnimation = () => {
        if (isAnimatingRef.current || animationQueueRef.current.length === 0) return;

        const suit = animationQueueRef.current[0];
        isAnimatingRef.current = true;
        setAnimatingSuit(suit);

        const { width, height } = Dimensions.get('window');

        // Reset all animated values
        centerScale.setValue(0);
        centerOpacity.setValue(0);
        moveTranslateX.setValue(0);
        moveTranslateY.setValue(0);
        glowOpacity.setValue(0);
        sparkleRadius.setValue(0);
        sparkleOpacities.forEach(function (o: Animated.Value) { o.setValue(0); });

        // Phase 1: Appear with bounce
        const appearAnim = Animated.parallel([
            Animated.timing(centerOpacity, {
                toValue: 1, duration: 300, useNativeDriver: true,
            }),
            Animated.spring(centerScale, {
                toValue: 1, friction: 4, tension: 40, useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 1, duration: 400, useNativeDriver: true,
            }),
        ]);

        // Phase 2: Sparkle burst + pulse
        const sparkleAnims = Animated.stagger(60,
            sparkleOpacities.map(function (opacity: Animated.Value) {
                return Animated.sequence([
                    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]);
            })
        );

        const sparkleExpandAnim = Animated.timing(sparkleRadius, {
            toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        });

        const pulseAnim = Animated.sequence([
            Animated.timing(centerScale, { toValue: 1.3, duration: 250, useNativeDriver: true }),
            Animated.timing(centerScale, { toValue: 1.0, duration: 250, useNativeDriver: true }),
            Animated.timing(centerScale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.timing(centerScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
        ]);

        const glowPulseAnim = Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 250, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.5, duration: 200, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]);

        // Phase 3: Fly to completed icons area (bottom-center, above button bar)
        const targetX = 0;
        const targetY = height * 0.38;

        const moveAnim = Animated.parallel([
            Animated.timing(centerScale, {
                toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(moveTranslateX, {
                toValue: targetX, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(moveTranslateY, {
                toValue: targetY, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(centerOpacity, {
                toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 0, duration: 600, useNativeDriver: true,
            }),
        ]);

        // Run the full sequence
        Animated.sequence([
            appearAnim,
            Animated.parallel([
                sparkleAnims,
                sparkleExpandAnim,
                pulseAnim,
                glowPulseAnim,
            ]),
            Animated.delay(100),
            moveAnim,
        ]).start(function () {
            var completedSuit = animationQueueRef.current[0];
            animationQueueRef.current.shift();
            isAnimatingRef.current = false;
            setAnimatingSuit(null);

            // Add icon to completed row and animate entrance
            setCompletedIcons(function (prev) {
                var newIcons = prev.concat([completedSuit]);
                var idx = newIcons.length - 1;
                animateIconEntrance(idx, completedSuit);

                // Show congratulations when all 8 suits are completed
                if (newIcons.length === MAX_COMPLETED) {
                    setTimeout(function () { showCongratsScreen(); }, 1200);
                }

                return newIcons;
            });

            startNextAnimation();
        });
    };

    // Animate a single icon entrance in the completed icons row
    const animateIconEntrance = (index: number, _suit: string) => {
        iconScales[index].setValue(0);
        iconGlows[index].setValue(0);
        iconSparkleRadii[index].setValue(0);
        iconSparkleOpacities[index].forEach(function (o: Animated.Value) { o.setValue(0); });

        Animated.parallel([
            // Scale bounce in
            Animated.sequence([
                Animated.spring(iconScales[index], {
                    toValue: 1.5, friction: 3, tension: 40, useNativeDriver: true,
                }),
                Animated.spring(iconScales[index], {
                    toValue: 1.0, friction: 5, useNativeDriver: true,
                }),
            ]),
            // Glow pulse
            Animated.sequence([
                Animated.timing(iconGlows[index], { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(iconGlows[index], { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            // Sparkle burst
            Animated.stagger(50,
                iconSparkleOpacities[index].map(function (opacity: Animated.Value) {
                    return Animated.sequence([
                        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ]);
                })
            ),
            Animated.timing(iconSparkleRadii[index], {
                toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
        ]).start();
    };

    // Show the congratulations screen with sequenced animations
    const showCongratsScreen = () => {
        showCongratsRef.current = true;
        setShowCongrats(true);
        setTimerRunning(false);

        // Reset all congrats animated values
        congratsOpacity.setValue(0);
        congratsTextScale.setValue(0);
        congratsMovesOpacity.setValue(0);
        congratsButtonOpacity.setValue(0);
        congratsSuitScales.forEach(function (s: Animated.Value) { s.setValue(0); });

        // Run the entrance sequence
        Animated.sequence([
            // Dark overlay fades in
            Animated.timing(congratsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            // "Congratulations!" bounces in
            Animated.spring(congratsTextScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
            // Moves text fades in
            Animated.timing(congratsMovesOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            // 4 suit icons bounce in one by one
            Animated.stagger(200,
                congratsSuitScales.map(function (s: Animated.Value) {
                    return Animated.spring(s, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true });
                })
            ),
            // New Game button fades in
            Animated.timing(congratsButtonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();

        // Start continuous floating sparkles
        startCongratsSparkles();
    };

    // Continuous floating sparkle particles for congrats screen
    const startCongratsSparkles = () => {
        const { width } = Dimensions.get('window');

        congratsSparkleAnims.forEach(function (sparkle, i) {
            var baseDelay = i * 120;

            var animateOne = function () {
                if (!showCongratsRef.current) return;

                var startX = (Math.random() - 0.5) * width * 0.9;
                var startY = 120 + Math.random() * 80;
                var endY = -(120 + Math.random() * 80);
                var driftX = (Math.random() - 0.5) * 60;

                sparkle.opacity.setValue(0);
                sparkle.translateX.setValue(startX);
                sparkle.translateY.setValue(startY);

                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(sparkle.opacity, { toValue: 0.9, duration: 200, useNativeDriver: true }),
                        Animated.delay(800),
                        Animated.timing(sparkle.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                    ]),
                    Animated.timing(sparkle.translateY, {
                        toValue: endY, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true,
                    }),
                    Animated.timing(sparkle.translateX, {
                        toValue: startX + driftX, duration: 1500, useNativeDriver: true,
                    }),
                ]).start(function () { animateOne(); });
            };

            setTimeout(animateOne, baseDelay);
        });
    };

    useEffect(() => {
        if (!timerRunning || showCongratsRef.current) return;
        const id = setInterval(() => {
            if (showCongratsRef.current) return;
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(id);
    }, [timerRunning, showCongrats]);

    // Dismiss congrats and open difficulty picker for next game
    const dismissCongratsAndNewGame = () => {
        showCongratsRef.current = false;
        Animated.timing(congratsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(function () {
            setShowCongrats(false);
            setShowDifficultyModal(true);
        });
    };

    // Record win once when congrats appears (moves + elapsed at that moment)
    useEffect(() => {
        if (!showCongrats || !gameState || winRecordedRef.current) return;
        winRecordedRef.current = true;
        const score = computeScore(gameState.moves, elapsedSeconds);
        setWinScore(score);
        void (async () => {
            const stats = await recordWin({
                moves: gameState.moves,
                elapsedSeconds,
                score,
                difficulty: difficultyRef.current,
                isDaily: isDailyRef.current,
            });
            setDailyStreak(stats.dailyCurrentStreak ?? 0);
            const unlocked = await unlockAchievementsForWin({
                isDaily: isDailyRef.current,
                dailyStreak: stats.dailyCurrentStreak ?? 0,
                difficulty: difficultyRef.current,
                usedUndo: usedUndoRef.current,
            });
            if (isMountedRef.current) {
                setNewAchievements(unlocked);
            }
        })();
        if (isDailyRef.current) {
            setDailyCompleted(true);
        }
    }, [showCongrats, gameState, elapsedSeconds]);

    // Detect newly completed sequences
    useEffect(function () {
        if (!gameState) return;

        var currentCompleted = gameState.completedSequencesBySuit;
        var prevCompleted = prevCompletedRef.current;
        var suitMap: Record<number, string> = {
            1: 'spades', 2: 'clubs', 3: 'hearts', 4: 'diamonds'
        };

        var newlyCompleted: string[] = [];
        var anyDecreased = false;

        [1, 2, 3, 4].forEach(function (suitNum) {
            var curr = currentCompleted[suitNum] || 0;
            var prev = prevCompleted[suitNum] || 0;
            if (curr < prev) anyDecreased = true;
            if (curr > prev) {
                var suitName = suitMap[suitNum];
                if (suitName) {
                    for (var i = 0; i < curr - prev; i++) {
                        newlyCompleted.push(suitName);
                    }
                }
            }
        });

        prevCompletedRef.current = {};
        [1, 2, 3, 4].forEach(function (k) {
            prevCompletedRef.current[k] = currentCompleted[k] || 0;
        });

        // On decrease (new game / undo), rebuild icons instantly without animation
        if (anyDecreased) {
            var icons: string[] = [];
            [1, 2, 3, 4].forEach(function (suitNum) {
                var count = currentCompleted[suitNum] || 0;
                var suitName = suitMap[suitNum];
                if (suitName) {
                    for (var j = 0; j < count; j++) icons.push(suitName);
                }
            });
            setCompletedIcons(icons);
            icons.forEach(function (_: string, idx: number) { iconScales[idx].setValue(1); iconGlows[idx].setValue(0); });
            for (var k = icons.length; k < MAX_COMPLETED; k++) { iconScales[k].setValue(0); iconGlows[k].setValue(0); }
            // Dismiss congrats if showing
            if (showCongratsRef.current) {
                showCongratsRef.current = false;
                setShowCongrats(false);
            }
            return;
        }

        if (newlyCompleted.length === 0) return;

        playSound('complete');
        newlyCompleted.forEach(function (s) {
            animationQueueRef.current.push(s);
        });
        startNextAnimation();
    }, [gameState]);

    const isBusy = loading || isStartingNewGame || isSolving || isMovingCard;

    const handleDealCards = async () => {
        if (!gameState || isBusy) return;

        setIsMovingCard(true);
        try {
            const newState = await gameService.dealCards();
            playSound('deal');
            setGameState(newState[0]);
            setActionError(null);
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Deal failed. Please try again.'));
        } finally {
            setIsMovingCard(false);
        }
    };

    const handleUndo = async () => {
        if (!gameState || isBusy) return;

        setIsMovingCard(true);
        try {
            const newState = await gameService.undoMove();
            usedUndoRef.current = true;
            setGameState(newState[0]);
            setActionError(null);
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Undo failed. Please try again.'));
        } finally {
            setIsMovingCard(false);
        }
    };

    const startGameWithDifficulty = async (
        nextDifficulty: number,
        nextSuitCount: SuitCount = suitCount,
        options?: { seed?: number; isDaily?: boolean }
    ) => {
        if (isStartingNewGame) return;
        const clamped = clampDifficulty(nextDifficulty);
        const suits = clampSuitCount(nextSuitCount);

        try {
            solveRunIdRef.current += 1;
            moveRunIdRef.current += 1;
            setIsSolving(false);
            setIsMovingCard(false);
            setIsStartingNewGame(true);
            setActionError(null);
            setHintedCard(null);
            usedUndoRef.current = false;
            setNewAchievements([]);
            setDifficulty(clamped);
            difficultyRef.current = clamped;
            setSuitCount(suits);
            setIsDailyGame(Boolean(options?.isDaily));
            isDailyRef.current = Boolean(options?.isDaily);
            if (!options?.isDaily) {
                await savePreferredDifficulty(clamped);
                await savePreferredSuitCount(suits);
            }
            const newState = await gameService.startNewGame(clamped, {
                suitCount: suits,
                seed: options?.seed,
            });
            setGameState(newState[0]);
            setElapsedSeconds(0);
            setTimerRunning(true);
            winRecordedRef.current = false;
            setWinScore(null);
            void recordGameStarted();
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Failed to start a new game.'));
        } finally {
            setIsStartingNewGame(false);
        }
    };

    const handleNewGame = () => {
        if (isBusy) return;
        setShowDifficultyModal(true);
    };

    const handleDifficultySelect = (selected: number, selectedSuits: SuitCount) => {
        void startGameWithDifficulty(selected, selectedSuits);
    };

    const handleDailySelect = async () => {
        try {
            const daily = await gameService.getDailyChallenge();
            await startGameWithDifficulty(
                daily.difficulty,
                clampSuitCount(daily.suit_count),
                { seed: daily.seed, isDaily: true }
            );
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Could not load the daily challenge.'));
        }
    };

    const handleHint = async () => {
        if (!gameState || isBusy) return;
        try {
            const hint = await gameService.getHint();
            if (hint.from_row == null || hint.from_col == null) {
                setHintedCard(null);
                setActionError(hint.message || 'No moves right now — try Deal.');
                return;
            }
            setActionError(null);
            setHintedCard({
                pileIndex: hint.from_col,
                cardIndex: Math.max(0, hint.from_row - 1),
            });
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Hint failed. Please try again.'));
        }
    };

    const handleCardPress = async (pileIndex: number, cardIndex: number) => {
        if (!gameState || isBusy) return;

        const runId = moveRunIdRef.current + 1;
        moveRunIdRef.current = runId;
        setIsMovingCard(true);
        setActionError(null);
        setHintedCard(null);

        try {
            // For Spider Solitaire, we typically move the card and all cards below it
            // to the first valid destination pile we find
            const fromRow = gameState.piles[pileIndex].lastCardIndex - (gameState.piles[pileIndex].cards.length - cardIndex - 1);
            const fromCol = pileIndex;

            const newStates = await gameService.makeMove(
                fromRow,
                fromCol,
                undefined, // toRow will be determined by the backend
                undefined,
            );

            playSound('flip');
            await playStateSequence(newStates, runId, moveRunIdRef);
        } catch (err) {
            if (isRunActive(runId, moveRunIdRef)) {
                setActionError(actionErrorMessage(err, 'Move failed. Please try another move.'));
            }
        } finally {
            setHoveredCard(null);
            if (isRunActive(runId, moveRunIdRef)) {
                setIsMovingCard(false);
            }
        }
    };

    const handleCardHover = (pileIndex: number, cardIndex: number, isHovered: boolean) => {
        if (isHovered) {
            setHoveredCard({ pileIndex, cardIndex });
        } else if (hoveredCard && hoveredCard.pileIndex === pileIndex && hoveredCard.cardIndex === cardIndex) {
            setHoveredCard(null);
        }
    };

    const handleSolve = async () => {
        if (isBusy) return;

        const runId = solveRunIdRef.current + 1;
        solveRunIdRef.current = runId;
        moveRunIdRef.current += 1;
        setIsMovingCard(false);
        setIsSolving(true);
        setActionError(null);

        try {
            const newStates = await gameService.solveGame();
            await playStateSequence(newStates, runId, solveRunIdRef, SOLVE_REPLAY_DELAY_MS);
        } catch (err) {
            if (isRunActive(runId, solveRunIdRef)) {
                setActionError(actionErrorMessage(err, 'Solve failed. Please try again.'));
            }
        } finally {
            if (isRunActive(runId, solveRunIdRef)) {
                setIsSolving(false);
            }
        }
    };

    const handleHelp = () => {
        setShowHelpModal(true);
    };

    const handleSelectTable = (id: TableThemeId) => {
        setTableTheme(id);
        void saveTableTheme(id);
    };

    const handleSelectCardBack = (id: CardBackId) => {
        setCardBack(id);
        void saveCardBack(id);
    };

    const handleToggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundEnabled(next);
        void saveSoundEnabled(next);
    };

    const handleShareWin = async () => {
        if (!gameState || sharing) return;
        setSharing(true);
        const score = winScore != null ? winScore : computeScore(gameState.moves, elapsedSeconds);
        const message = buildWinShareText({
            moves: gameState.moves,
            time: formatElapsed(elapsedSeconds),
            score,
            label: `${difficultyLabel(difficulty)} · ${SUIT_COUNT_LABELS[suitCount]}`,
            isDaily: isDailyGame,
        });
        let imageUri: string | null = null;
        try {
            imageUri = (await shareShotRef.current?.capture?.()) ?? null;
        } catch {
            imageUri = null;
        }
        try {
            await shareWin({ message, imageUri });
        } catch {
            setActionError('Could not open the share sheet.');
        } finally {
            setSharing(false);
        }
    };

    const activeTable = TABLE_THEMES[tableTheme];

    const showTooltip = (key: string) => {
        if (tooltipHideTimer.current) {
            clearTimeout(tooltipHideTimer.current);
            tooltipHideTimer.current = null;
        }
        setActiveTooltip(key);
        Animated.timing(tooltipOpacity, {
            toValue: 1, duration: 150, useNativeDriver: true,
        }).start();
    };

    const hideTooltip = () => {
        tooltipHideTimer.current = setTimeout(() => {
            Animated.timing(tooltipOpacity, {
                toValue: 0, duration: 200, useNativeDriver: true,
            }).start(() => {
                setActiveTooltip(null);
            });
            tooltipHideTimer.current = null;
        }, 800);
    };

    const handleOutsideClick = () => {
        // Collapse all expanded piles
        pileRefs.current.forEach(pileRef => {
            if (pileRef) {
                pileRef.collapseExpansion();
            }
        });
        setExpandedPileIndex(null);
    };

    const handlePileExpansionChange = (pileIndex: number | null) => {
        setExpandedPileIndex(pileIndex);
    };

    const handleTouchEvent = (targetPileIndex: number | null) => {
        // If there's an expanded pile and the touch is not on that pile, collapse it
        if (expandedPileIndex !== null && expandedPileIndex !== targetPileIndex) {
            pileRefs.current.forEach(pileRef => {
                if (pileRef) {
                    pileRef.collapseExpansion();
                }
            });
            setExpandedPileIndex(null);
        }
    };


    if (loading || isStartingNewGame) {
        return (
            <View style={[styles.container, styles.center, styles.loadingScreen]}>
                <ActivityIndicator size="large" color={COLORS.brassLight} />
                <Text style={styles.loadingText}>Shuffling the deck...</Text>
            </View>
        );
    }

    const handleRetry = async () => {
        try {
            setError(null);
            setLoading(true);
            const preferred = await loadPreferredDifficulty();
            const preferredSuits = await loadPreferredSuitCount();
            setDifficulty(preferred);
            difficultyRef.current = preferred;
            setSuitCount(preferredSuits);
            setIsDailyGame(false);
            isDailyRef.current = false;
            setHintedCard(null);
            usedUndoRef.current = false;
            const state = await gameService.startNewGame(preferred, { suitCount: preferredSuits });
            setGameState(state[0]);
            setElapsedSeconds(0);
            setTimerRunning(true);
            winRecordedRef.current = false;
            setWinScore(null);
            void recordGameStarted();
        } catch (err) {
            setError('Failed to load game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!gameState) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>Game failed to load</Text>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
            <ImageBackground
                source={IMAGES.background}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.gameLayout}>
                <View style={styles.vignetteOverlay} pointerEvents="none" />
                <View style={[styles.feltTint, { backgroundColor: activeTable.feltTint }]} pointerEvents="none" />

                <View style={styles.logoContainer}>
                    <Image
                        source={IMAGES.background_logo}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.hudFrame}>
                    <View style={styles.hudInner}>
                        <HudStat label="MOVES" value={gameState.moves} accent />
                        <View style={styles.hudDivider} />
                        <HudStat label="TIME" value={formatElapsed(elapsedSeconds)} accent />
                        <View style={styles.hudDivider} />
                        <View style={styles.hudStock}>
                            <Text style={styles.hudStockLabel}>STOCK</Text>
                            <StockPile
                                drawsRemaining={gameState.drawsRemaining}
                                cardBackSource={CARD_BACK_IMAGES[cardBack]}
                            />
                        </View>
                        <View style={styles.hudDivider} />
                        <HudStat
                            label="COMPLETE"
                            value={gameState.completedSequences}
                            suffix="/8"
                            accent={gameState.completedSequences > 0}
                        />
                    </View>
                    <View style={styles.hudMetaRow}>
                        <TouchableOpacity
                            onPress={() => !isBusy && setShowDifficultyModal(true)}
                            disabled={isBusy}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.hudMetaText}>
                                {isDailyGame ? 'Daily · ' : ''}{difficultyLabel(difficulty)} · {SUIT_COUNT_LABELS[suitCount]}
                                {dailyStreak > 0 ? ` · 🔥 ${dailyStreak}` : ''}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.hudMetaLinks}>
                            <TouchableOpacity
                                onPress={() => setShowStatsModal(true)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.hudMetaLink}>Stats</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowThemeModal(true)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.hudMetaLink}>Look</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.tableFrame}>
                    <View
                        style={[
                            styles.tableInner,
                            {
                                backgroundColor: activeTable.felt,
                                borderColor: activeTable.feltLight,
                            },
                        ]}
                        onLayout={(e) => {
                            const { width, height } = e.nativeEvent.layout;
                            if (width > 0 && height > 0) {
                                setTableLayout({ width, height });
                            }
                        }}
                    >
                        <View style={styles.pilesContainer}>
                            {gameState.piles.map((pile, pileIndex) => (
                                <View
                                    key={pileIndex}
                                    style={[
                                        styles.pileSlot,
                                        {
                                            width: cardLayout.cardWidth,
                                            minHeight: tableLayout.height > 0 ? tableLayout.height : undefined,
                                        },
                                    ]}
                                >
                                <Pile
                                    key={`${gameState.sessionId ?? 'game'}-${pileIndex}`}
                                    ref={(ref) => {
                                        pileRefs.current[pileIndex] = ref;
                                    }}
                                    cards={pile.cards}
                                    pileIndex={pileIndex}
                                    cardWidth={cardLayout.cardWidth}
                                    columnHeight={tableLayout.height}
                                    hoveredCard={hoveredCard}
                                    hintedCard={hintedCard}
                                    cardBackId={cardBack}
                                    emptySlotColor={activeTable.emptySlot}
                                    emptySlotBorder={activeTable.emptySlotBorder}
                                    onCardPress={handleCardPress}
                                    onCardHover={handleCardHover}
                                    onExpansionChange={handlePileExpansionChange}
                                    onTouchEvent={handleTouchEvent}
                                />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Completed suit icons above button bar */}
                {completedIcons.length > 0 && (
                    <View style={styles.completedTray}>
                        {completedIcons.map(function (suit: string, index: number) {
                            return (
                                <Animated.View key={index} style={[
                                    styles.completedIconWrapper,
                                    { transform: [{ scale: iconScales[index] }] },
                                ]}>
                                    {/* Icon glow */}
                                    <Animated.View style={[
                                        styles.iconGlow,
                                        {
                                            opacity: iconGlows[index],
                                            backgroundColor: SUIT_COLOR_MAP[suit] || '#FFD700',
                                        },
                                    ]} />

                                    {/* Suit image with matching color */}
                                    <Image
                                        source={SUIT_IMAGE_MAP[suit]}
                                        style={[styles.completedIconImage, { tintColor: SUIT_COLOR_MAP[suit] }]}
                                    />

                                    {/* Per-icon sparkles */}
                                    {iconSparkleOpacities[index].map(function (opacity: Animated.Value, j: number) {
                                        var angle = (j * 2 * Math.PI) / ICON_SPARKLE_COUNT;
                                        var endX = Math.cos(angle) * 22;
                                        var endY = Math.sin(angle) * 22;
                                        return (
                                            <Animated.View
                                                key={j}
                                                style={[
                                                    styles.iconSparkle,
                                                    {
                                                        opacity: opacity,
                                                        backgroundColor: SUIT_COLOR_MAP[suit] || '#FFD700',
                                                        transform: [
                                                            {
                                                                translateX: iconSparkleRadii[index].interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, endX],
                                                                }),
                                                            },
                                                            {
                                                                translateY: iconSparkleRadii[index].interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, endY],
                                                                }),
                                                            },
                                                        ],
                                                    },
                                                ]}
                                            />
                                        );
                                    })}
                                </Animated.View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.actionBarFrame}>
                    <View style={styles.buttonBar}>
                    {([
                        { key: 'new' as const, variant: 'new' as GameButtonVariant, icon: '＋', label: 'New', onPress: handleNewGame, disabled: isBusy },
                        { key: 'deal', variant: 'deal' as GameButtonVariant, icon: '▤', label: 'Deal', onPress: handleDealCards, disabled: isBusy },
                        { key: 'hint', variant: 'hint' as GameButtonVariant, icon: '?', label: 'Hint', onPress: handleHint, disabled: isBusy },
                        { key: 'solve', variant: 'solve' as GameButtonVariant, icon: '★', label: isSolving ? 'Busy' : 'Solve', onPress: handleSolve, disabled: isBusy },
                        { key: 'undo', variant: 'undo' as GameButtonVariant, icon: '↩', label: 'Undo', onPress: handleUndo, disabled: isBusy },
                        { key: 'help', variant: 'help' as GameButtonVariant, icon: 'i', label: 'Help', onPress: handleHelp, disabled: isBusy },
                    ]).map((btn) => (
                        <View key={btn.key} style={styles.buttonWrapper}>
                            {activeTooltip === btn.key && (
                                <Animated.View style={[styles.tooltipContainer, { opacity: tooltipOpacity }]} pointerEvents="none">
                                    <View style={styles.tooltipBubble}>
                                        <Text style={styles.tooltipText}>{BUTTON_DESCRIPTIONS[btn.key]}</Text>
                                    </View>
                                    <View style={styles.tooltipArrow} />
                                </Animated.View>
                            )}
                            <GameButton
                                variant={btn.variant}
                                label={btn.label}
                                icon={btn.icon}
                                onPress={btn.onPress}
                                onPressIn={() => showTooltip(btn.key)}
                                onPressOut={hideTooltip}
                                disabled={btn.disabled}
                            />
                        </View>
                    ))}
                    </View>
                </View>
                {actionError && (
                    <View style={styles.inlineErrorContainer}>
                        <Text style={styles.inlineErrorText}>{actionError}</Text>
                    </View>
                )}

                {/* Completion celebration animation */}
                {animatingSuit && (
                    <View style={styles.animationOverlay} pointerEvents="none">
                        <Animated.View
                            style={[
                                styles.animationContainer,
                                {
                                    opacity: centerOpacity,
                                    transform: [
                                        { translateX: moveTranslateX },
                                        { translateY: moveTranslateY },
                                        { scale: centerScale },
                                    ],
                                },
                            ]}
                        >
                            {/* Glow circle */}
                            <Animated.View
                                style={[
                                    styles.glowCircle,
                                    { opacity: glowOpacity },
                                ]}
                            />

                            {/* Suit image */}
                            <Image
                                source={SUIT_IMAGE_MAP[animatingSuit]}
                                style={[styles.animatedSuitImage, { tintColor: SUIT_COLOR_MAP[animatingSuit] || 'white' }]}
                            />

                            {/* Sparkle particles */}
                            {sparkleOpacities.map(function (opacity: Animated.Value, i: number) {
                                var angle = (i * 2 * Math.PI) / SPARKLE_COUNT;
                                var endX = Math.cos(angle) * 70;
                                var endY = Math.sin(angle) * 70;

                                return (
                                    <Animated.View
                                        key={i}
                                        style={[
                                            styles.sparkle,
                                            {
                                                opacity: opacity,
                                                transform: [
                                                    {
                                                        translateX: sparkleRadius.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, endX],
                                                        }),
                                                    },
                                                    {
                                                        translateY: sparkleRadius.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, endY],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </Animated.View>
                    </View>
                )}

                <HelpModal
                    visible={showHelpModal}
                    onClose={() => setShowHelpModal(false)}
                />

                <DifficultyModal
                    visible={showDifficultyModal}
                    onClose={() => setShowDifficultyModal(false)}
                    onDifficultySelect={handleDifficultySelect}
                    onDailySelect={() => { void handleDailySelect(); }}
                    currentDifficulty={difficulty}
                    currentSuitCount={suitCount}
                    dailyCompleted={dailyCompleted}
                />

                <StatsModal
                    visible={showStatsModal}
                    onClose={() => setShowStatsModal(false)}
                />

                <ThemeModal
                    visible={showThemeModal}
                    onClose={() => setShowThemeModal(false)}
                    tableTheme={tableTheme}
                    cardBack={cardBack}
                    soundEnabled={soundOn}
                    onSelectTable={handleSelectTable}
                    onSelectCardBack={handleSelectCardBack}
                    onToggleSound={handleToggleSound}
                />

                {/* Congratulations overlay */}
                {showCongrats && (
                    <Animated.View style={[styles.congratsOverlay, { opacity: congratsOpacity }]}>
                        {/* Floating sparkle particles */}
                        {congratsSparkleAnims.map(function (sparkle, i) {
                            return (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.congratsSparkle,
                                        {
                                            opacity: sparkle.opacity,
                                            transform: [
                                                { translateX: sparkle.translateX },
                                                { translateY: sparkle.translateY },
                                            ],
                                        },
                                    ]}
                                />
                            );
                        })}

                        {/* Congratulations text */}
                        <Animated.Text style={[
                            styles.congratsTitle,
                            { transform: [{ scale: congratsTextScale }] },
                        ]}>
                            Congratulations!
                        </Animated.Text>

                        {/* Moves / time / score */}
                        <ViewShot
                            ref={shareShotRef}
                            options={{ format: 'png', quality: 0.92, result: 'tmpfile' }}
                            style={styles.shareCard}
                        >
                            <Text style={styles.shareCardBrand}>proAmazingSpider</Text>
                            <Animated.View style={[styles.congratsStatsBlock, { opacity: congratsMovesOpacity }]}>
                                <Text style={styles.congratsMoves}>
                                    {gameState.moves} moves · {formatElapsed(elapsedSeconds)}
                                </Text>
                                <Text style={styles.congratsScore}>
                                    Score {winScore != null ? winScore : computeScore(gameState.moves, elapsedSeconds)}
                                </Text>
                                <Text style={styles.congratsDiff}>
                                    {isDailyGame ? 'Daily · ' : ''}{difficultyLabel(difficulty)} · {SUIT_COUNT_LABELS[suitCount]}
                                    {isDailyGame && dailyStreak > 0 ? ` · 🔥 ${dailyStreak}` : ''}
                                </Text>
                            </Animated.View>
                        </ViewShot>

                        {newAchievements.length > 0 ? (
                            <View style={styles.unlockRow}>
                                {newAchievements.map((id) => (
                                    <Text key={id} style={styles.unlockText}>
                                        ★ {achievementTitle(id)}
                                    </Text>
                                ))}
                            </View>
                        ) : null}

                        {/* Suit icons row */}
                        <View style={styles.congratsSuitsRow}>
                            {['spades', 'clubs', 'hearts', 'diamonds'].map(function (suit, i) {
                                return (
                                    <Animated.View key={suit} style={[
                                        styles.congratsSuitWrapper,
                                        { transform: [{ scale: congratsSuitScales[i] }] },
                                    ]}>
                                        <Image
                                            source={SUIT_IMAGE_MAP[suit]}
                                            style={[styles.congratsSuitImage, { tintColor: SUIT_COLOR_MAP[suit] }]}
                                        />
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {/* New Game / Share buttons */}
                        <Animated.View style={[styles.congratsActions, { opacity: congratsButtonOpacity }]}>
                            <TouchableOpacity style={styles.congratsShareButton} onPress={() => { void handleShareWin(); }} disabled={sharing}>
                                <Text style={styles.congratsShareButtonText}>{sharing ? 'Sharing…' : 'Share'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.congratsButton} onPress={dismissCongratsAndNewGame}>
                                <Text style={styles.congratsButtonText}>New Game</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                )}
                </View>
            </ImageBackground>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gameLayout: {
        flex: 1,
        flexDirection: 'column',
    },
    vignetteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.vignette,
    },
    feltTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 92, 52, 0.22)',
    },
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingScreen: {
        backgroundColor: COLORS.background,
    },

    // ── HUD (game scoreboard) ───────────────────────
    hudFrame: {
        flexShrink: 0,
        marginHorizontal: 6,
        marginTop: 4,
        marginBottom: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.woodLight,
        backgroundColor: COLORS.woodDark,
        padding: 2,
        zIndex: 3000,
        elevation: 12,
    },
    hudInner: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.hudBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.brass,
        paddingVertical: 3,
        paddingHorizontal: 4,
    },
    hudDivider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.woodMid,
    },
    hudStock: {
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    hudStockLabel: {
        color: COLORS.brassLight,
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 1,
    },
    hudMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 2,
    },
    hudMetaText: {
        color: COLORS.brassLight,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    hudMetaLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hudMetaLink: {
        color: COLORS.textGold,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
        textDecorationLine: 'underline',
    },

    // ── Table play area ─────────────────────────────
    tableFrame: {
        flex: 1,
        minHeight: 0,
        marginHorizontal: 4,
        marginVertical: 3,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: COLORS.woodMid,
        backgroundColor: COLORS.woodDark,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 8,
    },
    tableInner: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.feltLight,
        backgroundColor: COLORS.feltGreen,
        paddingHorizontal: 2,
        paddingVertical: 5,
        overflow: 'hidden',
    },
    pilesContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        width: '100%',
    },
    pileSlot: {
        flexShrink: 0,
        height: '100%',
    },

    // ── Loading / Error ─────────────────────────────
    loadingText: {
        color: COLORS.textGold,
        marginTop: 12,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    errorText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.buttonDeal,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.brass,
    },
    retryButtonText: {
        color: COLORS.buttonText,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    inlineErrorContainer: {
        flexShrink: 0,
        backgroundColor: 'rgba(180, 40, 30, 0.35)',
        borderTopWidth: 2,
        borderTopColor: 'rgba(220, 80, 60, 0.6)',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    inlineErrorText: {
        color: '#ffb4a8',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },

    // ── Action bar ──────────────────────────────────
    actionBarFrame: {
        flexShrink: 0,
        marginHorizontal: 8,
        marginBottom: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.brass,
        backgroundColor: COLORS.woodDark,
        paddingVertical: 4,
        paddingHorizontal: 4,
        zIndex: 3000,
        elevation: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 4,
    },
    buttonBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 3,
        height: 48,
        borderRadius: 8,
        backgroundColor: COLORS.feltDark,
        borderWidth: 1,
        borderColor: 'rgba(201, 162, 39, 0.25)',
        paddingHorizontal: 3,
        paddingVertical: 3,
    },
    buttonWrapper: {
        flex: 1,
        minWidth: 0,
        height: 42,
        overflow: 'visible',
        position: 'relative',
    },
    tooltipContainer: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        alignItems: 'center',
        marginBottom: 6,
        zIndex: 9999,
        elevation: 50,
    },
    tooltipBubble: {
        backgroundColor: COLORS.hudBg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: COLORS.brass,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
        minWidth: 100,
    },
    tooltipText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    tooltipArrow: {
        width: 8,
        height: 8,
        backgroundColor: COLORS.hudBg,
        borderRightWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: COLORS.brass,
        transform: [{ rotate: '45deg' }],
        marginTop: -5,
    },

    // ── Logo watermark ──────────────────────────────
    logoContainer: {
        position: 'absolute',
        top: '42%',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.35,
    },
    logoImage: {
        width: '70%',
        height: 80,
    },

    // ── Completion Animation ────────────────────────
    animationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        elevation: 200,
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 140,
        height: 140,
    },
    animatedSuitImage: {
        width: 80,
        height: 80,
    },
    glowCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 215, 0, 0.25)',
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
    },
    sparkle: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.gold,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },

    // ── Completed suits tray ────────────────────────
    completedTray: {
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginHorizontal: 10,
        marginBottom: 4,
        backgroundColor: COLORS.hudBg,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.brass,
        gap: 2,
    },
    completedIconWrapper: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedIconImage: {
        width: 24,
        height: 24,
    },
    iconGlow: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    iconSparkle: {
        position: 'absolute',
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },

    // ── Congratulations ─────────────────────────────
    congratsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        zIndex: 20000,
        elevation: 300,
    },
    congratsTitle: {
        color: COLORS.gold,
        fontSize: 38,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: COLORS.goldGlow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 24,
        marginBottom: 12,
        letterSpacing: 1,
    },
    congratsMoves: {
        color: COLORS.textSecondary,
        fontSize: 17,
        textAlign: 'center',
        fontWeight: '500',
    },
    congratsStatsBlock: {
        alignItems: 'center',
        marginBottom: 8,
    },
    congratsScore: {
        color: COLORS.textGold,
        fontSize: 22,
        fontWeight: '800',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    congratsDiff: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
    },
    congratsSuitsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        marginTop: 16,
    },
    congratsSuitWrapper: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    congratsSuitImage: {
        width: 48,
        height: 48,
    },
    congratsButton: {
        backgroundColor: COLORS.gold,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 24,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    congratsActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    congratsShareButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    congratsShareButtonText: {
        color: COLORS.textGold,
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.4,
    },
    shareCard: {
        alignItems: 'center',
        backgroundColor: '#140c08',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.brass,
        paddingHorizontal: 28,
        paddingTop: 16,
        paddingBottom: 14,
        minWidth: 260,
    },
    shareCardBrand: {
        color: COLORS.brassLight,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    unlockRow: {
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    unlockText: {
        color: COLORS.textGold,
        fontSize: 13,
        fontWeight: '700',
    },
    congratsButtonText: {
        color: '#1a1a1a',
        fontWeight: '800',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    congratsSparkle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.gold,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
});