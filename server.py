from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, emit
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

rooms = {}  # Dictionary to store game states by room

# Serve the game.html file
@app.route('/')
def index():
    return render_template('game.html')

# Event: Player joins a room
@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    
    # Add room if not already present
    if room not in rooms:
        rooms[room] = {
            'sticks': 10,
            'sticksState': [0] * 10,  # Array to track who picked each stick (0 = unpicked, 1 = Player 1, 2 = Player 2)
            'current_player': 1,
            'player1': username,
            'player2': None
        }
    else:
        if rooms[room]['player2'] is None:
            rooms[room]['player2'] = username  # Assign second player
    
    join_room(room)
    
    # Notify the first player of the waiting state
    if rooms[room]['player2'] is None:
        emit('player_joined', {
            'player1': rooms[room]['player1'],
            'player2': rooms[room]['player2'],
            'current_player': None,
            'sticks': None
        }, room=room)
    else:
        # Both players have joined, start the game and randomly select the first player
        rooms[room]['current_player'] = random.choice([1, 2])
        emit('player_joined', {
            'player1': rooms[room]['player1'],
            'player2': rooms[room]['player2'],
            'current_player': rooms[room]['current_player'],
            'sticks': rooms[room]['sticks']
        }, room=room)

# Event: Player picks sticks
@socketio.on('pick_sticks')
def pick_sticks(data):
    room = data['room']
    picked = data['picked']
    
    if room in rooms:
        current_player = rooms[room]['current_player']
        
        # Mark the sticks as picked by the current player
        for i in range(picked):
            for j in range(len(rooms[room]['sticksState'])):
                if rooms[room]['sticksState'][j] == 0:  # Find the next unpicked stick
                    rooms[room]['sticksState'][j] = current_player
                    break
        
        rooms[room]['sticks'] -= picked
        
        if rooms[room]['sticks'] <= 0:
            # Game over, emit the winner to all players
            emit('game_over', {
                'winner': rooms[room]['player1'] if current_player == 1 else rooms[room]['player2']
            }, room=room)
            return
        
        # Switch players
        rooms[room]['current_player'] = 2 if current_player == 1 else 1
        
        # Notify players of the updated game state with player names
        emit('update_game', {
            'sticks': rooms[room]['sticks'],
            'sticksState': rooms[room]['sticksState'],  # Send the updated stick states
            'current_player': rooms[room]['current_player'],
            'player1': rooms[room]['player1'],
            'player2': rooms[room]['player2'],
        }, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
