import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.static(path.join(__dirname)));

// Game state
const lobbies = {};
const players = {};
const gameStates = {};

// Socket.io connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Handle player joining
  socket.on('player-join', (playerName) => {
    console.log(`Player ${socket.id} joined with name: ${playerName}`);
    players[socket.id] = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substring(0, 5)}`,
      inLobby: null
    };
    
    // Send available lobbies to the player
    const availableLobbies = getAvailableLobbies();
    console.log(`Sending available lobbies to ${socket.id}:`, availableLobbies);
    socket.emit('available-lobbies', availableLobbies);
  });
  
  // Create a new lobby
  socket.on('create-lobby', (lobbyData) => {
    console.log(`Player ${socket.id} creating lobby:`, lobbyData);
    const lobbyId = generateLobbyId();
    const player = players[socket.id];
    
    if (!player) {
      console.log(`Player ${socket.id} not found when creating lobby`);
      return;
    }
    
    const lobby = {
      id: lobbyId,
      name: lobbyData.name || `${player.name}'s Game`,
      host: socket.id,
      players: [socket.id],
      gridSize: lobbyData.gridSize || 8,
      fillPercentage: lobbyData.fillPercentage || 50,
      status: 'waiting', // waiting, playing, finished
      maxPlayers: 2
    };
    
    lobbies[lobbyId] = lobby;
    player.inLobby = lobbyId;
    
    // Join the socket room for this lobby
    socket.join(lobbyId);
    
    // Notify player of successful lobby creation
    socket.emit('lobby-created', lobby);
    
    // Notify all clients about the new lobby
    io.emit('available-lobbies', getAvailableLobbies());
  });
  
  // Join an existing lobby
  socket.on('join-lobby', (lobbyId) => {
    const lobby = lobbies[lobbyId];
    const player = players[socket.id];
    
    if (!lobby || !player) return;
    
    // Check if lobby is full
    if (lobby.players.length >= lobby.maxPlayers) {
      socket.emit('lobby-error', { message: 'This lobby is full' });
      return;
    }
    
    // Check if lobby is already in a game
    if (lobby.status !== 'waiting') {
      socket.emit('lobby-error', { message: 'This game has already started' });
      return;
    }
    
    // Add player to lobby
    lobby.players.push(socket.id);
    player.inLobby = lobbyId;
    
    // Join the socket room for this lobby
    socket.join(lobbyId);
    
    // Notify player of successful join
    socket.emit('lobby-joined', lobby);
    
    // Notify other players in lobby
    socket.to(lobbyId).emit('player-joined', {
      playerId: socket.id,
      playerName: player.name
    });
    
    // If lobby is now full, start the game
    if (lobby.players.length === lobby.maxPlayers) {
      initializeGame(lobbyId);
    }
    
    // Update available lobbies for all clients
    io.emit('available-lobbies', getAvailableLobbies());
  });
  
  // Leave lobby
  socket.on('leave-lobby', () => {
    const player = players[socket.id];
    if (!player || !player.inLobby) return;
    
    const lobbyId = player.inLobby;
    const lobby = lobbies[lobbyId];
    
    if (lobby) {
      // Remove player from lobby
      lobby.players = lobby.players.filter(id => id !== socket.id);
      
      // Notify other players
      socket.to(lobbyId).emit('player-left', {
        playerId: socket.id,
        playerName: player.name
      });
      
      // Leave the socket room
      socket.leave(lobbyId);
      
      // If lobby is empty, remove it
      if (lobby.players.length === 0) {
        delete lobbies[lobbyId];
        if (gameStates[lobbyId]) {
          delete gameStates[lobbyId];
        }
      } 
      // If host left, assign a new host
      else if (lobby.host === socket.id && lobby.players.length > 0) {
        lobby.host = lobby.players[0];
        io.to(lobbyId).emit('new-host', {
          lobbyId,
          host: lobby.host
        });
      }
      
      // Update lobby status
      if (lobby.status === 'playing' && lobby.players.length < 2) {
        lobby.status = 'waiting';
      }
      
      // Update available lobbies for all clients
      io.emit('available-lobbies', getAvailableLobbies());
    }
    
    // Update player state
    player.inLobby = null;
  });
  
  // Handle game moves
  socket.on('make-move', (moveData) => {
    const player = players[socket.id];
    if (!player || !player.inLobby) return;
    
    const lobbyId = player.inLobby;
    const gameState = gameStates[lobbyId];
    
    if (!gameState || gameState.status !== 'playing') return;
    
    // Validate the move (check if it's the player's turn, etc.)
    if (socket.id !== gameState.players[gameState.currentPlayer - 1]) {
      socket.emit('game-error', { message: "It's not your turn" });
      return;
    }
    
    // Update game state with the move
    const { x1, y1, x2, y2 } = moveData;
    const lineKey = `${x1},${y1}-${x2},${y2}`;
    
    // Check if line already exists
    if (gameState.lines[lineKey]) {
      socket.emit('game-error', { message: "This line has already been drawn" });
      return;
    }
    
    // Mark the line as drawn by this player
    gameState.lines[lineKey] = gameState.currentPlayer;
    
    // Check if a box was completed
    const boxCompleted = checkForCompletedBoxes(gameState, x1, y1, x2, y2);
    
    // Send the updated game state to all players in the lobby
    io.to(lobbyId).emit('game-update', {
      gameState: getClientGameState(gameState),
      lastMove: {
        lineKey,
        player: gameState.currentPlayer,
        boxCompleted
      }
    });
    
    // Check for game end
    if (isGameOver(gameState)) {
      const winner = determineWinner(gameState);
      gameState.status = 'finished';
      gameState.winner = winner;
      
      io.to(lobbyId).emit('game-over', {
        winner,
        scores: gameState.scores
      });
      
      // Update lobby status
      lobbies[lobbyId].status = 'finished';
    }
  });
  
  // Handle restart game request
  socket.on('restart-game', () => {
    const player = players[socket.id];
    if (!player || !player.inLobby) return;
    
    const lobbyId = player.inLobby;
    const lobby = lobbies[lobbyId];
    
    // Only the host can restart the game
    if (lobby && lobby.host === socket.id) {
      initializeGame(lobbyId);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const player = players[socket.id];
    if (player && player.inLobby) {
      // Handle player leaving the lobby
      const lobbyId = player.inLobby;
      const lobby = lobbies[lobbyId];
      
      if (lobby) {
        // Remove player from lobby
        lobby.players = lobby.players.filter(id => id !== socket.id);
        
        // Notify other players
        socket.to(lobbyId).emit('player-left', {
          playerId: socket.id,
          playerName: player.name
        });
        
        // If lobby is empty, remove it
        if (lobby.players.length === 0) {
          delete lobbies[lobbyId];
          if (gameStates[lobbyId]) {
            delete gameStates[lobbyId];
          }
        } 
        // If host left, assign a new host
        else if (lobby.host === socket.id && lobby.players.length > 0) {
          lobby.host = lobby.players[0];
          io.to(lobbyId).emit('new-host', {
            lobbyId,
            host: lobby.host
          });
        }
        
        // Update lobby status
        if (lobby.status === 'playing' && lobby.players.length < 2) {
          lobby.status = 'waiting';
          
          // Notify remaining player
          io.to(lobbyId).emit('opponent-disconnected');
        }
        
        // Update available lobbies for all clients
        io.emit('available-lobbies', getAvailableLobbies());
      }
    }
    
    // Remove player from players object
    delete players[socket.id];
  });
});

