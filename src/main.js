// Import multiplayer functionality
import lobbyUI from './lobby.js';
import multiplayer from './multiplayer.js';
import './lobby.css';

// Multiplayer game state
window.isMultiplayerGame = false;
window.multiplayerRole = null; // 1 for Player 1, 2 for Player 2

// Multiplayer game functions
window.setupMultiplayerGame = function(gameState, playerRole) {
    // Reset game board
    stopConfetti();
    initGame(false); // Initialize without auto-starting

    // Set grid size from game state
    gridSize = gameState.gridSize;
    createBoard();

    // Update player labels
    const player1Label = document.querySelector('.player1 .player-label');
    const player2Label = document.querySelector('.player2 .player-label');
    
    if (player1Label) {
        player1Label.textContent = playerRole === 1 ? "You (P1)" : "Opponent (P1)";
    }
    
    if (player2Label) {
        player2Label.textContent = playerRole === 2 ? "You (P2)" : "Opponent (P2)";
    }

    // Set player colors based on role for visual clarity
    updatePlayerColor(1, "red");
    updatePlayerColor(2, "blue");

    // Apply the game state (lines, boxes, scores)
    lines = { ...gameState.lines };
    boxes = { ...gameState.boxes };
    scores = { ...gameState.scores };
    currentPlayer = gameState.currentPlayer;

    // Draw existing lines and boxes
    updateBoardFromState();

    // Update scores and turn indicator
    updateScores();
    updateMultiplayerTurnIndicator();
};

window.updateMultiplayerGameState = function(gameState, lastMove) {
    // Update game state variables
    lines = { ...gameState.lines };
    boxes = { ...gameState.boxes };
    scores = { ...gameState.scores };
    currentPlayer = gameState.currentPlayer;

    // If there was a move, animate it
    if (lastMove) {
        const { lineKey, player } = lastMove;
        const [startCoord, endCoord] = lineKey.split('-');
        const [x1, y1] = startCoord.split(',').map(Number);
        const [x2, y2] = endCoord.split(',').map(Number);

        // Find the line element
        const lineElements = document.querySelectorAll('.line');
        for (const element of lineElements) {
            if (element.dataset.x1 == x1 && 
                element.dataset.y1 == y1 && 
                element.dataset.x2 == x2 && 
                element.dataset.y2 == y2) {
                
                // Add active class and player class
                element.classList.add('active', `player${player}`);
                break;
            }
        }
    } else {
        // If no specific move provided, update entire board
        updateBoardFromState();
    }

    // Update scores and turn indicator
    updateScores();
    updateMultiplayerTurnIndicator();
};

window.handleMultiplayerGameOver = function(winner, finalScores) {
    isGameFinished = true;
    scores = finalScores;
    updateScores();
    
    let winnerText;
    if (winner === 0) {
        winnerText = "It's a Tie!";
    } else if (winner === window.multiplayerRole) {
        winnerText = "You Win!";
        startConfetti(winner);
    } else {
        winnerText = "Opponent Wins!";
        startConfetti(winner);
    }
    
    turnTextElement.textContent = `Game Over - ${winnerText}`;
    showWinMessage(winnerText, winner);
};

window.resetMultiplayerGame = function() {
    // Reset game for returning to lobby
    initGame();
};

function updateMultiplayerTurnIndicator() {
    if (!isGameFinished) {
        const isYourTurn = currentPlayer === window.multiplayerRole;
        turnTextElement.textContent = isYourTurn ? "Your turn" : "Opponent's turn";
    }
}

