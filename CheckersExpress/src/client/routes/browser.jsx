import { Form, Outlet, useLoaderData, useNavigate } from "react-router-dom"
import { useEffect } from "react";
import { useState } from "react";
import LogoutButton from "../LogoutButton";
import Game from "./game";
import GameBoard from "./gameboard";
import Navbar from '../Navbar';
import Leaderboard from "./leaderboard";
import { Board, Token } from "../../shared/GameModel";
import './modal.css';

import { joinGameCon, createGameCon, declareDrawCon, triggerTimeoutRefundCon } from "../../contract/interact.js";

export default function Browser() {
    const socket = useLoaderData().io;
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user') || '';
    const navigate = useNavigate();
    
    const [account, setAccount] = useState(null);

    const [gameCode, setGameCode] = useState("");

    const [stakeAmt, setStakeAmt] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameJoined, setGameJoined] = useState(false);
    const [gameOverReason, setGameOverReason] = useState("");
    const [board, setBoard] = useState(new Board());
    const [player, setPlayer] = useState("");
    const [selected, setSelected] = useState({});
    const [modalState, setModalState] = useState(false);
    const [modalContent, setModalContent] = useState({
        opponent: '',
        gameCode: '',
        stakeAmt: '',
        action: () => { },  // This will be the function to handle the modal action.
        buttonText: '',  // Change button text as needed
    });
    const [opponent, setOpponent] = useState('')
    // const board = new Board();


    const handleSubmit = () => {
        // e.preventDefault();
        if(!account) return alert('Connect your wallet!')
        if (modalContent.stakeAmt === '' || modalContent.stakeAmt === null) return alert('Enter stake!')
        // console.log(modalContent.action)
        modalContent.action();
        setModalState(false);
    };

    const handleJoinGame = () => {
        const code = gameCode;
        setGameCode('');
        socket.emit('verifyGameCode', code);
    };
    const gameJoin = async (code, stake) => {
        // const response = await joinGameCon(modalContent.gameCode, modalContent.stakeAmt);

        // console.log(response);
        socket.emit("joinGame", code, username, stake);
    };

    const openModal = ({ opponent, gameCode, action, buttonText }) => {
        setModalContent({
            opponent,
            gameCode,
            stakeAmt: '',
            action,
            buttonText,
        });
        setModalState(true);
    };

    const createGame = async () => {
        console.log("Creating game");

        console.log('modalContent.gameCode', modalContent.gameCode, modalContent.stakeAmt)
        
        // const response = await createGameCon(modalContent.gameCode, modalContent.stakeAmt);

        // console.log(response);
        socket.emit("createGame", username, modalContent.stakeAmt)

        console.log('username:', username, ' modalContent.stakeAmt:', modalContent.stakeAmt)
    };

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
        socket.on('opponent', (opp) => {
            setModalContent(prev => ({ ...prev, opponent: opp }));
        });


        socket.on('validGameCode', (valCode, status) => {
            if (!status) return alert('Invalid Game code!');

            socket.emit('getOpp', valCode, username);

            const handleJoinAction = () => {
                gameJoin(valCode, modalContent.stakeAmt);
            };

            openModal({
                opponent: '',
                gameCode: valCode,
                action: handleJoinAction,
                buttonText: 'Join Game'
            });
        });
        socket.on("gameJoinError", (gameCode, reason) => {
            alert(`Could not join game ${gameCode}. ${reason}`);

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
            socket.off('opponent');
            socket.off('validGameCode');
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
            <Navbar account={account} setAccount={setAccount} />
            <div className="fit-w">
                {/* <LogoutButton socket={socket}></LogoutButton> */}
                {gameOverReason ?
                    <>
                        <h1>{player !== "s" ? gameOverReason : "Game over"}</h1>
                        <button className='btn-trans' onClick={backToBrowser}>Back to browser</button>
                    </> :
                    !gameJoined ?
                        <div id='welcome'>
                            <h1>Welcome to Stakeplay!</h1>

                            <button
                                className='btn-trans'
                                onClick={() => {
                                    const handleCreateAction = () => {
                                        createGame();
                                    };

                                    openModal({
                                        opponent: '',
                                        gameCode: '',
                                        action: handleCreateAction,
                                        buttonText: 'Create Game'
                                    });
                                }}
                            >
                                Create Game
                            </button>

                            <div className="form-div">
                                <h2>Enter a Game Code to join:</h2>
                                <div className="join-form">
                                    {/* <Form onSubmit={handleSubmit}></Form> */}
                                    <input
                                        type="text"
                                        className="flex-1"
                                        placeholder="Game Code"
                                        value={gameCode}
                                        onChange={(e) => setGameCode(e.target.value)}
                                    />
                                    <button className='btn-trans'
                                        onClick={e => handleJoinGame()}
                                    >Join</button>
                                </div>
                            </div>
                            <br />

                            <br></br>
                        </div> :
                        gameStarted ? <GameBoard board={board} socket={socket} setBoard={setBoard} player={player} selected={selected} setSelected={setSelected} /> : <h1>Waiting for opponent... <br />Game Code: {gameCode}</h1>}

                {/* Modal */}
                <div id="mySizeChartModal" className={`ebcf_modal ${modalState ? 'show-modal' : ''}`}>

                    <div className="ebcf_modal-content">
                        <span className="ebcf_close" onClick={e => setModalState(false)}>&times;</span>


                        <div className="modal-params">
                            <div className="items-between"><span className="model-detail">Opponent: </span><span className="italic">{modalContent.opponent ? modalContent.opponent : 'null'}</span></div>
                            <div className="items-between"><span className="model-detail">Game Code: </span><span className="italic">{modalContent.gameCode}</span></div>
                            <hr />
                            <div className="modal-params">
                                <p style={{ textAlign: 'left' }}>Enter Stake:</p>
                                <input
                                    required
                                    className="input-sec"
                                    type="number"
                                    placeholder="ETH"
                                    value={modalContent.stakeAmt}
                                    onChange={(e) => setModalContent(prev => ({ ...prev, stakeAmt: e.target.value }))}
                                />
                                <button className='btn-blue' onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit();
                                }} >
                                    {modalContent.buttonText}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}