// Helper functions
function generateLobbyId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getAvailableLobbies() {
  // Only return lobbies that are in 'waiting' status and not full
  const availableLobbies = Object.values(lobbies)
    .filter(lobby => lobby.status === 'waiting' && lobby.players.length < lobby.maxPlayers)
    .map(lobby => ({
      id: lobby.id,
      name: lobby.name,
      host: players[lobby.host]?.name || 'Unknown',
      players: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
      gridSize: lobby.gridSize,
      fillPercentage: lobby.fillPercentage
    }));
  
  console.log('Available lobbies:', availableLobbies);
  return availableLobbies;
}

function initializeGame(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby || lobby.players.length < 2) return;
  
  // Set lobby status to playing
  lobby.status = 'playing';
  
  // Create new game state
  const gameState = {
    id: lobbyId,
    gridSize: lobby.gridSize,
    players: [...lobby.players],
    currentPlayer: 1, // Player 1 goes first
    lines: {},
    boxes: {},
    scores: { 1: 0, 2: 0 },
    status: 'playing'
  };
  
  gameStates[lobbyId] = gameState;
  
  // Randomly fill grid based on fill percentage (if specified)
  if (lobby.fillPercentage > 0) {
    randomlyFillGrid(gameState, lobby.fillPercentage);
  }
  
  // Notify all players that the game has started
  io.to(lobbyId).emit('game-start', {
    gameState: getClientGameState(gameState),
    playerIds: gameState.players
  });
}