function updateBoardFromState() {
    // Clear all visual line indicators
    const lineElements = document.querySelectorAll('.line');
    lineElements.forEach(element => {
        element.classList.remove('active', 'player1', 'player2');
    });

    // Redraw all lines
    for (const [lineKey, player] of Object.entries(lines)) {
        const [startCoord, endCoord] = lineKey.split('-');
        const [x1, y1] = startCoord.split(',').map(Number);
        const [x2, y2] = endCoord.split(',').map(Number);

        // Find the line element
        for (const element of lineElements) {
            if (element.dataset.x1 == x1 && 
                element.dataset.y1 == y1 && 
                element.dataset.x2 == x2 && 
                element.dataset.y2 == y2) {
                
                // Add active class and player class
                element.classList.add('active', `player${player}`);
                break;
            }
        }
    }

    // Redraw all boxes
    for (const [boxKey, player] of Object.entries(boxes)) {
        const [x, y] = boxKey.split(',').map(Number);
        const boxElement = document.getElementById(`box-${x}-${y}`);
        
        if (boxElement) {
            boxElement.classList.add(`player${player}`);
            
            // Set box text content based on player
            if (player === 1) {
                boxElement.textContent = 'P1';
            } else {
                boxElement.textContent = 'P2';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Game configuration
    const defaultGridSize = 8;
    let gridSize = defaultGridSize;
    let cellSize = 60; // Default cell size for small grids
    let currentPlayer = 1;
    let scores = { 1: 0, 2: 0 };
    let gameBoard = null;
    let isGameFinished = false;
    let autoFillEnabled = true; // Set auto-fill enabled by default
    let isGridFilled = false; // Track if grid has been filled
    let currentFillPercentage = 50; // Set default fill percentage to 50%
    let filledLines = []; // Keep track of lines filled by the fill button
    let vsComputerMode = false; // Flag for computer player mode
    let isComputerTurn = false; // Flag for tracking computer's turn
    let computerThinkingTimeout = null; // Timeout for computer's "thinking" time
    let computerDifficulty = 'medium'; // Default difficulty level
    let player1Color = 'red'; // Default color for player 1
    let player2Color = 'blue'; // Default color for player 2
    let backgroundColor = 'rainbow'; // Default background color
    let soundEnabled = true; // Default sound setting
    let animationsEnabled = true; // Default animations setting
    let darkModeEnabled = false; // Default dark mode setting
    
    // DOM elements
    const boardElement = document.getElementById('game-board');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const turnTextElement = document.getElementById('turn-text');
    const newGameButton = document.getElementById('new-game-btn');
    const gridSizeSelect = document.getElementById('grid-size-select');
    const fireworksContainer = document.getElementById('fireworks-container');
    const winMessageElement = document.getElementById('win-message');
    const autoFillToggle = document.getElementById('auto-fill-toggle');
    const fillGridSelect = document.getElementById('fill-grid-select');
    const gameModeSelect = document.getElementById('game-mode-select');
    const difficultyContainer = document.getElementById('difficulty-container');
    const difficultySelect = document.getElementById('difficulty-select');
    const player1ColorSelect = document.getElementById('player1-color');
    const player2ColorSelect = document.getElementById('player2-color');
    const backgroundColorSelect = document.getElementById('background-color-select');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const themeToggle = document.getElementById('theme-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const animationToggle = document.getElementById('animation-toggle');
    
    // Game data structures
    let lines = {}; // Format: "x1,y1-x2,y2": playerId
    let boxes = {}; // Format: "x,y": playerId
    
    // Initialize the game
    initGame();
    
    // Event listeners
    newGameButton.addEventListener('click', () => {
        stopConfetti();
        initGame();
    });
    
    gridSizeSelect.addEventListener('change', () => {
        stopConfetti();
        gridSize = parseInt(gridSizeSelect.value);
        initGame();
    });
    
    // Add event listener for auto-fill toggle
    if (autoFillToggle) {
        autoFillToggle.addEventListener('change', () => {
            autoFillEnabled = autoFillToggle.checked;
        });
    }
    
    // Add event listener for fill grid select
    if (fillGridSelect) {
        fillGridSelect.addEventListener('change', () => {
            if (isGameFinished) return;
            
            // Only allow filling if no manual lines have been drawn yet
            if (Object.keys(lines).length === filledLines.length) {
                // Clear any existing filled lines first
                if (filledLines.length > 0) {
                    clearFilledLines();
                }
                
                // Get the new fill percentage
                const newFillPercentage = parseInt(fillGridSelect.value);
                
                // If the percentage is greater than 0, fill the grid
                if (newFillPercentage > 0) {
                    randomlyFillGrid(newFillPercentage);
                    currentFillPercentage = newFillPercentage;
                    isGridFilled = true;
                } else {
                    currentFillPercentage = 0;
                    isGridFilled = false;
                }
            } else {
                // If manual lines have been drawn, reset the dropdown to the current fill percentage
                fillGridSelect.value = currentFillPercentage.toString();
                alert("Cannot change fill percentage after manual moves have been made. Start a new game first.");
            }
        });
    }
    
    // Add event listener for game mode select
    if (gameModeSelect) {
        gameModeSelect.addEventListener('change', () => {
            vsComputerMode = gameModeSelect.value === 'computer';
            
            // Toggle difficulty dropdown visibility
            if (difficultyContainer) {
                difficultyContainer.style.display = vsComputerMode ? 'flex' : 'none';
            }
            
            // Update body class for CSS styling
            if (vsComputerMode) {
                document.body.classList.add('vs-computer-mode');
                // Update player 2 label to "Computer"
                const player2Label = document.querySelector('.player2 .player-label');
                if (player2Label) {
                    player2Label.textContent = "Computer";
                }
            } else {
                document.body.classList.remove('vs-computer-mode');
                // Reset player 2 label
                const player2Label = document.querySelector('.player2 .player-label');
                if (player2Label) {
                    player2Label.textContent = "Player 2";
                }
            }
            
            // Reset the game when changing mode
            stopConfetti();
            initGame();
        });
    }
    
    // Add event listener for difficulty select
    if (difficultySelect) {
        difficultySelect.addEventListener('change', () => {
            computerDifficulty = difficultySelect.value;
            console.log(`Difficulty changed to: ${computerDifficulty}`);
            // Reset the game when changing difficulty
            if (vsComputerMode) {
                stopConfetti();
                initGame();
            }
        });
    }
    
    // Add event listener for player 1 color selection
    if (player1ColorSelect) {
        player1ColorSelect.addEventListener('change', () => {
            updatePlayerColor(1, player1ColorSelect.value);
        });
    }
    
    // Add event listener for player 2 color selection
    if (player2ColorSelect) {
        player2ColorSelect.addEventListener('change', () => {
            updatePlayerColor(2, player2ColorSelect.value);
        });
    }
    
    // Add event listener for background color selection
    if (backgroundColorSelect) {
        backgroundColorSelect.addEventListener('change', () => {
            updateBackgroundColor(backgroundColorSelect.value);
        });
    }
    
    // Settings menu toggle
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsMenu.classList.toggle('show');
        });
        
        // Close the menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!settingsBtn.contains(event.target) && !settingsMenu.contains(event.target)) {
                settingsMenu.classList.remove('show');
            }
        });
    }
    
    // Dark mode toggle
    if (themeToggle) {
        // Check if dark mode was previously enabled
        if (localStorage.getItem('darkMode') === 'true') {
            darkModeEnabled = true;
            themeToggle.checked = true;
            document.body.classList.add('dark-mode');
        }
        
        themeToggle.addEventListener('change', () => {
            darkModeEnabled = themeToggle.checked;
            document.body.classList.toggle('dark-mode', darkModeEnabled);
            localStorage.setItem('darkMode', darkModeEnabled.toString());
        });
    }
    
    // Sound toggle
    if (soundToggle) {
        // Check if sound was previously disabled
        if (localStorage.getItem('soundEnabled') === 'false') {
            soundEnabled = false;
            soundToggle.checked = false;
        }
        
        soundToggle.addEventListener('change', () => {
            soundEnabled = soundToggle.checked;
            localStorage.setItem('soundEnabled', soundEnabled.toString());
        });
    }
    
    // Animations toggle
    if (animationToggle) {
        // Check if animations were previously disabled
        if (localStorage.getItem('animationsEnabled') === 'false') {
            animationsEnabled = false;
            animationToggle.checked = false;
            document.body.classList.add('no-animations');
        }
        
        animationToggle.addEventListener('change', () => {
            animationsEnabled = animationToggle.checked;
            document.body.classList.toggle('no-animations', !animationsEnabled);
            localStorage.setItem('animationsEnabled', animationsEnabled.toString());
        });
    }
    
    function initGame(resetAllSettings = true) {
        // Initialize multiplayer lobby UI if not already initialized
        if (!lobbyUI.isInitialized) {
            lobbyUI.initialize();
        }
        
        // Reset game state
        currentPlayer = 1;
        scores = { 1: 0, 2: 0 };
        lines = {};
        boxes = {};
        isGameFinished = false;
        isGridFilled = false;
        currentFillPercentage = 50;
        filledLines = [];
        isComputerTurn = false;
        
        // Set initial player colors
        if (resetAllSettings) {
            updatePlayerColor(1, player1ColorSelect.value);
            updatePlayerColor(2, player2ColorSelect.value);
            
            // Set initial background color
            updateBackgroundColor(backgroundColorSelect.value);
            
            // Apply saved settings
            if (darkModeEnabled) {
                document.body.classList.add('dark-mode');
            }
            
            if (!animationsEnabled) {
                document.body.classList.add('no-animations');
            }
            
            // Check if computer mode is selected
            if (gameModeSelect) {
                vsComputerMode = gameModeSelect.value === 'computer';
                
                // Toggle difficulty dropdown visibility
                if (difficultyContainer) {
                    difficultyContainer.style.display = vsComputerMode ? 'flex' : 'none';
                }
                
                // Update body class for CSS styling
                if (vsComputerMode) {
                    document.body.classList.add('vs-computer-mode');
                    // Update player 2 label to "Computer"
                    const player2Label = document.querySelector('.player2 .player-label');
                    if (player2Label) {
                        player2Label.textContent = "Computer";
                    }
                } else {
                    document.body.classList.remove('vs-computer-mode');
                    // Reset player 2 label
                    const player2Label = document.querySelector('.player2 .player-label');
                    if (player2Label) {
                        player2Label.textContent = "Player 2";
                    }
                }
            }
            
            // Get current difficulty level
            if (difficultySelect) {
                computerDifficulty = difficultySelect.value;
            }
            
            // Clear any pending computer move
            if (computerThinkingTimeout) {
                clearTimeout(computerThinkingTimeout);
                computerThinkingTimeout = null;
            }
            
            // Set auto-fill toggle to checked by default
            if (autoFillToggle) {
                autoFillToggle.checked = true;
            }
            
            // Set fill-grid select to 50% by default
            if (fillGridSelect) {
                fillGridSelect.value = "50";
            }
        }

        // Update scores display
        updateScores();
        
        // Update turn indicator
        if (window.isMultiplayerGame) {
            updateMultiplayerTurnIndicator();
        } else {
            updateTurnIndicator();
        }

        // Hide win message
        winMessageElement.classList.remove('active');
        
        // Only recreate the board if resetAllSettings is true or if we're in a multiplayer game
        if (resetAllSettings) {
            createBoard();
        }
        
        // Start computer's turn if applicable
        if (vsComputerMode && !window.isMultiplayerGame) {
            checkComputerTurn();
        }
    }
    
    function createBoard() {
        // Adjust cell size based on grid size
        if (gridSize <= 8) {
            cellSize = 60; // Normal size for smaller grids
        } else if (gridSize <= 10) {
            cellSize = 45; // Medium size for medium grids
        } else {
            cellSize = 35; // Smaller size for large grids
        }
        
        // Calculate board dimensions
        const boardWidth = (gridSize - 1) * cellSize;
        const boardHeight = (gridSize - 1) * cellSize;
        
        // Clear the board
        boardElement.innerHTML = '';
        boardElement.style.width = `${boardWidth + 40}px`;
        boardElement.style.height = `${boardHeight + 40}px`;
        
        // Create boxes (initially empty) - placing these first so they're behind the lines
        for (let y = 0; y < gridSize - 1; y++) {
            for (let x = 0; x < gridSize - 1; x++) {
                const box = document.createElement('div');
                box.className = 'box';
                box.id = `box-${x}-${y}`;
                box.style.left = `${x * cellSize + 20}px`;
                box.style.top = `${y * cellSize + 20}px`;
                box.style.width = `${cellSize}px`;
                box.style.height = `${cellSize}px`;
                boardElement.appendChild(box);
            }
        }
        
        // Create horizontal lines
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize - 1; x++) {
                const line = document.createElement('div');
                line.className = 'line horizontal';
                line.style.left = `${x * cellSize + 20}px`;
                line.style.top = `${y * cellSize + 20}px`;
                line.style.width = `${cellSize}px`;
                line.style.height = '10px'; // Increase clickable area
                
                // Store data attributes for line identification
                line.dataset.x1 = x;
                line.dataset.y1 = y;
                line.dataset.x2 = x + 1;
                line.dataset.y2 = y;
                
                line.addEventListener('click', handleLineClick);
                boardElement.appendChild(line);
            }
        }
        
        // Create vertical lines
        for (let y = 0; y < gridSize - 1; y++) {
            for (let x = 0; x < gridSize; x++) {
                const line = document.createElement('div');
                line.className = 'line vertical';
                line.style.left = `${x * cellSize + 20}px`;
                line.style.top = `${y * cellSize + 20}px`;
                line.style.height = `${cellSize}px`;
                line.style.width = '10px'; // Increase clickable area
                
                // Store data attributes for line identification
                line.dataset.x1 = x;
                line.dataset.y1 = y;
                line.dataset.x2 = x;
                line.dataset.y2 = y + 1;
                
                line.addEventListener('click', handleLineClick);
                boardElement.appendChild(line);
            }
        }
        
        // Create dots - putting these on top
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dot.style.left = `${x * cellSize + 20}px`;
                dot.style.top = `${y * cellSize + 20}px`;
                boardElement.appendChild(dot);
            }
        }
        
        // Fill grid with random lines (only for local gameplay)
        if (!window.isMultiplayerGame) {
            randomlyFillGrid(currentFillPercentage);
        }
    }
    
    function handleLineClick(event) {
        // If game is already finished or it's computer's turn, ignore clicks
        if (isGameFinished || isComputerTurn) {
            return;
        }
        
        // If it's a multiplayer game and not your turn, ignore clicks
        if (window.isMultiplayerGame && currentPlayer !== window.multiplayerRole) {
            console.log('Not your turn in multiplayer game');
            return;
        }
        
        const { x1, y1, x2, y2 } = event.target.dataset;
        const lineKey = `${x1},${y1}-${x2},${y2}`;
        
        // Check if line is already active
        if (lines[lineKey]) {
            return;
        }
        
        // If multiplayer game, send move to server instead of updating locally
        if (window.isMultiplayerGame) {
            console.log('Sending multiplayer move:', { x1, y1, x2, y2 });
            multiplayer.makeMove(
                parseInt(x1), 
                parseInt(y1), 
                parseInt(x2), 
                parseInt(y2)
            );
            // Don't update client-side - wait for server update
            return;
        }
        
        // Regular game logic for local play continues below
        // Mark the line as active (local gameplay)
        lines[lineKey] = currentPlayer;
        event.target.classList.add('active', `player${currentPlayer}`);
        
        // Check if a box was completed
        let boxCompleted = checkForCompletedBoxes(parseInt(x1), parseInt(y1), parseInt(x2), parseInt(y2));
        
        // If auto-fill is enabled and a box was completed, check for deterministic moves
        if (autoFillEnabled && boxCompleted) {
            makeAutomaticMoves();
        }
        
        // Switch player if no box was completed
        if (!boxCompleted) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            
            // Check if it's now computer's turn
            checkComputerTurn();
        }
        
        // Update turn indicator
        updateTurnIndicator();
        
        // Check if game is over
        checkGameOver();
    }
    
    function checkComputerTurn() {
        if (vsComputerMode && currentPlayer === 2 && !isGameFinished) {
            isComputerTurn = true;
            updateTurnIndicator(); // Update to show "Computer is thinking..."
            
            // Simulate computer "thinking" with a short delay
            computerThinkingTimeout = setTimeout(() => {
                makeComputerMove();
                computerThinkingTimeout = null;
            }, 1000);
        } else {
            isComputerTurn = false;
        }
    }
    
    function makeComputerMove() {
        if (isGameFinished) return;
        
        // Strategy priority:
        // 1. Complete a box if possible (3 sides already filled)
        // 2. Avoid moves that give away a box (would create a 3-sided box)
        // 3. Random move
        
        let move = findBestComputerMove();
        
        if (move) {
            // Mark the line as active
            lines[move.lineKey] = currentPlayer;
            move.element.classList.add('active', `player${currentPlayer}`);
            
            // Check if a box was completed
            let boxCompleted = checkForCompletedBoxes(move.x1, move.y1, move.x2, move.y2);
            
            // If a box was completed and auto-fill is enabled, make automatic moves
            if (autoFillEnabled && boxCompleted) {
                makeAutomaticMoves();
            }
            
            // Switch player if no box was completed
            if (!boxCompleted) {
                currentPlayer = 1; // Switch back to human player
                isComputerTurn = false;
            } else {
                // If computer completed a box, it gets another turn
                // Delay the next move to make it feel more natural
                computerThinkingTimeout = setTimeout(() => {
                    makeComputerMove();
                }, 800);
                return;
            }
            
            // Update turn indicator
            updateTurnIndicator();
            
            // Check if game is over
            checkGameOver();
        } else {
            // If no move found, game should be over
            isComputerTurn = false;
        }
    }
    
    function findBestComputerMove() {
        // Strategy 1: Find moves that complete a box
        const completingMoves = findAllDeterministicMoves();
        if (completingMoves.length > 0) {
            return completingMoves[0];
        }
        
        // Apply different strategies based on difficulty level
        if (computerDifficulty === 'easy') {
            // Easy: Just make a random move
            return findRandomMove();
        } 
        else if (computerDifficulty === 'medium') {
            // Medium: Avoid giving away boxes, but not always
            const safeMoves = findSafeMoves();
            
            // 70% chance of making a safe move if available
            if (safeMoves.length > 0 && Math.random() < 0.7) {
                return safeMoves[Math.floor(Math.random() * safeMoves.length)];
            } else {
                return findRandomMove();
            }
        }
        else { // hard
            // Hard: Always make safe moves if possible, prioritize strategic moves
            const safeMoves = findSafeMoves();
            
            if (safeMoves.length > 0) {
                // Find the most strategic safe move
                return findStrategicMove(safeMoves);
            } else {
                // If no safe moves, find the move that gives away the fewest boxes
                return findLeastDamagingMove();
            }
        }
    }
    
    // Helper function to find all safe moves (moves that don't create 3-sided boxes)
    function findSafeMoves() {
        const safeMoves = [];
        const lineElements = document.querySelectorAll('.line');
        
        for (const element of lineElements) {
            const x1 = parseInt(element.dataset.x1);
            const y1 = parseInt(element.dataset.y1);
            const x2 = parseInt(element.dataset.x2);
            const y2 = parseInt(element.dataset.y2);
            const lineKey = `${x1},${y1}-${x2},${y2}`;
            
            // Skip if line is already drawn
            if (lines[lineKey]) continue;
            
            // Check if this move would create a 3-sided box
            if (!wouldCreate3SidedBox(x1, y1, x2, y2)) {
                safeMoves.push({
                    x1, y1, x2, y2,
                    lineKey,
                    element
                });
            }
        }
        
        return safeMoves;
    }
    
    // Check if a move would create a box with 3 sides (giving away a box)
    function wouldCreate3SidedBox(x1, y1, x2, y2) {
        // Determine which boxes to check based on the line position
        const boxesToCheck = [];
        
        if (x1 === x2) {
            // Vertical line
            if (x1 > 0) boxesToCheck.push({ x: x1 - 1, y: Math.min(y1, y2) });
            if (x1 < gridSize - 1) boxesToCheck.push({ x: x1, y: Math.min(y1, y2) });
        } else {
            // Horizontal line
            if (y1 > 0) boxesToCheck.push({ x: Math.min(x1, x2), y: y1 - 1 });
            if (y1 < gridSize - 1) boxesToCheck.push({ x: Math.min(x1, x2), y: y1 });
        }
        
        // Check if any of these boxes would have 3 sides after this move
        for (const box of boxesToCheck) {
            // Skip completed boxes
            if (boxes[`${box.x},${box.y}`]) continue;
            
            const top = `${box.x},${box.y}-${box.x+1},${box.y}`;
            const right = `${box.x+1},${box.y}-${box.x+1},${box.y+1}`;
            const bottom = `${box.x},${box.y+1}-${box.x+1},${box.y+1}`;
            const left = `${box.x},${box.y}-${box.x},${box.y+1}`;
            
            // Count existing sides
            let sidesFilled = 0;
            if (lines[top]) sidesFilled++;
            if (lines[right]) sidesFilled++;
            if (lines[bottom]) sidesFilled++;
            if (lines[left]) sidesFilled++;
            
            // Check if the current move would add a third side
            const currentMove = `${x1},${y1}-${x2},${y2}`;
            if ((currentMove === top || currentMove === right || 
                currentMove === bottom || currentMove === left) && 
                sidesFilled === 2) {
                return true;
            }
        }
        
        return false;
    }
    
    // Find a random move from all available moves
    function findRandomMove() {
        const allPossibleMoves = [];
        const lineElements = document.querySelectorAll('.line');
        
        for (const element of lineElements) {
            const x1 = parseInt(element.dataset.x1);
            const y1 = parseInt(element.dataset.y1);
            const x2 = parseInt(element.dataset.x2);
            const y2 = parseInt(element.dataset.y2);
            const lineKey = `${x1},${y1}-${x2},${y2}`;
            
            // Skip if line is already drawn
            if (lines[lineKey]) continue;
            
            allPossibleMoves.push({
                x1, y1, x2, y2,
                lineKey,
                element
            });
        }
        
        if (allPossibleMoves.length > 0) {
            return allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
        }
        
        return null; // No moves left
    }
    
    // Find a strategic move for hard difficulty
    function findStrategicMove(safeMoves) {
        // For hard difficulty, prioritize moves in the center of the board
        // to establish control of the center
        const boardCenter = gridSize / 2;
        
        // Sort moves by distance from center (closer is better)
        safeMoves.sort((a, b) => {
            const distA = Math.abs(a.x1 - boardCenter) + Math.abs(a.y1 - boardCenter);
            const distB = Math.abs(b.x1 - boardCenter) + Math.abs(b.y1 - boardCenter);
            return distA - distB;
        });
        
        // Take one of the top 3 moves (with some randomness)
        const topCount = Math.min(3, safeMoves.length);
        return safeMoves[Math.floor(Math.random() * topCount)];
    }
    
    // Function to find the least damaging move
    function findLeastDamagingMove() {
        let bestMove = null;
        let fewestBoxesGiven = Infinity;
        const lineElements = document.querySelectorAll('.line');
        
        for (const element of lineElements) {
            const x1 = parseInt(element.dataset.x1);
            const y1 = parseInt(element.dataset.y1);
            const x2 = parseInt(element.dataset.x2);
            const y2 = parseInt(element.dataset.y2);
            const lineKey = `${x1},${y1}-${x2},${y2}`;
            
            // Skip if line is already drawn
            if (lines[lineKey]) continue;
            
            // Count how many 3-sided boxes this move would create
            const boxesGiven = countBoxesGivenAway(x1, y1, x2, y2);
            
            // Update best move if this one gives away fewer boxes
            if (bestMove === null || boxesGiven < fewestBoxesGiven) {
                fewestBoxesGiven = boxesGiven;
                bestMove = {
                    x1, y1, x2, y2,
                    lineKey,
                    element
                };
            }
        }
        
        return bestMove;
    }
    
    // Helper function for the AI to select a line programmatically
    function selectLine(lineId) {
        const lineElements = document.querySelectorAll('.line');
        
        // Find the line element by data attributes
        for (const element of lineElements) {
            const x1 = parseInt(element.dataset.x1);
            const y1 = parseInt(element.dataset.y1);
            const x2 = parseInt(element.dataset.x2);
            const y2 = parseInt(element.dataset.y2);
            const elementId = `${x1},${y1}-${x2},${y2}`;
            
            if (elementId === lineId) {
                // Simulate a click on the line
                element.click();
                return;
            }
        }
    }
    
    // Count how many boxes would be given away by a move
    function countBoxesGivenAway(x1, y1, x2, y2) {
        let count = 0;
        
        // Check if this is a horizontal line
        if (y1 === y2) {
            // Check the box above this line (if it exists)
            if (y1 > 0) {
                const boxAbove = {
                    top: `${x1},${y1-1}-${x2},${y1-1}`,
                    bottom: `${x1},${y1}-${x2},${y2}`,  // This is the current line
                    left: `${x1},${y1-1}-${x1},${y1}`,
                    right: `${x2},${y1-1}-${x2},${y1}`
                };
                
                // If the other three sides are drawn, this move would give away a box
                if (lines[boxAbove.top] && lines[boxAbove.left] && lines[boxAbove.right]) {
                    count++;
                }
            }
            
            // Check the box below this line (if it exists)
            if (y1 < gridSize - 1) {
                const boxBelow = {
                    top: `${x1},${y1}-${x2},${y2}`,  // This is the current line
                    bottom: `${x1},${y1+1}-${x2},${y1+1}`,
                    left: `${x1},${y1}-${x1},${y1+1}`,
                    right: `${x2},${y1}-${x2},${y1+1}`
                };
                
                // If the other three sides are drawn, this move would give away a box
                if (lines[boxBelow.bottom] && lines[boxBelow.left] && lines[boxBelow.right]) {
                    count++;
                }
            }
        }
        // Check if this is a vertical line
        else if (x1 === x2) {
            // Check the box to the left of this line (if it exists)
            if (x1 > 0) {
                const boxLeft = {
                    top: `${x1-1},${y1}-${x1},${y1}`,
                    bottom: `${x1-1},${y2}-${x1},${y2}`,
                    left: `${x1-1},${y1}-${x1-1},${y2}`,
                    right: `${x1},${y1}-${x1},${y2}`  // This is the current line
                };
                
                // If the other three sides are drawn, this move would give away a box
                if (lines[boxLeft.top] && lines[boxLeft.bottom] && lines[boxLeft.left]) {
                    count++;
                }
            }
            
            // Check the box to the right of this line (if it exists)
            if (x1 < gridSize - 1) {
                const boxRight = {
                    top: `${x1},${y1}-${x1+1},${y1}`,
                    bottom: `${x1},${y2}-${x1+1},${y2}`,
                    left: `${x1},${y1}-${x1},${y2}`,  // This is the current line
                    right: `${x1+1},${y1}-${x1+1},${y2}`
                };
                
                // If the other three sides are drawn, this move would give away a box
                if (lines[boxRight.top] && lines[boxRight.bottom] && lines[boxRight.right]) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    function checkGameOver() {
        if (isGameOver()) {
            isGameFinished = true;
            const winner = scores[1] > scores[2] ? 1 : (scores[2] > scores[1] ? 2 : 0);
            
            if (winner === 0) {
                turnTextElement.textContent = "Game Over - It's a Tie!";
                showWinMessage("It's a Tie!");
            } else {
                const winnerText = winner === 1 ? "Player 1" : (vsComputerMode ? "Computer" : "Player 2");
                turnTextElement.textContent = `Game Over - ${winnerText} Wins!`;
                startConfetti(winner);
                showWinMessage(`${winnerText} Wins!`, winner);
            }
        }
    }
    
    function updateScores() {
        player1ScoreElement.textContent = scores[1];
        player2ScoreElement.textContent = scores[2];
    }
    
    function updateTurnIndicator() {
        if (!isGameFinished) {
            if (window.isMultiplayerGame) {
                updateMultiplayerTurnIndicator();
            } else if (vsComputerMode && currentPlayer === 2) {
                turnTextElement.textContent = isComputerTurn ? "Computer is thinking..." : "Computer's turn";
            } else {
                turnTextElement.textContent = `Player ${currentPlayer}'s turn`;
            }
        }
    }
    
    function isGameOver() {
        // Total possible boxes in the grid
        const totalBoxes = (gridSize - 1) * (gridSize - 1);
        
        // Check if all boxes are claimed
        return (scores[1] + scores[2]) === totalBoxes;
    }
    
    // Confetti functions
    function startConfetti(winner) {
        // Clear existing confetti
        fireworksContainer.innerHTML = '';
        
        // Add active class and winner class to container
        fireworksContainer.className = 'fireworks-container active';
        fireworksContainer.classList.add(`player${winner}-win`);
        
        // Get the player's color
        const playerColor = winner === 1 ? player1Color : player2Color;
        
        let colors = [];
        
        // Set colors based on player's color
        switch(playerColor) {
            case 'red':
                colors = ['#ff6347', '#ff4500', '#ff0000', '#cd5c5c', '#b22222'];
                break;
            case 'blue':
                colors = ['#4169e1', '#0000ff', '#0000cd', '#00008b', '#000080'];
                break;
            case 'green':
                colors = ['#2ecc71', '#00ff00', '#008000', '#006400', '#00ff7f'];
                break;
            case 'yellow':
                colors = ['#f1c40f', '#ffff00', '#ffd700', '#ffa500', '#ff8c00'];
                break;
            case 'purple':
                colors = ['#8e44ad', '#9b59b6', '#800080', '#4b0082', '#663399'];
                break;
            case 'pink':
                colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#db7093', '#c71585'];
                break;
            case 'black':
                colors = ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666'];
                break;
            case 'rainbow':
                colors = [
                    '#ff0000', '#ff9a00', '#d0de21', '#4fdc4a',
                    '#3fdad8', '#2fc9e2', '#1c7fee', '#5f15f2',
                    '#ba0cf8', '#fb07d9'
                ];
                break;
            default:
                // Default confetti colors
                colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
        }
        
        // Create the confetti pieces in batches with staggered timing
        const confettiCount = 150; // Increase confetti count
        
        // Initially create a first batch
        for (let i = 0; i < 50; i++) {
            createConfetti(colors);
        }
        
        // Add more confetti with a slight delay
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                createConfetti(colors);
            }
        }, 300);
        
        // Add final batch with more delay
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                createConfetti(colors);
            }
        }, 600);
    }
    
    function stopConfetti() {
        // Clear the interval
        if (fireworksContainer.dataset.intervalId) {
            clearInterval(parseInt(fireworksContainer.dataset.intervalId));
        }
        
        // Remove all confetti
        fireworksContainer.innerHTML = '';
        fireworksContainer.className = 'fireworks-container';
    }
    
    function createConfetti(colors) {
        // Create a confetti element
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random shape
        const shapes = ['square', 'triangle', 'circle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.classList.add(shape);
        
        // Random position along the top of the screen
        const x = Math.random() * window.innerWidth;
        confetti.style.left = `${x}px`;
        
        // Varied starting heights (some higher than others)
        const startingHeight = -(Math.random() * 100 + 20); // Between -20px and -120px
        confetti.style.top = `${startingHeight}px`;
        
        // Random size
        const size = Math.random() * 10 + 5; // Between 5px and 15px for more variety
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        // Random rotation and drift for animation
        confetti.style.setProperty('--rotation', Math.random() * 16 - 8); // Increased rotation
        confetti.style.setProperty('--drift', Math.random() * 20 - 10); // Increased drift
        
        // Random animation duration for more natural effect
        const duration = 4 + Math.random() * 3; // Between 4-7 seconds
        confetti.style.setProperty('--duration', `${duration}s`);
        
        // Random color from the array
        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--color', color);
        
        // Add to container
        fireworksContainer.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000); // Match the removal time to the animation duration
    }
    
    function showWinMessage(message, winner = 0) {
        let messageHTML = message;
        
        // Add color to player mention if it's a win (not a tie)
        if (winner > 0) {
            messageHTML = message.replace(`Player ${winner}`, `<span class="player${winner}-color">Player ${winner}</span>`);
        }
        
        winMessageElement.innerHTML = messageHTML;
        winMessageElement.classList.add('active');
        
        // Automatically hide the message after 3 seconds
        setTimeout(() => {
            hideWinMessage();
        }, 3000);
    }
    
    function hideWinMessage() {
        // Only hide if it's visible
        if (winMessageElement.classList.contains('active')) {
            winMessageElement.classList.remove('active');
        }
    }
    
    function randomlyFillGrid(percentage) {
        // Calculate total number of possible lines
        const totalLines = 2 * gridSize * (gridSize - 1);
        const targetLines = Math.floor(totalLines * (percentage / 100)); // Fill based on percentage
        
        let filledCount = 0;
        let attempts = 0; // Initialize attempts counter
        const maxAttempts = totalLines * 5; // Prevent infinite loops
        let randomPlayer = Math.random() < 0.5 ? 1 : 2; // Randomly start with player 1 or 2
        
        // Generate list of all possible lines
        const possibleLines = [];
        
        // Add horizontal lines
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize - 1; x++) {
                possibleLines.push({
                    x1: x, 
                    y1: y, 
                    x2: x + 1, 
                    y2: y,
                    key: `${x},${y}-${x+1},${y}`
                });
            }
        }
        
        // Add vertical lines
        for (let y = 0; y < gridSize - 1; y++) {
            for (let x = 0; x < gridSize; x++) {
                possibleLines.push({
                    x1: x, 
                    y1: y, 
                    x2: x, 
                    y2: y + 1,
                    key: `${x},${y}-${x},${y+1}`
                });
            }
        }
        
        // Shuffle the array to randomize the order
        shuffleArray(possibleLines);
        
        // Clear the filled lines array
        filledLines = [];
        
        // Try to fill lines
        while (filledCount < targetLines && attempts < maxAttempts) {
            attempts++;
            
            if (possibleLines.length === 0) break; // No more lines to try
            
            const line = possibleLines.pop();
            
            // Check if this line would create a box with 3 sides
            if (!wouldCreate3SidedBox(line.x1, line.y1, line.x2, line.y2)) {
                // Add the line
                lines[line.key] = randomPlayer;
                filledCount++;
                
                // Keep track of which lines were filled
                filledLines.push(line.key);
                
                // Update the visual representation
                const lineElements = document.querySelectorAll('.line');
                for (const element of lineElements) {
                    if (element.dataset.x1 == line.x1 && 
                        element.dataset.y1 == line.y1 && 
                        element.dataset.x2 == line.x2 && 
                        element.dataset.y2 == line.y2) {
                        
                        element.classList.add('active', `player${randomPlayer}`);
                        break;
                    }
                }
                
                // Alternate player for next line
                randomPlayer = randomPlayer === 1 ? 2 : 1;
            }
        }
        
        // Set the current player to the next player in turn after random filling
        currentPlayer = randomPlayer;
        updateTurnIndicator();
    }
    
    function clearFilledLines() {
        // Remove all the lines added by the fill function
        filledLines.forEach(lineKey => {
            // Remove from data structure
            delete lines[lineKey];
            
            // Remove visual styling
            const [startCoord, endCoord] = lineKey.split('-');
            const [x1, y1] = startCoord.split(',').map(Number);
            const [x2, y2] = endCoord.split(',').map(Number);
            
            // Find the line element
            const lineElements = document.querySelectorAll('.line');
            for (const element of lineElements) {
                if (element.dataset.x1 == x1 && 
                    element.dataset.y1 == y1 && 
                    element.dataset.x2 == x2 && 
                    element.dataset.y2 == y2) {
                    
                    // Remove active class and player class
                    element.classList.remove('active', 'player1', 'player2');
                    break;
                }
            }
        });
        
        // Reset filled lines array
        filledLines = [];
        
        // Reset player turn to player 1
        currentPlayer = 1;
        updateTurnIndicator();
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Function to find and make all deterministic moves
    function makeAutomaticMoves() {
        // Find deterministic moves
        let moves = findAllDeterministicMoves();
        
        // If no moves found, return
        if (moves.length === 0) return;
        
        // Execute first move
        const move = moves[0];
            
        // Mark line as active
        lines[move.lineKey] = currentPlayer;
        move.element.classList.add('active', `player${currentPlayer}`);
        
        // Check for completed box
        const boxCompleted = checkForCompletedBoxes(move.x1, move.y1, move.x2, move.y2);
        
        // Update turn indicator (player doesn't change because they completed a box)
        updateTurnIndicator();
        
        // Check if game is over
        if (isGameOver()) {
            isGameFinished = true;
            const winner = scores[1] > scores[2] ? 1 : (scores[2] > scores[1] ? 2 : 0);
            
            if (winner === 0) {
                turnTextElement.textContent = "Game Over - It's a Tie!";
                showWinMessage("It's a Tie!");
            } else {
                const winnerText = winner === 1 ? "Player 1" : (vsComputerMode ? "Computer" : "Player 2");
                turnTextElement.textContent = `Game Over - ${winnerText} Wins!`;
                startConfetti(winner);
                showWinMessage(`${winnerText} Wins!`, winner);
            }
            return;
        }
        
        // Continue with next moves after delay
        setTimeout(() => {
            // Recursively check for more moves
            makeAutomaticMoves();
        }, 300);
    }
    
    // Function to find all deterministic moves
    function findAllDeterministicMoves() {
        const moves = [];
        
        // Check all potential boxes
        for (let y = 0; y < gridSize - 1; y++) {
            for (let x = 0; x < gridSize - 1; x++) {
                // Skip boxes that are already completed
                const boxKey = `${x},${y}`;
                if (boxes[boxKey]) continue;
                
                // Check the four lines of this box
                const top = `${x},${y}-${x+1},${y}`;
                const right = `${x+1},${y}-${x+1},${y+1}`;
                const bottom = `${x},${y+1}-${x+1},${y+1}`;
                const left = `${x},${y}-${x},${y+1}`;
                
                // Count how many sides are filled
                let sidesFilled = 0;
                let missingLine = null;
                let missingLineCoords = null;
                
                if (lines[top]) sidesFilled++;
                else {
                    missingLine = top;
                    missingLineCoords = { x1: x, y1: y, x2: x+1, y2: y };
                }
                
                if (lines[right]) sidesFilled++;
                else if (!missingLine) {
                    missingLine = right;
                    missingLineCoords = { x1: x+1, y1: y, x2: x+1, y2: y+1 };
                }
                
                if (lines[bottom]) sidesFilled++;
                else if (!missingLine) {
                    missingLine = bottom;
                    missingLineCoords = { x1: x, y1: y+1, x2: x+1, y2: y+1 };
                }
                
                if (lines[left]) sidesFilled++;
                else if (!missingLine) {
                    missingLine = left;
                    missingLineCoords = { x1: x, y1: y, x2: x, y2: y+1 };
                }
                
                // If this box has exactly 3 sides filled, we found a deterministic move
                if (sidesFilled === 3 && missingLine) {
                    // Find the corresponding line element
                    const lineElements = document.querySelectorAll('.line');
                    for (const element of lineElements) {
                        if (element.dataset.x1 == missingLineCoords.x1 && 
                            element.dataset.y1 == missingLineCoords.y1 && 
                            element.dataset.x2 == missingLineCoords.x2 && 
                            element.dataset.y2 == missingLineCoords.y2) {
                            
                            moves.push({
                                x1: parseInt(missingLineCoords.x1),
                                y1: parseInt(missingLineCoords.y1),
                                x2: parseInt(missingLineCoords.x2),
                                y2: parseInt(missingLineCoords.y2),
                                lineKey: missingLine,
                                element: element
                            });
                            break;
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    function checkForCompletedBoxes(x1, y1, x2, y2) {
        let boxCompleted = false;
        
        // Determine which boxes to check based on the line position
        const boxesToCheck = [];
        
        if (x1 === x2) {
            // Vertical line
            if (x1 > 0) boxesToCheck.push({ x: x1 - 1, y: Math.min(y1, y2) });
            if (x1 < gridSize - 1) boxesToCheck.push({ x: x1, y: Math.min(y1, y2) });
        } else {
            // Horizontal line
            if (y1 > 0) boxesToCheck.push({ x: Math.min(x1, x2), y: y1 - 1 });
            if (y1 < gridSize - 1) boxesToCheck.push({ x: Math.min(x1, x2), y: y1 });
        }
        
        // Check each potential box
        boxesToCheck.forEach(({ x, y }) => {
            const top = `${x},${y}-${x+1},${y}`;
            const right = `${x+1},${y}-${x+1},${y+1}`;
            const bottom = `${x},${y+1}-${x+1},${y+1}`;
            const left = `${x},${y}-${x},${y+1}`;
            
            if (lines[top] && lines[right] && lines[bottom] && lines[left]) {
                const boxKey = `${x},${y}`;
                
                // Skip if box is already claimed
                if (!boxes[boxKey]) {
                    boxes[boxKey] = currentPlayer;
                    const boxElement = document.getElementById(`box-${x}-${y}`);
                    boxElement.classList.add(`player${currentPlayer}`);
                    
                    // Set box text content based on player
                    if (currentPlayer === 1) {
                        boxElement.textContent = 'P1';
                    } else {
                        if (vsComputerMode) {
                            boxElement.textContent = 'AI';
                        } else {
                            boxElement.textContent = 'P2';
                        }
                    }
                    
                    // Update score
                    scores[currentPlayer]++;
                    updateScores();
                    
                    boxCompleted = true;
                }
            }
        });
        
        return boxCompleted;
    }
    
    // Function to update player colors
    function updatePlayerColor(playerNum, color) {
        // Remove old color classes
        const oldColorClass = playerNum === 1 ? player1Color : player2Color;
        document.body.classList.remove(`player${playerNum}-${oldColorClass}`);
        
        // Set new color
        if (playerNum === 1) {
            player1Color = color;
        } else {
            player2Color = color;
        }
        
        // Add new color class
        document.body.classList.add(`player${playerNum}-${color}`);
        
        // If both players have the same color, the last player to change gets priority
        if (player1Color === player2Color) {
            if (playerNum === 1) {
                document.body.classList.remove(`player2-${player2Color}`);
            } else {
                document.body.classList.remove(`player1-${player1Color}`);
            }
        }
        
        // Update confetti colors if needed
        if (isGameFinished) {
            const winner = scores[1] > scores[2] ? 1 : (scores[2] > scores[1] ? 2 : 0);
            if (winner > 0) {
                stopConfetti();
                startConfetti(winner);
            }
        }
    }
    
    // Function to update background color
    function updateBackgroundColor(color) {
        // Remove all background color classes
        document.body.classList.remove('bg-rainbow', 'bg-blue', 'bg-green', 'bg-purple', 'bg-pink', 'bg-gray', 'bg-black');
        
        // Set new background color
        backgroundColor = color;
        
        // Add new background color class
        document.body.classList.add(`bg-${color}`);
    }

    // Function to play sound effects if enabled
    function playSound(sound) {
        if (soundEnabled) {
            // Here you could implement actual sound effects
            console.log(`Playing sound: ${sound}`);
            // Example: const audio = new Audio(`sounds/${sound}.mp3`); audio.play();
        }
    }
}); 