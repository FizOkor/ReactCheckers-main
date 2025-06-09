import { useNavigate } from "react-router-dom";


export default function LogoutButton({ socket }) {
    const navigate = useNavigate();
    async function logout(e) {
        e.preventDefault();
        console.log("Logging out!");
        if (socket) socket.disconnect();
        else console.log("No socket provided!");

        await fetch("/logout", { method: "POST" });
        navigate("/");
    }

    return (<button type="submit" onClick={logout}>Log Out</button>)
}