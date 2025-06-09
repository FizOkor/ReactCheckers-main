import { useState, useEffect } from "react";
import "./gamestyle.css"
import { indexToPosition, positionToIndex, isLegalMove, tokenAt, makeMove } from "../../shared/GameController"
import { Token } from "../../shared/GameModel";
//game rendering

export default function GameBoard({ board, socket, player, setBoard, selected, setSelected }) {
    // selected = {row: #, col: #}

    useEffect(() => {
        board.selected = selected;
    }, [selected])

    useEffect(() => {
        const winner = board.winner === "r" ? "Red" : "Black";
        // alert("Game Over, " + winner + " Wins!")
    }, [board.winner])

    const clickSquare = function (row, col) {
        console.log("Square Clicked:", row, col, "Index of Square:", positionToIndex(row, col), " current player ", board.currentPlayer, " i am player ", player);
        if (board.currentPlayer !== player) {
            setSelected({});
            return;
        }
        if (tokenAt(board, row, col)?.color === (board.currentPlayer) && board.currentPlayer == player) {
            console.log("only move ", indexToPosition(board.onlyMove?.index), " row col ", [row, col], " bool  ", indexToPosition(board.onlyMove?.index)[0] === row && indexToPosition(board.onlyMove?.index)[1] === col);

            // Check if there is a restriction on movement and, if there is, that the user has clicked on that tile
            if (board.onlyMove && !(indexToPosition(board.onlyMove?.index)[0] === row && indexToPosition(board.onlyMove?.index)[1] === col)) {
                console.log("Was not only move. Only move: ", board.onlyMove);
                return;
            }
            setSelected({ row, col });
            return;
        }

        // If the clicked square is a legal move, make the move
        if (isLegalMove(board, selected, [row, col])) {
            board = makeMove(board, tokenAt(board, selected.row, selected.col), [row, col]);
            socket.emit("makemove", { oldRow: selected.row, oldCol: selected.col, newRow: row, newCol: col });
            setSelected({})
            return;
        }

    }

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
    // let oppositeRotate = (player === "b") ? "rotate" : null;
    // console.log("rotate class", rotateClass);

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
            <p>You are {player === "s" ? "Spectator" : player === "r" ? "Red" : "Black"}</p>
        </>
    )
}