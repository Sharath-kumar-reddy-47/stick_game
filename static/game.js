const socket = io(); // Initialize Socket.IO connection

const joinForm = document.getElementById('joinForm');
const gameArea = document.getElementById('gameArea');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const sticksContainer = document.getElementById('sticks');
const playerTurn = document.getElementById('playerTurn');
const message = document.getElementById('message');
const pick1 = document.getElementById('pick1');
const pick2 = document.getElementById('pick2');

let currentRoom = null;
let currentPlayer = null;
let playerName = null;
let player1Name = null;
let player2Name = null;
let sticksState = []; // Array to store which player picked each stick

// Join the game when the form is submitted
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    playerName = usernameInput.value;
    const room = roomInput.value;
    socket.emit('join', { username: playerName, room });
    currentRoom = room;
    joinForm.style.display = 'none'; // Hide form after joining
    message.textContent = "Waiting for other player..."; // Show waiting message
    gameArea.style.display = 'block'; // Show game area
});

// Display the sticks based on who picked them
function displaySticks(sticks, sticksState) {
    sticksContainer.innerHTML = ''; // Clear previous sticks
    for (let i = 0; i < sticksState.length; i++) {
        const stick = document.createElement('div');
        stick.className = 'stick';
        // Change color based on the player who picked the stick
        if (sticksState[i] === 0) {
            stick.style.backgroundColor = 'brown'; // Remaining sticks
        } else if (sticksState[i] === 1) {
            stick.style.backgroundColor = 'gray'; // Player 1's picked sticks
        } else if (sticksState[i] === 2) {
            stick.style.backgroundColor = 'blue'; // Player 2's picked sticks
        }
        sticksContainer.appendChild(stick);
    }
}

// Handle player joined event
socket.on('player_joined', (data) => {
    player1Name = data.player1;
    player2Name = data.player2;
    sticksState = Array(data.sticks).fill(0); // Initialize all sticks as unpicked
    
    if (!player2Name) {
        // Only one player has joined
        message.textContent = "Waiting for other player...";
        pick1.style.display = 'none';
        pick2.style.display = 'none';
        sticksContainer.innerHTML = ''; // Hide sticks until game starts
    } else {
        // Both players have joined, start the game
        message.textContent = ''; // Remove waiting message
        displaySticks(data.sticks, sticksState);
        currentPlayer = data.current_player;
        updateTurnMessage();
        pick1.style.display = 'block';
        pick2.style.display = 'block';
    }
});

// Handle game update event
socket.on('update_game', (data) => {
    sticksState = data.sticksState; // Update sticks state from the server
    displaySticks(data.sticks, sticksState);
    currentPlayer = data.current_player;
    updateTurnMessage();
});

// Handle game over event
socket.on('game_over', (data) => {
    message.textContent = `Game over! ${data.winner} wins!`;
    pick1.style.display = 'none';
    pick2.style.display = 'none';
});

// Update the turn message
function updateTurnMessage() {
    if (currentPlayer === 1 && playerName === player1Name) {
        playerTurn.textContent = `${player1Name}'s turn!`;
        pick1.disabled = false;
        pick2.disabled = false;
    } else if (currentPlayer === 2 && playerName === player2Name) {
        playerTurn.textContent = `${player2Name}'s turn!`;
        pick1.disabled = false;
        pick2.disabled = false;
    } else {
        playerTurn.textContent = `Waiting for your turn...`;
        pick1.disabled = true;
        pick2.disabled = true;
    }
}

// Send a pick_sticks event when player picks sticks
pick1.addEventListener('click', () => {
    if (currentRoom && !pick1.disabled) {
        socket.emit('pick_sticks', { room: currentRoom, picked: 1 });
        pick1.disabled = true;
        pick2.disabled = true;
    }
});

pick2.addEventListener('click', () => {
    if (currentRoom && !pick2.disabled) {
        socket.emit('pick_sticks', { room: currentRoom, picked: 2 });
        pick1.disabled = true;
        pick2.disabled = true;
    }
});
