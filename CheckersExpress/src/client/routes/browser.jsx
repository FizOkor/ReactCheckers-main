import { Form, Outlet, useLoaderData, useNavigate } from "react-router-dom"
import { useEffect } from "react";
import { useState } from "react";
import LogoutButton from "../LogoutButton";
import Game from "./game";
import GameBoard from "./gameboard";
import Leaderboard from "./leaderboard";
import { Board, Token } from "../../shared/GameModel";

export default function Browser() {
    const socket = useLoaderData().io;
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user') || '';
    const navigate = useNavigate();
    // const navigate = useNavigate();
    const [gameCode, setGameCode] = useState("");
    const [gameStarted, setGameStarted] = useState(false);
    const [gameJoined, setGameJoined] = useState(false);
    const [gameOverReason, setGameOverReason] = useState("");
    const [board, setBoard] = useState(new Board());
    const [player, setPlayer] = useState("");
    const [selected, setSelected] = useState({});
    // const board = new Board();


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Joining game ", gameCode, "username", username);
        socket.emit("joinGame", gameCode, username);
    };

    const createGame = (e) => {
        e.preventDefault();
        console.log("Creating game");
        socket.emit("createGame", username)
    }

    const backToBrowser = (e) => {
        e.preventDefault();
        console.log("Back to browser!");
        setGameStarted(false);
        setGameOverReason("");
        setGameJoined(false);
        setGameCode("");
        // Get it to refresh the data
        navigate("/browser");
    }

    useEffect(() => {
        if (!username) return navigate('/');
    }, []);

    useEffect(() => {
        socket.on("gameJoined", (gameCode) => {
            // Joined the game!
            setGameJoined(true);
            setGameCode(gameCode);
            setBoard(new Board(gameCode));
        });

        socket.on("gameStarted", (player) => {
            console.log("Game started! I am player ", player);
            setPlayer(player);
            setGameStarted(true);
        })

        socket.on("gameJoinError", (gameCode, reason) => {
            alert(`Could not join game ${gameCode}. ${reason}`);
            // alert(`Game ${gameCode} is full. Please try another game code.`);
        });

        socket.on("alreadyInGame", () => {
            alert("You are already in this game!");
        })

        socket.on("gameOver", (reason) => {
            setGameOverReason(reason);
        });

        socket.on("board", (boardState, currentPlayer, onlyMoveData) => {
            // 1. Rebuild board state with new tokens
            const newBoardState = boardState.map(token =>
                token ? new Token(token.index, token.isMonarch, token.color) : null
            );

            // 2. Recreate onlyMove reference if exists
            const newOnlyMove = onlyMoveData ?
                newBoardState[onlyMoveData.index] :
                null;

            // 3. Update board immutably
            const newBoard = board.copy();
            newBoard.boardState = newBoardState;
            newBoard.currentPlayer = currentPlayer;
            newBoard.onlyMove = newOnlyMove; // Use the new reference

            // console.log("Board update received", {
            //     player: currentPlayer,
            //     onlyMove: newOnlyMove?.index,
            //     monarchs: newBoardState.filter(t => t?.isMonarch).length
            // });

            // 4. Auto-select if onlyMove applies to current player
            if (newOnlyMove && currentPlayer === player) {
                const pos = indexToPosition(newOnlyMove.index);
                setSelected({ row: pos[0], col: pos[1] });
            }

            setBoard(newBoard);
        });

        return () => {
            socket.off("gameJoined");
            socket.off("gameFull");
            socket.off("gameOver");
            socket.off("gameStarted");
            socket.off("alreadyInGame");
            socket.off("gameJoinError");
        };
    }, [socket]);

    return (
        <>
            {/* <LogoutButton socket={socket}></LogoutButton> */}
            {gameOverReason ?
                <>
                    <h1>{player !== "s" ? gameOverReason : "Game over"}</h1>
                    <button onClick={backToBrowser}>Back to browser</button>
                </> :
                !gameJoined ? <>
                    <h1>Welcome to Checkers!</h1>
                    <button onClick={createGame}>Create Game</button>
                    <h2>Enter a game code to join:</h2>
                    <Form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Game code"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value)}
                        />
                        <button type="submit">Submit</button>
                    </Form>
                    <br />

                    <br></br></> :
                    gameStarted ? <GameBoard board={board} socket={socket} setBoard={setBoard} player={player} selected={selected} setSelected={setSelected} /> : <h1>Waiting for opponent. Game Code: {gameCode}</h1>}

        </>
    )
}
