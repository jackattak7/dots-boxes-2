// Lobby UI handling
import multiplayer from './multiplayer.js';

class LobbyUI {
  constructor() {
    this.lobbyContainer = null;
    this.gameContainer = null;
    this.lobbyListElement = null;
    this.lobbyDetailsElement = null;
    this.playerNameInput = null;
    this.createLobbyForm = null;
    this.joinLobbyBtn = null;
    this.leaveLobbyBtn = null;
    this.errorMessageElement = null;
    this.isInitialized = false;
    this.isInGame = false;
    this.playerRole = null; // 1 for player 1, 2 for player 2
    this.opponentId = null;
  }

  initialize() {
    if (this.isInitialized) return;

    this.createLobbyUI();
    this.setupEventListeners();
    this.setupMultiplayerCallbacks();
    this.isInitialized = true;
    
    // Add debug button in development
    this.addDebugControls();
  }

  createLobbyUI() {
    // Create main lobby container
    this.lobbyContainer = document.createElement('div');
    this.lobbyContainer.className = 'lobby-container';
    this.lobbyContainer.style.display = 'none';

    // Create player name section
    const playerNameSection = document.createElement('div');
    playerNameSection.className = 'player-name-section';
    
    const playerNameLabel = document.createElement('label');
    playerNameLabel.textContent = 'Your Name:';
    playerNameLabel.setAttribute('for', 'player-name-input');
    
    this.playerNameInput = document.createElement('input');
    this.playerNameInput.type = 'text';
    this.playerNameInput.id = 'player-name-input';
    this.playerNameInput.placeholder = 'Enter your name';
    this.playerNameInput.value = localStorage.getItem('playerName') || '';
    
    const saveNameBtn = document.createElement('button');
    saveNameBtn.textContent = 'Save Name';
    saveNameBtn.id = 'save-name-btn';
    
    playerNameSection.appendChild(playerNameLabel);
    playerNameSection.appendChild(this.playerNameInput);
    playerNameSection.appendChild(saveNameBtn);
    
    // Create lobby list section
    const lobbyListSection = document.createElement('div');
    lobbyListSection.className = 'lobby-list-section';
    
    const lobbyListHeader = document.createElement('h3');
    lobbyListHeader.textContent = 'Available Games';
    
    this.lobbyListElement = document.createElement('div');
    this.lobbyListElement.className = 'lobby-list';
    
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh List';
    refreshBtn.id = 'refresh-lobbies-btn';
    
    lobbyListSection.appendChild(lobbyListHeader);
    lobbyListSection.appendChild(this.lobbyListElement);
    lobbyListSection.appendChild(refreshBtn);
    
    // Create lobby creation section
    const createLobbySection = document.createElement('div');
    createLobbySection.className = 'create-lobby-section';
    
    const createLobbyHeader = document.createElement('h3');
    createLobbyHeader.textContent = 'Create a New Game';
    
    this.createLobbyForm = document.createElement('form');
    this.createLobbyForm.id = 'create-lobby-form';
    
    const lobbyNameLabel = document.createElement('label');
    lobbyNameLabel.textContent = 'Game Name:';
    lobbyNameLabel.setAttribute('for', 'lobby-name-input');
    
    const lobbyNameInput = document.createElement('input');
    lobbyNameInput.type = 'text';
    lobbyNameInput.id = 'lobby-name-input';
    lobbyNameInput.placeholder = 'My Game';
    
    const gridSizeLabel = document.createElement('label');
    gridSizeLabel.textContent = 'Grid Size:';
    gridSizeLabel.setAttribute('for', 'lobby-grid-size');
    
    const gridSizeSelect = document.createElement('select');
    gridSizeSelect.id = 'lobby-grid-size';
    
    const gridSizes = [5, 6, 7, 8, 10, 12];
    gridSizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = `${size}×${size}`;
      if (size === 8) option.selected = true;
      gridSizeSelect.appendChild(option);
    });
    
    const fillPercentageLabel = document.createElement('label');
    fillPercentageLabel.textContent = 'Fill Percentage:';
    fillPercentageLabel.setAttribute('for', 'lobby-fill-percentage');
    
    const fillPercentageSelect = document.createElement('select');
    fillPercentageSelect.id = 'lobby-fill-percentage';
    
    const fillPercentages = [0, 10, 20, 30, 40, 50];
    fillPercentages.forEach(percentage => {
      const option = document.createElement('option');
      option.value = percentage;
      option.textContent = `${percentage}%`;
      if (percentage === 50) option.selected = true;
      fillPercentageSelect.appendChild(option);
    });
    
    const createGameBtn = document.createElement('button');
    createGameBtn.type = 'submit';
    createGameBtn.textContent = 'Create Game';
    
    this.createLobbyForm.appendChild(lobbyNameLabel);
    this.createLobbyForm.appendChild(lobbyNameInput);
    this.createLobbyForm.appendChild(gridSizeLabel);
    this.createLobbyForm.appendChild(gridSizeSelect);
    this.createLobbyForm.appendChild(fillPercentageLabel);
    this.createLobbyForm.appendChild(fillPercentageSelect);
    this.createLobbyForm.appendChild(createGameBtn);
    
    createLobbySection.appendChild(createLobbyHeader);
    createLobbySection.appendChild(this.createLobbyForm);
    
    // Create lobby details section (shown when in a lobby)
    this.lobbyDetailsElement = document.createElement('div');
    this.lobbyDetailsElement.className = 'lobby-details';
    this.lobbyDetailsElement.style.display = 'none';
    
    const lobbyDetailsHeader = document.createElement('h3');
    lobbyDetailsHeader.textContent = 'Game Details';
    lobbyDetailsHeader.id = 'lobby-details-header';
    
    const lobbyDetailsInfo = document.createElement('div');
    lobbyDetailsInfo.className = 'lobby-details-info';
    lobbyDetailsInfo.id = 'lobby-details-info';
    
    this.leaveLobbyBtn = document.createElement('button');
    this.leaveLobbyBtn.textContent = 'Leave Game';
    this.leaveLobbyBtn.id = 'leave-lobby-btn';
    
    this.lobbyDetailsElement.appendChild(lobbyDetailsHeader);
    this.lobbyDetailsElement.appendChild(lobbyDetailsInfo);
    this.lobbyDetailsElement.appendChild(this.leaveLobbyBtn);
    
    // Create error message element
    this.errorMessageElement = document.createElement('div');
    this.errorMessageElement.className = 'error-message';
    this.errorMessageElement.style.display = 'none';
    
    // Add all sections to the lobby container
    this.lobbyContainer.appendChild(playerNameSection);
    this.lobbyContainer.appendChild(lobbyListSection);
    this.lobbyContainer.appendChild(createLobbySection);
    this.lobbyContainer.appendChild(this.lobbyDetailsElement);
    this.lobbyContainer.appendChild(this.errorMessageElement);
    
    // Add the lobby container to the document
    document.body.appendChild(this.lobbyContainer);
    
    // Add the lobby toggle button to the game controls
    const gameControls = document.querySelector('.controls');
    if (gameControls) {
      const lobbyToggleContainer = document.createElement('div');
      lobbyToggleContainer.className = 'lobby-toggle';
      
      const onlineModeBtn = document.createElement('button');
      onlineModeBtn.textContent = 'Online Mode';
      onlineModeBtn.id = 'online-mode-btn';
      
      lobbyToggleContainer.appendChild(onlineModeBtn);
      gameControls.appendChild(lobbyToggleContainer);
    }
  }

  setupEventListeners() {
    // Handle online mode button click
    const onlineModeBtn = document.getElementById('online-mode-btn');
    if (onlineModeBtn) {
      onlineModeBtn.addEventListener('click', () => {
        this.toggleLobbyUI();
      });
    }
    
    // Handle player name save
    const saveNameBtn = document.getElementById('save-name-btn');
    if (saveNameBtn) {
      saveNameBtn.addEventListener('click', () => {
        const playerName = this.playerNameInput.value.trim();
        if (playerName) {
          multiplayer.setPlayerName(playerName);
          this.showMessage('Name saved!', 'success');
        } else {
          this.showError('Please enter a name');
        }
      });
    }
    
    // Handle lobby creation
    this.createLobbyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      console.log('Create lobby form submitted');
      
      const lobbyNameInput = document.getElementById('lobby-name-input');
      const gridSizeSelect = document.getElementById('lobby-grid-size');
      const fillPercentageSelect = document.getElementById('lobby-fill-percentage');
      
      const lobbyName = lobbyNameInput.value.trim() || `${multiplayer.playerName}'s Game`;
      const gridSize = parseInt(gridSizeSelect.value);
      const fillPercentage = parseInt(fillPercentageSelect.value);
      
      console.log('Creating lobby with:', { lobbyName, gridSize, fillPercentage });
      
      if (!multiplayer.playerName) {
        this.showError('Please set your name before creating a game');
        return;
      }
      
      if (!multiplayer.isConnected) {
        console.log('Not connected to server, attempting to connect');
        multiplayer.connect(multiplayer.playerName);
        setTimeout(() => {
          if (multiplayer.isConnected) {
            multiplayer.createLobby(lobbyName, gridSize, fillPercentage);
          } else {
            this.showError('Failed to connect to server. Please try again.');
          }
        }, 1000);
      } else {
        multiplayer.createLobby(lobbyName, gridSize, fillPercentage);
      }
    });
    
    // Handle refresh button
    const refreshBtn = document.getElementById('refresh-lobbies-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        multiplayer.refreshLobbies();
      });
    }
    
    // Handle leave lobby button
    this.leaveLobbyBtn.addEventListener('click', () => {
      multiplayer.leaveLobby();
      this.hideLobbyDetails();
      this.showLobbyList();
    });
  }

  setupMultiplayerCallbacks() {
    // Connect to the multiplayer server when UI is initialized
    const storedName = localStorage.getItem('playerName') || '';
    multiplayer.connect(storedName);
    
    // Handle available lobbies update
    multiplayer.onLobbiesUpdated = (lobbies) => {
      this.updateLobbyList(lobbies);
    };
    
    // Handle joining a lobby
    multiplayer.onLobbyJoined = (lobby) => {
      this.showLobbyDetails(lobby);
      this.hideLobbyList();
    };
    
    // Handle players joining/leaving
    multiplayer.onPlayerJoined = (player) => {
      this.updateLobbyDetails();
      this.showMessage(`${player.playerName} joined the game`, 'info');
    };
    
    multiplayer.onPlayerLeft = (player) => {
      this.updateLobbyDetails();
      this.showMessage(`${player.playerName} left the game`, 'info');
      
      // If in a game, return to lobby
      if (this.isInGame) {
        this.exitGame();
      }
    };
    
    // Handle errors
    multiplayer.onError = (message) => {
      this.showError(message);
    };
    
    // Handle game starting
    multiplayer.onGameStarted = (data) => {
      this.startMultiplayerGame(data);
    };
    
    // Handle game updates
    multiplayer.onGameUpdated = (data) => {
      this.updateMultiplayerGame(data);
    };
    
    // Handle game over
    multiplayer.onGameOver = (data) => {
      this.handleGameOver(data);
    };
    
    // Handle opponent disconnecting
    multiplayer.onOpponentDisconnected = () => {
      this.showError('Your opponent disconnected');
      this.exitGame();
    };
  }

  toggleLobbyUI() {
    const mainGameUI = document.querySelector('.container');
    
    if (this.lobbyContainer.style.display === 'none') {
      // Show lobby UI
      mainGameUI.style.display = 'none';
      this.lobbyContainer.style.display = 'block';
      
      // Connect to multiplayer server if not already connected
      if (!multiplayer.isConnected) {
        multiplayer.connect(this.playerNameInput.value.trim());
      }
    } else {
      // Hide lobby UI
      mainGameUI.style.display = 'flex';
      this.lobbyContainer.style.display = 'none';
      
      // If in a multiplayer game, ask for confirmation
      if (multiplayer.isInLobby()) {
        if (confirm('Are you sure you want to leave the online game?')) {
          multiplayer.leaveLobby();
        } else {
          // If user cancels, stay in lobby
          mainGameUI.style.display = 'none';
          this.lobbyContainer.style.display = 'block';
        }
      }
    }
  }

  updateLobbyList(lobbies) {
    this.lobbyListElement.innerHTML = '';
    
    if (lobbies.length === 0) {
      const noLobbiesMsg = document.createElement('p');
      noLobbiesMsg.className = 'no-lobbies-message';
      noLobbiesMsg.textContent = 'No games available. Create a new one!';
      this.lobbyListElement.appendChild(noLobbiesMsg);
      return;
    }
    
    lobbies.forEach(lobby => {
      const lobbyItem = document.createElement('div');
      lobbyItem.className = 'lobby-item';
      
      const lobbyName = document.createElement('div');
      lobbyName.className = 'lobby-name';
      lobbyName.textContent = lobby.name;
      
      const lobbyDetails = document.createElement('div');
      lobbyDetails.className = 'lobby-item-details';
      lobbyDetails.textContent = `Host: ${lobby.host} | Grid: ${lobby.gridSize}×${lobby.gridSize} | Players: ${lobby.players}/${lobby.maxPlayers}`;
      
      const joinBtn = document.createElement('button');
      joinBtn.className = 'join-lobby-btn';
      joinBtn.textContent = 'Join';
      joinBtn.dataset.lobbyId = lobby.id;
      joinBtn.addEventListener('click', () => {
        if (!multiplayer.playerName) {
          this.showError('Please set your name before joining a game');
          return;
        }
        multiplayer.joinLobby(lobby.id);
      });
      
      lobbyItem.appendChild(lobbyName);
      lobbyItem.appendChild(lobbyDetails);
      lobbyItem.appendChild(joinBtn);
      
      this.lobbyListElement.appendChild(lobbyItem);
    });
  }

  showLobbyDetails(lobby) {
    const lobbyDetailsHeader = document.getElementById('lobby-details-header');
    const lobbyDetailsInfo = document.getElementById('lobby-details-info');
    
    if (lobbyDetailsHeader) {
      lobbyDetailsHeader.textContent = lobby.name;
    }
    
    if (lobbyDetailsInfo) {
      lobbyDetailsInfo.innerHTML = `
        <p><strong>Host:</strong> ${lobby.host === multiplayer.playerId ? 'You' : 'Other Player'}</p>
        <p><strong>Grid Size:</strong> ${lobby.gridSize}×${lobby.gridSize}</p>
        <p><strong>Players:</strong> ${lobby.players.length}/${lobby.maxPlayers}</p>
        <p><strong>Status:</strong> ${lobby.status === 'waiting' ? 'Waiting for players' : 'Game in progress'}</p>
      `;
    }
    
    this.lobbyDetailsElement.style.display = 'block';
  }

  updateLobbyDetails() {
    if (!multiplayer.currentLobby) return;
    
    const lobby = multiplayer.currentLobby;
    const lobbyDetailsInfo = document.getElementById('lobby-details-info');
    
    if (lobbyDetailsInfo) {
      lobbyDetailsInfo.innerHTML = `
        <p><strong>Host:</strong> ${lobby.host === multiplayer.playerId ? 'You' : 'Other Player'}</p>
        <p><strong>Grid Size:</strong> ${lobby.gridSize}×${lobby.gridSize}</p>
        <p><strong>Players:</strong> ${lobby.players.length}/${lobby.maxPlayers}</p>
        <p><strong>Status:</strong> ${lobby.status === 'waiting' ? 'Waiting for players' : 'Game in progress'}</p>
      `;
    }
  }

  hideLobbyDetails() {
    this.lobbyDetailsElement.style.display = 'none';
  }

  showLobbyList() {
    document.querySelector('.lobby-list-section').style.display = 'block';
    document.querySelector('.create-lobby-section').style.display = 'block';
  }

  hideLobbyList() {
    document.querySelector('.lobby-list-section').style.display = 'none';
    document.querySelector('.create-lobby-section').style.display = 'none';
  }

  showError(message) {
    this.errorMessageElement.textContent = message;
    this.errorMessageElement.style.display = 'block';
    this.errorMessageElement.className = 'error-message error';
    
    setTimeout(() => {
      this.errorMessageElement.style.display = 'none';
    }, 5000);
  }

  showMessage(message, type = 'info') {
    this.errorMessageElement.textContent = message;
    this.errorMessageElement.style.display = 'block';
    this.errorMessageElement.className = `error-message ${type}`;
    
    setTimeout(() => {
      this.errorMessageElement.style.display = 'none';
    }, 3000);
  }

  startMultiplayerGame(data) {
    // Hide lobby UI and show game UI
    this.lobbyContainer.style.display = 'none';
    document.querySelector('.container').style.display = 'flex';
    
    // Determine player role
    this.playerRole = data.playerIds[0] === multiplayer.playerId ? 1 : 2;
    this.opponentId = data.playerIds[this.playerRole === 1 ? 1 : 0];
    this.isInGame = true;
    
    // Let the game know we're in a multiplayer game
    window.isMultiplayerGame = true;
    window.multiplayerRole = this.playerRole;
    
    // Reset and setup the game board
    const gameState = data.gameState;
    window.setupMultiplayerGame(gameState, this.playerRole);
  }

  updateMultiplayerGame(data) {
    // Update the game state on the client
    window.updateMultiplayerGameState(data.gameState, data.lastMove);
  }

  handleGameOver(data) {
    // Handle game over in multiplayer mode
    window.handleMultiplayerGameOver(data.winner, data.scores);
  }

  exitGame() {
    this.isInGame = false;
    window.isMultiplayerGame = false;
    window.multiplayerRole = null;
    
    // Show lobby UI
    this.lobbyContainer.style.display = 'block';
    document.querySelector('.container').style.display = 'none';
    
    // Reset game state
    window.resetMultiplayerGame();
  }

  // Debug methods to help troubleshoot issues
  addDebugControls() {
    const debugContainer = document.createElement('div');
    debugContainer.className = 'debug-controls';
    debugContainer.style.padding = '10px';
    debugContainer.style.marginTop = '20px';
    debugContainer.style.border = '1px solid #ddd';
    
    const debugTitle = document.createElement('h3');
    debugTitle.textContent = 'Debug Controls';
    
    const connectionStatusBtn = document.createElement('button');
    connectionStatusBtn.textContent = 'Check Connection';
    connectionStatusBtn.addEventListener('click', () => {
      console.log('Connection status:', {
        isConnected: multiplayer.isConnected,
        socketId: multiplayer.socket?.id,
        currentLobby: multiplayer.currentLobby
      });
      alert(`Connected: ${multiplayer.isConnected}\nSocket ID: ${multiplayer.socket?.id || 'none'}`);
    });
    
    const reconnectBtn = document.createElement('button');
    reconnectBtn.textContent = 'Reconnect';
    reconnectBtn.addEventListener('click', () => {
      multiplayer.disconnect();
      setTimeout(() => {
        multiplayer.connect(multiplayer.playerName);
      }, 500);
    });
    
    debugContainer.appendChild(debugTitle);
    debugContainer.appendChild(connectionStatusBtn);
    debugContainer.appendChild(reconnectBtn);
    
    this.lobbyContainer.appendChild(debugContainer);
  }
}

// Create and export singleton instance
const lobbyUI = new LobbyUI();
export default lobbyUI; 