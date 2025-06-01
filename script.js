document.addEventListener("DOMContentLoaded", () => {
  // Game elements - DOM references
  const tiles = document.querySelectorAll(".tile");
  const startButton = document.getElementById("start-btn");
  const rulesButton = document.getElementById("rules-btn");
  const messageDisplay = document.getElementById("message");
  const levelDisplay = document.getElementById("level");
  const scoreDisplay = document.getElementById("score");
  const highScoreDisplay = document.getElementById("high-score");
  const rulesModal = document.getElementById("rules-modal");
  const closeModal = document.getElementById("close-modal");

  // Game state variables
  let sequence = []; // The pattern to remember
  let playerSequence = []; // The player's input pattern
  let level = 1; // Current level (length of sequence)
  let score = 0; // Player's current score
  let highScore = localStorage.getItem("luminousHighScore") || 0;
  let gameActive = false; // Whether a game is in progress
  let playerTurn = false; // Whether it's the player's turn to input

  // Initialize high score display from localStorage
  highScoreDisplay.textContent = highScore;

  // Audio context and sound configuration
  let audioContext;
  const notes = [
    { frequency: 329.63, type: "sine" }, // E4
    { frequency: 392.0, type: "sine" }, // G4
    { frequency: 440.0, type: "sine" }, // A4
    { frequency: 493.88, type: "sine" }, // B4
  ];

  // Initialize audio (must be triggered by user interaction due to browser policies)
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Play sound for a tile with a specific index
  function playSound(tileIndex) {
    if (!audioContext) return;

    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure the sound
    oscillator.type = notes[tileIndex].type;
    oscillator.frequency.value = notes[tileIndex].frequency;
    gainNode.gain.value = 0.3;

    // Connect audio nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play the sound with a nice fade-out
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.5
    );
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  // Flash a tile with visual and audio feedback
  function flashTile(tile, duration = 500) {
    return new Promise((resolve) => {
      tile.classList.add("flash");
      const tileIndex = parseInt(tile.dataset.id);
      playSound(tileIndex);

      // Remove flash effect after duration
      setTimeout(() => {
        tile.classList.remove("flash");
        // Small pause between tiles
        setTimeout(resolve, 100);
      }, duration);
    });
  }

  // Display a message to the player
  function showMessage(text, type, duration = 2000) {
    messageDisplay.textContent = text;
    messageDisplay.className = `message ${type} show`;

    // Hide message after duration
    setTimeout(() => {
      messageDisplay.classList.remove("show");
    }, duration);
  }

  // Play the entire current sequence
  async function playSequence() {
    playerTurn = false;
    startButton.disabled = true;

    // Brief pause before starting sequence
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Play each step in the sequence sequentially
    for (let i = 0; i < sequence.length; i++) {
      const tileIndex = sequence[i];
      await flashTile(tiles[tileIndex]);
    }

    // Now it's the player's turn
    playerTurn = true;
    startButton.disabled = false;
    showMessage("Your turn! Repeat the pattern.", "success");
  }

  // Add a random tile to the sequence for the next level
  function generateNextSequence() {
    const randomTile = Math.floor(Math.random() * 4);
    sequence.push(randomTile);
    level = sequence.length;
    levelDisplay.textContent = level;
  }

  // Handle player clicking on a tile
  function handleTileClick(e) {
    // Ignore clicks when it's not the player's turn or game is not active
    if (!playerTurn || !gameActive) return;

    const tile = e.target;
    const tileIndex = parseInt(tile.dataset.id);

    // Visual and audio feedback
    flashTile(tile, 300);
    playerSequence.push(tileIndex);

    // Check if the player's move matches the sequence
    const currentIndex = playerSequence.length - 1;

    // If the player made a mistake, end the game
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
      endGame();
      return;
    }

    // If player completed the entire sequence correctly
    if (playerSequence.length === sequence.length) {
      playerTurn = false;
      playerSequence = [];

      // Update score based on level
      score += level * 10;
      scoreDisplay.textContent = score;

      // Show success message
      showMessage("Correct! Get ready for the next pattern.", "success");

      // Move to next level after a delay
      setTimeout(() => {
        generateNextSequence();
        playSequence();
      }, 1500);
    }
  }

  // Start a new game
  function startGame() {
    initAudio();
    sequence = [];
    playerSequence = [];
    level = 1;
    score = 0;
    gameActive = true;
    playerTurn = false;

    // Reset displays
    levelDisplay.textContent = level;
    scoreDisplay.textContent = score;

    // Generate first sequence
    generateNextSequence();

    // Start button becomes restart during game
    startButton.textContent = "Restart";

    // Show starting message
    showMessage("Watch the pattern carefully!", "success");

    // Play the first sequence after a short delay
    setTimeout(playSequence, 1000);
  }

  // End the game
  function endGame() {
    gameActive = false;
    playerTurn = false;

    // Visual feedback for game over
    tiles.forEach((tile) => {
      tile.classList.add("flash");
      setTimeout(() => {
        tile.classList.remove("flash");
      }, 500);
    });

    // Show game over message
    showMessage("Game Over! Try again.", "error");

    // Update high score if necessary
    if (score > highScore) {
      highScore = score;
      highScoreDisplay.textContent = highScore;
      localStorage.setItem("luminousHighScore", highScore);
      showMessage("New High Score: " + highScore, "success", 3000);
    }

    // Reset start button text
    startButton.textContent = "Play Again";
  }

  // Event listeners
  startButton.addEventListener("click", startGame);

  tiles.forEach((tile) => {
    tile.addEventListener("click", handleTileClick);
  });

  rulesButton.addEventListener("click", () => {
    rulesModal.classList.add("active");
  });

  closeModal.addEventListener("click", () => {
    rulesModal.classList.remove("active");
  });

  // Close modal when clicking outside content
  rulesModal.addEventListener("click", (e) => {
    if (e.target === rulesModal) {
      rulesModal.classList.remove("active");
    }
  });

  // Keyboard support for accessibility
  document.addEventListener("keydown", (e) => {
    if (!gameActive || !playerTurn) return;

    // Number keys 1-4 to activate tiles
    if (e.key >= "1" && e.key <= "4") {
      const index = parseInt(e.key) - 1;
      tiles[index].click();
    }

    // Escape key to close modal
    if (e.key === "Escape" && rulesModal.classList.contains("active")) {
      rulesModal.classList.remove("active");
    }
  });
});
