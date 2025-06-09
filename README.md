# Final Project
Emma Pollak, Kruti Shah, Kay Siegall, Ian Poulsen, Thei Riley

https://team-9-final-project.glitch.me

https://youtu.be/CI-XPF1pf9A

## Project Description
We created a multiplayer checkers game that supports two players. Users must first sign up or log in, then they will be taken to a lobby. From this page, users may create a new game or join an existing game by entering a game code.

Once two players join the game, they are able to make moves. The player's pieces always begin at the bottom of their screen, as the board is flipped for one of the players. Players select a piece they want to move and their available moves are highlighted. The players take turns moving pieces across the board and trying to capture the opponent's pieces. Once a piece moves fully across the board, it becomes a monarch and gains the ability to move backward. When all of one player's pieces have been captured, the game ends and informs the players who has won. This win is added to the statistics which are displayed on the leaderboard in the game lobby. Once a player wins or leaves the game, the game is deleted and the game code becomes usable again. The game smoothly handles disconnects.

As a note, in order to play the game against yourself, you have to open the website in two private/incognito windows and register two separate accounts. Otherwise, the cookies will persist across tabs and you will be automatically logged in to one of the accounts.

## Technologies used
- Our application uses Express and Vite to handle the server implementation
- MongoDB stores the users in a database and the passwords are hashed using bcrypt
- We used cookie-session to maintain user sessions and authenticity
- Socket.io allowed us to pair up two players in a game
- We used React to implement the client and visualize the board

## Challenges
We had some challenges with time management because we're busy people and it's finals week, but other than that things went smoothly!

## Responsibilities
- Emma Pollak: User authentication/login, server and socket, leaderboard, connecting server to game
- Kruti Shah: Game logic, gamepiece design, CSS
- Kay Siegall: Game logic, board design, piece movement, monarchs
- Ian Poulsen: User authentication/login, password hashing & cookies, server and socket, README
- Thei Riley: Game logic, board design and storage

## Link to Project Video
https://youtu.be/CI-XPF1pf9A
