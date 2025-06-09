import {
    Form,
    redirect,
    useActionData,
    useNavigate
} from "react-router-dom";
import './login.css'
import { useState, useEffect } from "react";


export async function login({ request }) {
    let formData = await request.formData();

    // Intent is based on the button value
    // Differentiates between login and register
    let intent = formData.get("intent");
    console.log("intent:", intent)
    console.log("Sending ", formData.get("username"), "pw", formData.get("password"));
    let resource = (intent === "login") ? "/login" : "/register";

    // Either login or register depending on request. Both are handled the same way. 
    const response = await fetch(resource, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
    })
    if (response.status === 201) {
        console.log("good");
        return redirect("/browser");
    } else {
        // Login failed for some reason. Return the text error message to be displayed.
        return await response.text();
    }
}

export function LoginPage() {

    // async function login(request) {
    //     request.preventDefault();
    //     console.log("submitted", request);
    // }

    return (<>
        <Form id="login-form" method="post">
            <h1>Checkers</h1>
            <p>Log in or sign up!</p>
            <br></br>
            <input type="text" placeholder="username" name="username" />
            <input type="password" placeholder="password" name="password" />
            <br></br>
            <button type="submit" name="intent" value="register">Register</button>
            <button type="submit" name="intent" value="login">Log in</button>
            <p>{useActionData()}</p>
        </Form>
    </>)
}