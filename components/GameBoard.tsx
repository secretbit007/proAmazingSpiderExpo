import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { gameService } from '../services/gameService';
import { GameState } from '../types/gameTypes';
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
    hearts: '#FF4444',
    diamonds: '#ffa500',
    clubs: '#197a29',
    spades: '#333333',
};
const MAX_COMPLETED = 8;
const ICON_SPARKLE_COUNT = 6;

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
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#4a90e2" />
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
                    <Text style={styles.headerText}>Moves: {gameState.moves}  |  Stack: {gameState.drawsRemaining}/5  |  Completed: {gameState.completedSequences}/8</Text>
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
                    <TouchableOpacity style={styles.button} onPress={handleNewGame}>
                        <Text style={styles.buttonText}>New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleDealCards}>
                        <Text style={styles.buttonText}>Stack</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleSolve}>
                        <Text style={styles.buttonText}>Solve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleUndo}>
                        <Text style={styles.buttonText}>Undo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleDifficulty}>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3000,
        elevation: 10,
    },
    headerText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 20,
    },
    stockContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-end',
        flex: 1,
    },
    completedContainer: {
        flex: 1,
        flexDirection: 'column'
    },
    pilesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        marginHorizontal: 5,
        marginTop: 5,
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#4a90e2',
        padding: 12,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    gameControls: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 10,
    },
    buttonBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        paddingVertical: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3000,
        elevation: 10, // For Android
    },
    button: {
        backgroundColor: '#4a90e2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
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
        opacity: 0.9,
        aspectRatio: 10
    },
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
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
    },
    sparkle: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
    completedIconsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
});