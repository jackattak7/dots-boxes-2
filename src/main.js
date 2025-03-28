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
    
    // Game data structures
    let lines = {}; // Format: "x1,y1-x2,y2": playerId
    let boxes = {}; // Format: "x,y": playerId
    
    // Initialize the game
    initGame();
    
    // Event listeners
    newGameButton.addEventListener('click', () => {
        stopFireworks();
        initGame();
    });
    
    gridSizeSelect.addEventListener('change', () => {
        stopFireworks();
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
    
    function initGame() {
        // Reset game state
        currentPlayer = 1;
        scores = { 1: 0, 2: 0 };
        lines = {};
        boxes = {};
        isGameFinished = false;
        isGridFilled = false;
        currentFillPercentage = 50;
        filledLines = [];
        
        // Set auto-fill toggle to checked by default
        if (autoFillToggle) {
            autoFillToggle.checked = true;
        }
        
        // Set fill-grid select to 50% by default
        if (fillGridSelect) {
            fillGridSelect.value = "50";
        }
        
        // Set grid size select to 8x8 by default
        if (gridSizeSelect) {
            gridSizeSelect.value = "8";
        }

        // Update scores display
        updateScores();
        
        // Update turn indicator
        updateTurnIndicator();

        // Hide win message
        winMessageElement.classList.remove('active');
        
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
        
        // Fill grid with 50% random lines
        randomlyFillGrid(currentFillPercentage);
    }
    
    function handleLineClick(event) {
        // If game is already finished, ignore clicks
        if (isGameFinished) {
            return;
        }
        
        const { x1, y1, x2, y2 } = event.target.dataset;
        const lineKey = `${x1},${y1}-${x2},${y2}`;
        
        // Check if line is already active
        if (lines[lineKey]) {
            return;
        }
        
        // Mark the line as active
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
        }
        
        // Update turn indicator
        updateTurnIndicator();
        
        // Check if game is over
        if (isGameOver()) {
            isGameFinished = true;
            const winner = scores[1] > scores[2] ? 1 : (scores[2] > scores[1] ? 2 : 0);
            
            if (winner === 0) {
                turnTextElement.textContent = "Game Over - It's a Tie!";
                showWinMessage("It's a Tie!");
            } else {
                turnTextElement.textContent = `Game Over - Player ${winner} Wins!`;
                startFireworks(winner);
                showWinMessage(`Player ${winner} Wins!`, winner);
            }
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
                turnTextElement.textContent = `Game Over - Player ${winner} Wins!`;
                startFireworks(winner);
                showWinMessage(`Player ${winner} Wins!`, winner);
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
                    boxElement.textContent = currentPlayer === 1 ? 'P1' : 'P2';
                    
                    // Update score
                    scores[currentPlayer]++;
                    updateScores();
                    
                    boxCompleted = true;
                }
            }
        });
        
        return boxCompleted;
    }
    
    function updateScores() {
        player1ScoreElement.textContent = scores[1];
        player2ScoreElement.textContent = scores[2];
    }
    
    function updateTurnIndicator() {
        if (!isGameFinished) {
            turnTextElement.textContent = `Player ${currentPlayer}'s turn`;
        }
    }
    
    function isGameOver() {
        // Total possible boxes in the grid
        const totalBoxes = (gridSize - 1) * (gridSize - 1);
        
        // Check if all boxes are claimed
        return (scores[1] + scores[2]) === totalBoxes;
    }
    
    // Fireworks functions
    function startFireworks(winner) {
        // Clear any existing fireworks
        fireworksContainer.innerHTML = '';
        fireworksContainer.className = 'fireworks-container active';
        
        // Add winner class to container
        fireworksContainer.classList.add(`player${winner}-win`);
        
        // Initial burst of fireworks
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                createFirework();
            }, i * 100);
        }
        
        // Launch multiple fireworks
        const fireworksInterval = setInterval(() => {
            createFirework();
            createFirework();
        }, 200);
        
        // Store interval ID on the container to clear it later
        fireworksContainer.dataset.intervalId = fireworksInterval;
        
        // Stop after 8 seconds
        setTimeout(() => {
            stopFireworks();
        }, 8000);
    }
    
    function stopFireworks() {
        // Clear the interval
        if (fireworksContainer.dataset.intervalId) {
            clearInterval(parseInt(fireworksContainer.dataset.intervalId));
        }
        
        // Remove all fireworks
        fireworksContainer.innerHTML = '';
        fireworksContainer.className = 'fireworks-container';
    }
    
    function createFirework() {
        // Create a firework element
        const firework = document.createElement('div');
        firework.className = 'firework';
        
        // Start position at bottom of screen with random x
        const x = Math.random() * window.innerWidth;
        firework.style.left = `${x}px`;
        firework.style.bottom = '0';
        
        // Add to container first (to establish initial position)
        fireworksContainer.appendChild(firework);
        
        // After a short delay, animate the firework rising
        setTimeout(() => {
            // Random rise height
            const riseHeight = Math.random() * (window.innerHeight * 0.6) + (window.innerHeight * 0.2);
            firework.style.bottom = `${riseHeight}px`;
            
            // Create explosion after rise is complete
            setTimeout(() => {
                // Create particles for explosion
                const particleCount = Math.floor(Math.random() * 10) + 20; // 20-30 particles
                for (let i = 0; i < particleCount; i++) {
                    createParticle(firework);
                }
            }, 1200); // Wait for firework to reach peak
        }, 50);
        
        // Remove after animation
        setTimeout(() => {
            firework.remove();
        }, 2800);
    }
    
    function createParticle(firework) {
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 120 + 80; // Much larger distance
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        // Create particle with custom properties
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.setProperty('--x', `${x}px`);
        particle.style.setProperty('--y', `${y}px`);
        
        firework.appendChild(particle);
    }
    
    function showWinMessage(message, winner = 0) {
        let messageHTML = message;
        
        // Add color to player mention if it's a win (not a tie)
        if (winner > 0) {
            messageHTML = message.replace(`Player ${winner}`, `<span class="player${winner}-color">Player ${winner}</span>`);
        }
        
        winMessageElement.innerHTML = messageHTML;
        winMessageElement.classList.add('active');
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
    
    function wouldCreate3SidedBox(x1, y1, x2, y2) {
        // Check boxes that would be affected by this line
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
        
        // Check if any of the boxes would have 3 sides
        for (const box of boxesToCheck) {
            const { x, y } = box;
            const top = `${x},${y}-${x+1},${y}`;
            const right = `${x+1},${y}-${x+1},${y+1}`;
            const bottom = `${x},${y+1}-${x+1},${y+1}`;
            const left = `${x},${y}-${x},${y+1}`;
            
            // Count how many sides are already filled
            let sidesFilled = 0;
            if (lines[top]) sidesFilled++;
            if (lines[right]) sidesFilled++;
            if (lines[bottom]) sidesFilled++;
            if (lines[left]) sidesFilled++;
            
            // Check if this new line would be the third side
            let wouldBeThirdSide = false;
            
            // Determine which side this new line represents for this box
            const newLineKey = `${x1},${y1}-${x2},${y2}`;
            if (newLineKey === top || newLineKey === right || 
                newLineKey === bottom || newLineKey === left) {
                wouldBeThirdSide = (sidesFilled === 2);
            }
            
            if (wouldBeThirdSide) {
                return true;
            }
        }
        
        return false;
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}); 