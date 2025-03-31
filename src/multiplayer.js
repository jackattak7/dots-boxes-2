// Socket.io client-side code for multiplayer lobby system
import { io } from 'socket.io-client';

class MultiplayerManager {
  constructor() {
    this.socket = null;
    this.playerName = '';
    this.currentLobby = null;
    this.gameCallbacks = {};
    this.onLobbiesUpdated = null;
    this.onLobbyJoined = null;
    this.onGameStarted = null;
    this.onGameUpdated = null;
    this.onGameOver = null;
    this.onError = null;
    this.onOpponentDisconnected = null;
    this.onPlayerLeft = null;
    this.onPlayerJoined = null;
    this.isConnected = false;
    this.playerId = null;
  }

  // Initialize socket connection
  connect(playerName = '') {
    // Connect to socket server with auto-reconnect and explicit transports
    const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
    console.log('Connecting to socket server at:', serverUrl);
    
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    this.playerName = playerName || localStorage.getItem('playerName') || '';
    
    // Store player name for future use
    if (this.playerName) {
      localStorage.setItem('playerName', this.playerName);
    }

    // Socket connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server with id:', this.socket.id);
      this.isConnected = true;
      this.playerId = this.socket.id;
      
      // Send player join event with player name
      this.socket.emit('player-join', this.playerName);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('available-lobbies', (lobbies) => {
      console.log('Available lobbies:', lobbies);
      if (this.onLobbiesUpdated) {
        this.onLobbiesUpdated(lobbies);
      }
    });

    this.socket.on('lobby-created', (lobby) => {
      console.log('Lobby created:', lobby);
      this.currentLobby = lobby;
      if (this.onLobbyJoined) {
        this.onLobbyJoined(lobby);
      }
    });

    this.socket.on('lobby-joined', (lobby) => {
      console.log('Joined lobby:', lobby);
      this.currentLobby = lobby;
      if (this.onLobbyJoined) {
        this.onLobbyJoined(lobby);
      }
    });

    this.socket.on('player-joined', (player) => {
      console.log('Player joined lobby:', player);
      if (this.onPlayerJoined) {
        this.onPlayerJoined(player);
      }
    });

    this.socket.on('player-left', (player) => {
      console.log('Player left lobby:', player);
      if (this.onPlayerLeft) {
        this.onPlayerLeft(player);
      }
    });

    this.socket.on('lobby-error', (error) => {
      console.error('Lobby error:', error);
      if (this.onError) {
        this.onError(error.message);
      }
    });

    this.socket.on('game-start', (data) => {
      console.log('Game started:', data);
      if (this.onGameStarted) {
        this.onGameStarted(data);
      }
    });

    this.socket.on('game-update', (data) => {
      console.log('Game update received:', data);
      if (this.onGameUpdated) {
        this.onGameUpdated(data);
      }
    });

    this.socket.on('game-over', (data) => {
      console.log('Game over:', data);
      if (this.onGameOver) {
        this.onGameOver(data);
      }
    });

    this.socket.on('game-error', (error) => {
      console.error('Game error:', error);
      if (this.onError) {
        this.onError(error.message);
      }
    });

    this.socket.on('opponent-disconnected', () => {
      console.log('Opponent disconnected');
      if (this.onOpponentDisconnected) {
        this.onOpponentDisconnected();
      }
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Create a new lobby
  createLobby(lobbyName, gridSize = 8, fillPercentage = 50) {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('create-lobby', {
      name: lobbyName,
      gridSize,
      fillPercentage
    });
  }

  // Join an existing lobby
  joinLobby(lobbyId) {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('join-lobby', lobbyId);
  }

  // Leave current lobby
  leaveLobby() {
    if (!this.socket || !this.isConnected || !this.currentLobby) {
      console.error('Not in a lobby');
      return;
    }

    this.socket.emit('leave-lobby');
    this.currentLobby = null;
  }

  // Make a move in the game
  makeMove(x1, y1, x2, y2) {
    if (!this.socket || !this.isConnected || !this.currentLobby) {
      console.error('Not in a game');
      return;
    }

    this.socket.emit('make-move', { x1, y1, x2, y2 });
  }

  // Request to restart the game (only host can do this)
  restartGame() {
    if (!this.socket || !this.isConnected || !this.currentLobby) {
      console.error('Not in a game');
      return;
    }

    this.socket.emit('restart-game');
  }

  // Refresh lobby list
  refreshLobbies() {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('player-join', this.playerName);
  }

  // Set player name
  setPlayerName(name) {
    this.playerName = name;
    localStorage.setItem('playerName', name);
    
    // If already connected, update the server
    if (this.socket && this.isConnected) {
      this.socket.emit('player-join', name);
    }
  }

  // Check if player is in a lobby
  isInLobby() {
    return !!this.currentLobby;
  }

  // Check if player is the host of the current lobby
  isHost() {
    return this.currentLobby && this.currentLobby.host === this.socket?.id;
  }
}

// Export a singleton instance
const multiplayer = new MultiplayerManager();
export default multiplayer; 