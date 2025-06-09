import { useState } from "react"
import { useLoaderData } from "react-router-dom";
import "./leaderboard.css"

export default function Leaderboard() {
    const data = useLoaderData().data.stats;
    console.log("data", data);

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => {
                        return (
                            <tr key={row.username}>
                                <td>{row.username}</td>
                                <td>{row.wins}</td>
                                <td>{row.losses}</td>
                                <td>{Math.round(row.winrate * 100)}%</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table >
        </>
    )
}