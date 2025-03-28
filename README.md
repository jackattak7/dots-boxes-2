# Dots & Boxes Game

A classic Dots and Boxes game implemented with HTML, CSS, and JavaScript, with Vite for development.

## How to Play

1. **Objective**: Connect dots with lines to form boxes. The player who forms more boxes wins.

2. **Rules**:
   - Players take turns drawing a single line between two adjacent dots (horizontally or vertically).
   - When a player completes the fourth side of a box, they claim that box by marking it with their color/initial.
   - When a player completes a box, they get another turn.
   - The game ends when all possible lines have been drawn.
   - The player with the most boxes wins.

3. **Game Features**:
   - Select different grid sizes (5×5, 6×6, 7×7, 8×8)
   - Track scores for both players
   - Visual indication of whose turn it is
   - Ability to start a new game

## How to Run

### Development Mode

1. Install dependencies:
   ```
   npm install
   ```

2. Run development server:
   ```
   npm run dev
   ```

3. Open your browser at `http://localhost:3000` (it should open automatically)

### Production Build

1. Build for production:
   ```
   npm run build
   ```

2. Preview the production build:
   ```
   npm run preview
   ```

## Game Controls

- **Grid Size**: Use the dropdown menu to select a different grid size.
- **New Game**: Click the "New Game" button to reset the game with the current grid size.
- **Playing**: Click on any gray line to claim it. If you complete a box, you'll get another turn.

Enjoy playing Dots & Boxes! 