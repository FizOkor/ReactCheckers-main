import { useState, useEffect } from "react";
import "./gamestyle.css"
import { indexToPosition, positionToIndex, isLegalMove, tokenAt, makeMove } from "../../shared/GameController"
import { Token } from "../../shared/GameModel";
//game rendering

export default function GameBoard({ board, socket, player, setBoard, selected, setSelected }) {
    // selected = {row: #, col: #}
    const [playerTurn, setPlayerTurn] = useState('')

    useEffect(() => {
        board.selected = selected;
    }, [selected])

    useEffect(() => {
        if (!board.winner) return;

        let message;
        if (board.winner === "draw") {
            message = "Game Over, it's a draw!";
        } else {
            const winner = board.winner === "r" ? "Red" : "Black";
            message = `Game Over, ${winner} wins!`;
        }

        // alert(message);
    }, [board.winner]);


    useEffect(() => {
        setPlayerTurn(board.currentPlayer);
        // console.log('currentPlayer:',board.currentPlayer, 'player', player);
    }, [board.currentPlayer]);

    const clickSquare = function (row, col) {
        const index = positionToIndex(row, col);
        const clickedToken = tokenAt(board, row, col);
        const isPlayerTurn = board.currentPlayer === player;
        const isOwnToken = clickedToken?.color === player;

        if(clickedToken) console.log('clickedToken:', clickedToken);
        // console.log(board);

        // 1. Block if it's not this player's turn
        if (!isPlayerTurn) {
            setSelected({});
            return;
        }

        // 2. Handle token selection
        if (isOwnToken) {
            // If there's a restricted move (onlyMove), enforce it
            if (board.onlyMove && board.onlyMove !== clickedToken) {
                console.log("Restricted to token ID:", board.onlyMove);
                console.log('clickedToken:', clickedToken);
                return;
            }

            // Valid token selected
            setSelected({ row, col });
            return;
        }

        // 3. Handle move attempt
        if (selected?.row != null && selected?.col != null) {
            const fromToken = tokenAt(board, selected.row, selected.col);

            // Verify it's your token and the move is legal
            if (fromToken?.color === player && isLegalMove(board, selected, [row, col])) {
                board = makeMove(board, fromToken, [row, col]);
                socket.emit("makemove", {
                    oldRow: selected.row,
                    oldCol: selected.col,
                    newRow: row,
                    newCol: col,
                });
                // console.table(board.boardState.map(t => t ? `${t.color[0]}${t.index}` : null));
                // console.log({
                //     oldRow: selected.row,
                //     oldCol: selected.col,
                //     newRow: row,
                //     newCol: col,
                // });
                setSelected({});
                return;
            }
        }

        // 4. Invalid click or empty space
        setSelected({});
    };


    const squareColor = function (row, col) {
        // dark purple #460075
        // green #008844
        if (row === selected?.row && col === selected?.col) {
            return "teal";
        }
        if (isLegalMove(board, selected, [row, col])) {
            return "#008844";
        }
        const colOffset = row % 2;
        if ((col + colOffset) % 2 == 0) {
            // console.log("Setting color to purple for square:", row, col);
            return "#9066b0";
        }
        else {
            // console.log("Setting color to white for square:", row, col);
            return "#F1F1F1";
        }
    }

    let rotateClass = (player !== "b") ? "rotate" : null;

    // draw tokens
    return (
        <>
            <div id="game" className={rotateClass}>
                {
                    [...Array(8)].map((gridRow, rowIndex) => {
                        return <div className="row" key={"row:" + rowIndex} style={{}}>
                            {
                                [...Array(8)].map((gridCell, colIndex) => {
                                    return <button className="square"
                                        key={"row:" + rowIndex + ",col:" + colIndex}
                                        onClick={() => clickSquare(rowIndex, colIndex)}
                                        style={{
                                            backgroundColor: squareColor(rowIndex, colIndex),
                                        }}>
                                        {tokenAt(board, rowIndex, colIndex) ?
                                            <img className={"square" + " " + rotateClass}
                                                src={tokenAt(board, rowIndex, colIndex).imgSource()} /> : null}
                                    </button>
                                })
                            }
                        </div>
                    })
                }
            </div>
            <p>{player === "s" ? "Spectator" : player === playerTurn ? "Your Turn" : "Waiting for opponent..."}</p>
            <p>You are {player === "s" ? "Spectator" : player === "r" ? "Red" : "Black"}</p>
        </>
    )
}