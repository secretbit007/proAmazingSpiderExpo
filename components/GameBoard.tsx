import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { computeCardLayout, computeCardLayoutFromWidth } from '../constants/CardLayout';
import { COLORS } from '../constants/Colors';
import { gameService } from '../services/gameService';
import { GameState } from '../types/gameTypes';
import { IMAGES, preloadImages } from '../utils/assets';
import { warmCardFaceCache } from '../utils/cardFaceCache';
import { GameButton, GameButtonVariant } from './GameButton';
import { HelpModal } from './HelpModal';
import { HudStat } from './HudStat';
import { Pile, PileRef } from './Pile';
import { StockPile } from './StockPile';

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
    new: 'Start a fresh game with current difficulty',
    deal: 'Deal 1 card to each pile from the stock',
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
    const [expandedPileIndex, setExpandedPileIndex] = useState<number | null>(null);
    const pileRefs = useRef<(PileRef | null)[]>([]);
    const isMountedRef = useRef(true);
    const solveRunIdRef = useRef(0);
    const moveRunIdRef = useRef(0);

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
        const initGame = async () => {
            try {
                setLoading(true);
                await preloadImages();
                const state = await gameService.startNewGame(0);
                setGameState(state[0]);
                setError(null);
            } catch (err) {
                setError('Failed to initialize game');
            } finally {
                setLoading(false);
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

    // Dismiss congrats and start a new game
    const dismissCongratsAndNewGame = () => {
        showCongratsRef.current = false;
        Animated.timing(congratsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(function () {
            setShowCongrats(false);
            handleNewGame();
        });
    };

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

        newlyCompleted.forEach(function (s) {
            animationQueueRef.current.push(s);
        });
        startNextAnimation();
    }, [gameState]);

    const handleDealCards = async () => {
        if (!gameState || isSolving || isMovingCard) return;

        try {
            const newState = await gameService.dealCards();
            setGameState(newState[0]);
            setActionError(null);
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Deal failed. Please try again.'));
        }
    };

    const handleUndo = async () => {
        if (!gameState || isSolving || isMovingCard) return;

        try {
            const newState = await gameService.undoMove();
            setGameState(newState[0]);
            setActionError(null);
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Undo failed. Please try again.'));
        }
    };

    const handleNewGame = async () => {
        try {
            solveRunIdRef.current += 1;
            moveRunIdRef.current += 1;
            setIsSolving(false);
            setIsMovingCard(false);
            setIsStartingNewGame(true);
            setActionError(null);
            const newState = await gameService.startNewGame(0);
            setGameState(newState[0]);
        } catch (err) {
            setActionError(actionErrorMessage(err, 'Failed to start a new game.'));
        } finally {
            setIsStartingNewGame(false);
        }
    };

    const handleCardPress = async (pileIndex: number, cardIndex: number) => {
        if (!gameState || isSolving || isMovingCard) return;

        const runId = moveRunIdRef.current + 1;
        moveRunIdRef.current = runId;
        setIsMovingCard(true);
        setActionError(null);

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
        if (isSolving) return;

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


    if (loading) {
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
            const state = await gameService.startNewGame(1);
            setGameState(state[0]);
        } catch (err) {
            setError('Failed to load game. Please try again.');
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
                <View style={styles.feltTint} pointerEvents="none" />

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
                        <View style={styles.hudStock}>
                            <Text style={styles.hudStockLabel}>STOCK</Text>
                            <StockPile drawsRemaining={gameState.drawsRemaining} />
                        </View>
                        <View style={styles.hudDivider} />
                        <HudStat
                            label="COMPLETE"
                            value={gameState.completedSequences}
                            suffix="/8"
                            accent={gameState.completedSequences > 0}
                        />
                    </View>
                </View>

                <View style={styles.tableFrame}>
                    <View
                        style={styles.tableInner}
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
                        <Text style={styles.completedTrayLabel}>REMOVED</Text>
                        <View style={styles.completedIconsRow}>
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
                    </View>
                )}

                <View style={styles.actionBarFrame}>
                    <View style={styles.buttonBar}>
                    {([
                        { key: 'new' as const, variant: 'new' as GameButtonVariant, icon: '＋', label: 'New', onPress: handleNewGame, disabled: loading || isStartingNewGame },
                        { key: 'deal', variant: 'deal' as GameButtonVariant, icon: '▤', label: 'Deal', onPress: handleDealCards, disabled: isSolving || isMovingCard },
                        { key: 'solve', variant: 'solve' as GameButtonVariant, icon: '★', label: isSolving ? 'Busy' : 'Solve', onPress: handleSolve, disabled: isSolving },
                        { key: 'undo', variant: 'undo' as GameButtonVariant, icon: '↩', label: 'Undo', onPress: handleUndo, disabled: isSolving || isMovingCard },
                        { key: 'help', variant: 'help' as GameButtonVariant, icon: 'i', label: 'Help', onPress: handleHelp, disabled: false },
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

                        {/* Moves count */}
                        <Animated.Text style={[
                            styles.congratsMoves,
                            { opacity: congratsMovesOpacity },
                        ]}>
                            Completed in {gameState.moves} moves
                        </Animated.Text>

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

                        {/* New Game button */}
                        <Animated.View style={{ opacity: congratsButtonOpacity }}>
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
        gap: 4,
        height: 42,
        borderRadius: 8,
        backgroundColor: COLORS.feltDark,
        borderWidth: 1,
        borderColor: 'rgba(201, 162, 39, 0.25)',
        paddingHorizontal: 4,
        paddingVertical: 3,
    },
    buttonWrapper: {
        flex: 1,
        height: 36,
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
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginHorizontal: 10,
        marginBottom: 4,
        backgroundColor: COLORS.hudBg,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.brass,
        gap: 10,
    },
    completedTrayLabel: {
        color: COLORS.brassLight,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    completedIconsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedIconWrapper: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    completedIconImage: {
        width: 24,
        height: 24,
    },
    iconGlow: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
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
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '500',
    },
    congratsSuitsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
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
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 24,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
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