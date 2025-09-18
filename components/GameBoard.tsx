import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { gameService } from '../services/gameService';
import { GameState } from '../types/gameTypes';
import { IMAGES, preloadImages } from '../utils/assets';
import { DifficultyModal } from './DifficultyModal';
import { Pile, PileRef } from './Pile';

export const GameBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<{ pileIndex: number; cardIndex: number } | null>(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
    const [currentDifficulty, setCurrentDifficulty] = useState<number>(0); // Default to Easy
    const [expandedPileIndex, setExpandedPileIndex] = useState<number | null>(null);
    const pileRefs = useRef<(PileRef | null)[]>([]);

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
                // console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initGame();
    }, []);

    const handleDealCards = async () => {
        if (!gameState) return;

        try {
            // setLoading(true);
            const newState = await gameService.dealCards();
            setGameState(newState[0]);
        } catch (err) {
            // console.error('Failed to deal cards:', err);
        } finally {
            // setLoading(false);
        }
    };

    const handleUndo = async () => {
        if (!gameState) return;

        try {
            // setLoading(true);
            const newState = await gameService.undoMove();
            setGameState(newState[0]);
        } catch (err) {
            // console.error('Failed to undo move:', err);
        } finally {
            // setLoading(false);
        }
    };

    const handleNewGame = async () => {
        try {
            setLoading(true);
            const newState = await gameService.startNewGame(currentDifficulty);
            setGameState(newState[0]);
        } catch (err) {
            // console.error('Failed to start new game:', err);
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
            // If we get here, no valid moves were found
            // console.log('No valid moves for this card');
        } catch (err) {
            // console.error('Failed to move card:', err);
        } finally {
            // setLoading(false);
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
            // console.error('Failed to solve game:', err);
        } finally {
            // setLoading(false);
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
            // console.error(err);
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

    // Function to calculate completed sequences by suit
    const getCompletedSequencesBySuit = (gameState: GameState) => {
        const suitCounts = {
            hearts: 0,
            diamonds: 0,
            clubs: 0,
            spades: 0
        };

        // Check each pile for completed sequences
        gameState.piles.forEach(pile => {
            if (pile.cards.length >= 13) {
                // Check if the last 13 cards form a complete sequence
                const last13Cards = pile.cards.slice(-13);
                
                // Check if all cards are face up and of the same suit
                const allFaceUp = last13Cards.every(card => card.isFaceUp);
                const firstSuit = last13Cards[0].suit;
                const allSameSuit = last13Cards.every(card => card.suit === firstSuit);
                
                if (allFaceUp && allSameSuit) {
                    // Check if they form a descending sequence from K to A
                    const expectedRanks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
                    const actualRanks = last13Cards.map(card => card.rank);
                    const isCompleteSequence = expectedRanks.every((rank, index) => rank === actualRanks[index]);
                    
                    if (isCompleteSequence) {
                        suitCounts[firstSuit]++;
                    }
                }
            }
        });

        return suitCounts;
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
            // setLoading(true);
            setError(null);
            const state = await gameService.startNewGame(1);
            setGameState(state[0]);
        } catch (err) {
            setError('Failed to load game. Please try again.');
            // console.error(err);
        } finally {
            // setLoading(false);
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
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerText}>Moves: {gameState.moves}  |  Difficulty: {currentDifficulty}  |  Stack: {gameState.drawsRemaining}/5  |  Completed: {gameState.completedSequences}/8</Text>
                    </View>
                    
                    <View style={styles.headerRight}>
                        {(() => {
                            const completedSequences = getCompletedSequencesBySuit(gameState);
                            const suits = [
                                { suit: 'hearts', image: IMAGES.hearts },
                                { suit: 'diamonds', image: IMAGES.diamonds },
                                { suit: 'clubs', image: IMAGES.clubs },
                                { suit: 'spades', image: IMAGES.spades }
                            ];
                            
                            return suits.map(({ suit, image }) => (
                                <View key={suit} style={styles.suitContainer}>
                                    <Image source={image} style={styles.suitImage} />
                                    <Text style={styles.suitText}>{completedSequences[suit as keyof typeof completedSequences]}/2</Text>
                                </View>
                            ));
                        })()}
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3000,
        elevation: 10, // For Android
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    headerText: {
        color: 'white',
        fontSize: 14,
        marginVertical: 1,
    },
    suitImage: {
        width: 24,
        height: 24,
        marginHorizontal: 4,
        tintColor: 'white',
    },
    suitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    suitText: {
        color: 'white',
        fontSize: 10,
        marginLeft: 2,
        fontWeight: 'bold',
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
        marginHorizontal: 10,
        marginTop: 50, // Space for the header bar
        marginBottom: 60, // Space for the button bar
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
        marginHorizontal: 10,
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
});