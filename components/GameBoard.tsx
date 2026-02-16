import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { gameService } from '../services/gameService';
import { GameState } from '../types/gameTypes';
import { COLORS } from '../constants/Colors';
import { IMAGES, preloadImages } from '../utils/assets';
import { DifficultyModal } from './DifficultyModal';
import { Pile, PileRef } from './Pile';

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

export const GameBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<{ pileIndex: number; cardIndex: number } | null>(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
    const [currentDifficulty, setCurrentDifficulty] = useState<number>(0); // Default to Easy
    const [expandedPileIndex, setExpandedPileIndex] = useState<number | null>(null);
    const pileRefs = useRef<(PileRef | null)[]>([]);

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
        if (!gameState) return;

        try {
            // setLoading(true);
            const newState = await gameService.dealCards();
            setGameState(newState[0]);
        } catch (err) {
            
        }
    };

    const handleUndo = async () => {
        if (!gameState) return;

        try {
            // setLoading(true);
            const newState = await gameService.undoMove();
            setGameState(newState[0]);
        } catch (err) {
            
        }
    };

    const handleNewGame = async () => {
        try {
            setLoading(true);
            const newState = await gameService.startNewGame(currentDifficulty);
            setGameState(newState[0]);
        } catch (err) {
            
        } finally {
            setLoading(false);
        }
    };

    const handleCardPress = async (pileIndex: number, cardIndex: number) => {
        if (!gameState) return;

        try {
            // setLoading(true);
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

            if (newStates && newStates.length > 0) {
                // If only one state, update immediately
                if (newStates.length === 1) {
                    setGameState(newStates[0]);
                    return;
                }

                // Cycle through all states with delay
                for (let i = 0; i < newStates.length; i++) {
                    setGameState(newStates[i]);
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                return;
            }
        } catch (err) {
            
        } finally {
            setHoveredCard(null);
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
        try {
            const newStates = await gameService.solveGame();

            if (newStates && newStates.length > 0) {
                // If only one state, update immediately
                if (newStates.length === 1) {
                    setGameState(newStates[0]);
                    return;
                }

                // Cycle through all states with delay
                for (let i = 0; i < newStates.length; i++) {
                    setGameState(newStates[i]);
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                return;
            }
        } catch (err) {
            
        }
    };

    const handleDifficulty = () => {
        setShowDifficultyModal(true);
    };

    const handleDifficultySelect = async (difficulty: number) => {
        try {
            setLoading(true);
            const state = await gameService.startNewGame(difficulty);
            setGameState(state[0]);
            setCurrentDifficulty(difficulty);
            setError(null);
        } catch (err) {
            setError('Failed to start new game with selected difficulty');
        } finally {
            setLoading(false);
        }
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
                <ActivityIndicator size="large" color={COLORS.selectionBlue} />
                <Text style={styles.loadingText}>Loading game...</Text>
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
                <View style={styles.logoContainer}>
                    <Image
                        source={IMAGES.background_logo}
                        style={styles.logoImage}
                        resizeMode="center"
                    />
                </View>
                
                <View style={styles.header}>
                    <View style={styles.statChip}>
                        <Text style={styles.statLabel}>MOVES</Text>
                        <Text style={styles.statValue}>{gameState.moves}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statChip}>
                        <Text style={styles.statLabel}>STACK</Text>
                        <Text style={styles.statValue}>{gameState.drawsRemaining}<Text style={styles.statTotal}>/5</Text></Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statChip}>
                        <Text style={styles.statLabel}>DONE</Text>
                        <Text style={styles.statValue}>{gameState.completedSequences}<Text style={styles.statTotal}>/8</Text></Text>
                    </View>
                </View>

                <View style={styles.container}>
                    <View style={styles.pilesContainer}>
                        {gameState.piles.map((pile, pileIndex) => (
                            <Pile
                                key={pileIndex}
                                ref={(ref) => {
                                    pileRefs.current[pileIndex] = ref;
                                }}
                                cards={pile.cards}
                                pileIndex={pileIndex}
                                hoveredCard={hoveredCard}
                                onCardPress={handleCardPress}
                                onCardHover={handleCardHover}
                                onExpansionChange={handlePileExpansionChange}
                                onTouchEvent={handleTouchEvent}
                            />
                        ))}
                    </View>
                </View>

                {/* Completed suit icons above button bar */}
                {completedIcons.length > 0 && (
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
                )}

                <View style={styles.buttonBar}>
                    <TouchableOpacity style={[styles.button, styles.buttonNew]} onPress={handleNewGame} activeOpacity={0.7}>
                        <Text style={styles.buttonEmoji}>+</Text>
                        <Text style={styles.buttonText}>New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonStack]} onPress={handleDealCards} activeOpacity={0.7}>
                        <Text style={styles.buttonEmoji}>&#x25A6;</Text>
                        <Text style={styles.buttonText}>Deal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonSolve]} onPress={handleSolve} activeOpacity={0.7}>
                        <Text style={styles.buttonEmoji}>&#x2728;</Text>
                        <Text style={styles.buttonText}>Solve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonUndo]} onPress={handleUndo} activeOpacity={0.7}>
                        <Text style={styles.buttonEmoji}>&#x21B6;</Text>
                        <Text style={styles.buttonText}>Undo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonDiff]} onPress={handleDifficulty} activeOpacity={0.7}>
                        <Text style={styles.buttonEmoji}>&#x2699;</Text>
                        <Text style={styles.buttonText}>Diff</Text>
                    </TouchableOpacity>
                </View>

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

                <DifficultyModal
                    visible={showDifficultyModal}
                    onClose={() => setShowDifficultyModal(false)}
                    onDifficultySelect={handleDifficultySelect}
                    currentDifficulty={currentDifficulty}
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

    // ── Header ──────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.glass,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
        zIndex: 3000,
        elevation: 10,
        gap: 0,
    },
    statChip: {
        alignItems: 'center',
        paddingHorizontal: 14,
    },
    statLabel: {
        color: COLORS.textMuted,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 1,
    },
    statValue: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    statTotal: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },

    // ── Piles ───────────────────────────────────────
    pilesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        marginHorizontal: 5,
        marginTop: 5,
    },

    // ── Loading / Error ─────────────────────────────
    loadingText: {
        color: COLORS.textSecondary,
        marginTop: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    errorText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.buttonPrimary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: COLORS.buttonText,
        fontWeight: '700',
        fontSize: 15,
    },

    // ── Button Bar ──────────────────────────────────
    buttonBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 8,
        backgroundColor: COLORS.glass,
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
        zIndex: 3000,
        elevation: 10,
        gap: 5,
    },
    button: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 10,
        minHeight: 44,
    },
    buttonNew: {
        backgroundColor: COLORS.buttonSuccess,
    },
    buttonStack: {
        backgroundColor: COLORS.buttonPrimary,
    },
    buttonSolve: {
        backgroundColor: '#8B5CF6',
    },
    buttonUndo: {
        backgroundColor: COLORS.buttonMuted,
    },
    buttonDiff: {
        backgroundColor: '#D97706',
    },
    buttonEmoji: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 1,
    },
    buttonText: {
        color: COLORS.buttonText,
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 0.3,
    },

    // ── Logo ────────────────────────────────────────
    logoContainer: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        height: '50%',
        opacity: 0.7,
        aspectRatio: 10,
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

    // ── Completed Icons Row ─────────────────────────
    completedIconsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
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
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: COLORS.goldGlow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        marginBottom: 12,
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