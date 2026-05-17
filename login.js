import {
    auth,
    signInWithEmailAndPassword
} from "../firebase.js";

import {
    auth,
    signInWithEmailAndPassword
} from "../firebase.js";

const ADMIN_EMAILS = [
    "admin@smartsystem.local",
    "mendi@gmail.com",
   
];

async function login() {

    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    const password = passwordInput.value.trim();

    if (!password) {
        errorMessage.innerText = "הכנס סיסמה";
        return;
    }

    let success = false;

    for (const email of ADMIN_EMAILS) {

        try {

            await signInWithEmailAndPassword(auth, email, password);

            success = true;

            break;

        } catch (error) {

        }

    }

    if (success) {

        window.location.href = "admin.html";

    } else {

        errorMessage.innerText = "סיסמה שגויה";

    }

}

document.getElementById("password").addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});

window.login = login;