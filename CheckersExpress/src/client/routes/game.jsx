import { useEffect, useState } from "react"
import { useLoaderData, useLocation } from "react-router-dom";
import LogoutButton from "../LogoutButton";

function GameOver({ reason, setGameStarted, setGameJoined }) {
    return (
        <>
            <h1>Game Over</h1>
            <p>{reason}</p>
            <button onClick={() => {
                setGameJoined(false);
                setGameStarted(false);
            }}>Back to browser</button>
        </>
    )
}

function Waiting() {
    return (
        <>
            <h1>Waiting for other player...</h1>
        </>
    )
}

function Playing({ socket, gameCode }) {
    const [count, setCount] = useState(0);

    socket.on("count", (msg) => {
        console.log("Recieved count event ", msg);
        setCount(msg);
    });

    function sendCount() {
        console.log("Sending count ", count + 1, " on game code ", gameCode);
        socket.emit("count", gameCode, count + 1);
    }

    return (
        <>
            <h1>in game!</h1>
            <button onClick={() => {
                setCount(count + 1); // this doesn't actually take effect until the component updates
                sendCount();
            }}>Increment Count</button >
            <p>Count is: {count}</p>
        </>
    )
}

export default function Game({ socket, gameStarted, gameCode, setGameStarted, setGameJoined }) {
    const [gameOver, setGameOver] = useState("");

    socket.on("gameOver", (reason) => {
        setGameOver(reason);
    })

    return (
        <>
            {gameOver ? <GameOver reason={gameOver} setGameJoined={setGameJoined} setGameStarted={setGameStarted} /> : gameStarted ? <Playing socket={socket} gameCode={gameCode} /> : <Waiting />}
        </>
    )
}