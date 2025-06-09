import {
    Form,
    redirect,
    useActionData,
    useNavigate
} from "react-router-dom";
import './login.css'
import { useState, useEffect } from "react";


export async function login({ request }) {
  const formData = await request.formData();
  const username = formData.get("username").trim();
  
  window.location.href = `/browser?user=${encodeURIComponent(username)}`;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  if (response.ok) {
    return redirect("/browser");
  } else {
    return await response.text();
  }
}

export function LoginPage() {
    return (<>
        <Form method="post">
        <h1>Web3 Checkers</h1>
        <input 
            type="text" 
            name="username" 
            placeholder="Enter any username" 
            required 
        />
        <button type="submit">Play</button>
        </Form>
    </>)
}