function getClientGameState(gameState) {
  // Return a version of the game state suitable for clients
  return {
    gridSize: gameState.gridSize,
    currentPlayer: gameState.currentPlayer,
    lines: gameState.lines,
    boxes: gameState.boxes,
    scores: gameState.scores,
    status: gameState.status,
    winner: gameState.winner
  };
}

function checkForCompletedBoxes(gameState, x1, y1, x2, y2) {
  let boxCompleted = false;
  
  // Determine which boxes to check based on the line position
  const boxesToCheck = [];
  const { gridSize, currentPlayer, lines, boxes } = gameState;
  
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
        
        // Update score
        gameState.scores[currentPlayer]++;
        boxCompleted = true;
      }
    }
  });
  
  // Switch player if no box was completed
  if (!boxCompleted) {
    gameState.currentPlayer = currentPlayer === 1 ? 2 : 1;
  }
  
  return boxCompleted;
}

function isGameOver(gameState) {
  // Total possible boxes in the grid
  const totalBoxes = (gameState.gridSize - 1) * (gameState.gridSize - 1);
  
  // Check if all boxes are claimed
  return (gameState.scores[1] + gameState.scores[2]) === totalBoxes;
}

function determineWinner(gameState) {
  if (gameState.scores[1] > gameState.scores[2]) {
    return 1;
  } else if (gameState.scores[2] > gameState.scores[1]) {
    return 2;
  } else {
    return 0; // Tie
  }
}

function randomlyFillGrid(gameState, percentage) {
  const { gridSize } = gameState;
  
  // Calculate total number of possible lines
  const totalLines = 2 * gridSize * (gridSize - 1);
  const targetLines = Math.floor(totalLines * (percentage / 100));
  
  let filledCount = 0;
  let attempts = 0;
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
  
  // Try to fill lines
  while (filledCount < targetLines && attempts < maxAttempts) {
    attempts++;
    
    if (possibleLines.length === 0) break;
    
    const line = possibleLines.pop();
    
    // Check if this line would create a box with 3 sides
    if (!wouldCreate3SidedBox(gameState, line.x1, line.y1, line.x2, line.y2)) {
      // Add the line
      gameState.lines[line.key] = randomPlayer;
      filledCount++;
      
      // Alternate player for next line
      randomPlayer = randomPlayer === 1 ? 2 : 1;
    }
  }
  
  // Set the current player to the next player in turn after random filling
  gameState.currentPlayer = randomPlayer;
}

function wouldCreate3SidedBox(gameState, x1, y1, x2, y2) {
  // Determine which boxes to check based on the line position
  const boxesToCheck = [];
  const { gridSize, lines, boxes } = gameState;
  
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Add a route to test the server
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Dots & Boxes Server</title></head>
      <body>
        <h1>Dots & Boxes Server</h1>
        <p>This is the WebSocket server for the Dots & Boxes game.</p>
        <p>Please go to <a href="http://localhost:3000">http://localhost:3000</a> to play the game.</p>
      </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 