import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {

    apiKey: "AIzaSyBPMluDnRD9-IAVQ_UyiOmBcCxRW5Tn1rU",

    authDomain: "cisc472-braindump.firebaseapp.com",

    databaseURL: "https://cisc472-braindump-default-rtdb.firebaseio.com",

    projectId: "cisc472-braindump",

    storageBucket: "cisc472-braindump.appspot.com",

    messagingSenderId: "790328918081",

    appId: "1:790328918081:web:b194fac12df5d0e55286c0"

};



// Initialize Firebase

var date = new Date();

const app = initializeApp(firebaseConfig);

let db = rtdb.getDatabase(app);
let chatRef = rtdb.ref(db, "/chats");
let auth = fbauth.getAuth(app);
let admin = false;
let latestMsg = false;
window.addEventListener('resize', function (event) {
    window.scrollTo(0, document.body.scrollHeight);
}, true);

//helper method for sending message
function sendMsg() {
    var msg = $("#messageBox").val();
    msg = msg.trim().replaceAll(" +", " ");
    if (msg[0] == '/' && msg.length > 10) {
        if (msg.substring(1, 9) === 'nickname') {
            let newName = msg.substring(10, msg.length)
            rtdb.set(rtdb.ref(db, "/users/" + auth.currentUser.uid + "/displayName"), newName);
            $("#messageBox").val("");
            document.getElementById("displayName").innerText = "Logged in as: " + newName + " (" + auth.currentUser.email + ")";
            msg = "";
        }
    }
    else {
        if (msg != "")
            addMessage(msg);
    }
}

//helper method for edit function to remove the ui and edit text box
function removeEditMenu(id) {
    if (document.getElementById("editBox") != null)
        document.getElementById("editBox").remove();
    if (document.getElementById("editWarn") != null)
        document.getElementById("editWarn").remove();
    $(id + "_msgInnerText").removeClass("d-none");
}

//Way too large function for displaying messages and adding editing / deletion functionality
function displayMessage(obj, msgID) {


    //shorthand for current message id selector for jQuery bc your boi forgets the #
    let id = "#" + msgID;

    //DOM elements for input sanitation
    let msgContents = document.createElement('p');
    msgContents.innerText = obj.message;
    msgContents.id = msgID + "_msgInnerText";
    let nameContents = document.createElement('p');

    //Edit/delete button cluster
    let btnCluster = document.createElement('div');
    btnCluster.classList.add("btn-group");
    btnCluster.classList.add("d-none");
    btnCluster.id = msgID + '_btnCluster';

    let delConfirm = document.createElement('div');
    delConfirm.classList.add("btn-group");
    delConfirm.classList.add("d-none");
    delConfirm.id = msgID + '_delConfirm';
    delConfirm.innerHTML = '<button type="button" class="btn btn-danger btn-sm" id="' + msgID + '_nuke">Delete Forever</button><button type="button" class="btn btn-outline-secondary btn-sm" id="' + msgID + '_cancel">Cancel Action</button>'


    //retrieve and sanitize username
    let nick = rtdb.ref(db, `/users/${obj.uuid}/displayName`);
    rtdb.onValue(nick, ss => {
        //
        nameContents.innerText = ss.val();
    });
    nameContents.classList.add("nickname");

    //build barebones messageContainer html structure
    let messageContainer = '<li class="list-group-item" id="' + msgID + '"><div class = "d-flex w-100 justify-content-between" id="' + msgID + '_name"><small id="' + msgID + '_btn"</small><small class="time" id="' + msgID + '_time">' + timeConverter(parseInt(obj.timestamp)) + '</small></div><div class="d-flex w-100 justify-content-between" id="' + msgID + '_msg"></div></li>';

    //add message contents and username
    $("#chatHistory").append(messageContainer);
    $(id + "_msg").append(msgContents);
    $(id + "_name").prepend(nameContents);

    //add edited tag if the message has been edited
    if (obj.edited == "true")
        $(id + "_msg").append("<small class='editFlag'>(edited)</small>");
    btnCluster.innerHTML = '<button type="button" class="btn btn-outline-danger btn-sm" id="' + msgID + '_del">Delete</button>';

    //Only the original sender can edit message
    if (obj.uuid === auth.currentUser.uid)
        btnCluster.innerHTML = '<button type="button" class="btn btn-outline-secondary btn-sm" id="' + msgID + '_edit">Edit</button>' + btnCluster.innerHTML;

    //admin is added here because they can delete rowdy messages
    if (obj.uuid === auth.currentUser.uid || admin) {
        $(id + "_btn").append(btnCluster);
        $(id + "_btn").append(delConfirm);
        //unholy edit function, ripped straight from discord itself LMAO
        $(id + "_edit").on("click", () => {
            if (document.getElementById("editWarn") != null)
                document.getElementById("editWarn").remove();
            let editTextBox = document.createElement("input");
            editTextBox.id = "editBox";
            editTextBox.type = "text";
            editTextBox.classList.add("form-control");
            editTextBox.autocomplete = "off";
            $(id + "_msg").prepend(editTextBox);
            $(id + "_msgInnerText").addClass("d-none");
            let currentMsgContents = obj.message;
            let msgLoc = rtdb.ref(db, `/chats/${msgID}/message`);
            rtdb.onValue(msgLoc, ss => {
                currentMsgContents = ss.val();
            });

            $("#editBox").val(currentMsgContents);
            let editMsg = document.createElement("small");
            editMsg.id = "editWarn";
            editMsg.innerHTML = 'Editing message. Press <a id="esc" class="link-danger link_small">escape</a> to cancel, <a id="ent" class="link-danger link_small">enter</a> to edit';
            $(id).append(editMsg);
            $("#editBox").focus();
            $("#esc").on("click", () => {
                removeEditMenu(id);
            });
            $("#ent").on("click", () => {
                if ($("#editBox").val() != currentMsgContents) {
                    rtdb.set(rtdb.ref(db, "/chats/" + msgID + "/message"), $("#editBox").val());
                    rtdb.set(rtdb.ref(db, "/chats/" + msgID + "/edited"), "true");
                }
                removeEditMenu(id);
            });


            $(document).keyup(function (e) {
                if (e.key === "Escape") { // escape key maps to keycode `27`
                    if (document.getElementById("editWarn") != null)
                        $("#esc").click();
                    else
                        window.scrollTo(0, document.body.scrollHeight);
                }
                if (e.key === "Enter" && document.activeElement === document.getElementById("editBox")) {
                    $("#ent").click();
                }
            });
        });


        $(id + "_del").on("click", () => {
            $(id + '_btnCluster').addClass("d-none");
            $(id + '_delConfirm').removeClass("d-none");
            $(id + "_nuke").on("click", () => {
                rtdb.remove(rtdb.ref(db, "/chats/" + msgID));
            });
            $(id + "_cancel").on("click", () => {
                $(id + '_delConfirm').addClass("d-none");
                $(id + '_btnCluster').removeClass("d-none");
            });
        });
    }

    //detect when mouse enters a message space
    $(id).mouseenter(function () {
        $(id).addClass('activeMsg');
        if (obj.uuid === auth.currentUser.uid || admin) {
            $(id + "_time").addClass("d-none");
            $(id + "_btnCluster").removeClass('d-none');
        }
    });

    //when mouse cursor leaves
    $(id).mouseleave(function () {
        $(id).removeClass('activeMsg');
        $(id + "_btnCluster").addClass('d-none');
        $(id + "_delConfirm").addClass('d-none');
        $(id + "_time").removeClass("d-none");
    });

}


//key listener for up arrow to select most recent message to edit, also ripped from discord
document.onkeydown = checkKey;
function checkKey(e) {
    if (e.keyCode === 38 && document.getElementById("editWarn") == null) {
        e.preventDefault();
        $("#" + latestMsg + "_edit").click();
    }

}
function loadChatWindow() {

    //When a message is added to the db
    rtdb.onChildAdded(chatRef, ss => {
        if (!/[^a-zA-Z0-9-_]/.test(ss.key) && ss.key.startsWith("-") && !ss.key.includes('"') && !ss.key.includes("'"))
            displayMessage(ss.val(), ss.key);
        window.scrollTo(0, document.body.scrollHeight);
        if (ss.val().uuid === auth.currentUser.uid)
            latestMsg = ss.key;
    });
    //When a message is edited in the db
    rtdb.onChildChanged(chatRef, ss => {
        $("#" + ss.key + "_msg").empty();
        let msgContents = document.createElement('p');
        msgContents.id = ss.key + "_msgInnerText";
        msgContents.innerText = ss.val().message;
        $("#" + ss.key + "_msg").append(msgContents);
        if (ss.val().edited == "true");
        $("#" + ss.key + "_msg").append("<small class='editFlag'>(edited)</small>");
        window.scrollTo(0, document.body.scrollHeight);
    });
    //When a message is deleted from the database
    rtdb.onChildRemoved(chatRef, ss => {
        document.getElementById(ss.key).remove();
    });

    //SPA goodness
    $("#chatDiv").removeClass("d-none");
    $("#chat").removeClass("d-none");
    $("#login").addClass("d-none");
    $("#register").addClass("d-none");
    let nick = rtdb.ref(db, `/users/${auth.currentUser.uid}/displayName`);
    let name = auth.currentUser.displayName;
    rtdb.onValue(nick, ss => {
        //
        name = ss.val();
        document.getElementById("displayName").innerText = "Logged in as: " + name + "  (" + auth.currentUser.email + ")"
    });


    //Focus on text box
    document.getElementById("messageBox").focus();
}

//When logout
function hideChatWindow() {
    $("#chatDiv").addClass("d-none");
    $("#login").removeClass("d-none");
    $("#chat").addClass("d-none");
}

//Detect login/logout
fbauth.onAuthStateChanged(auth, user => {
    if (!!user) {
        let adminCheck = rtdb.ref(db, `/users/${auth.currentUser.uid}/roles/admin`);
        rtdb.onValue(adminCheck, ss => {
            admin = ss.val();
        });
        loadChatWindow();

    } else {
        hideChatWindow();
        $("#chatHistory").empty();
    }
});

//Logout
$("#logoutBtn").on("click", () => {
    fbauth.signOut(auth);
});

//Log in existing user
$("#loginBtn").on("click", () => {
    let email = $("#logemail").val();
    let pwd = $("#logpass").val();
    $("#logemail").val("");
    $("#logpass").val("");
    fbauth.signInWithEmailAndPassword(auth, email, pwd).then(
        somedata => {

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode);
            console.log(errorMessage);
            alert("invalid credentials");
        });
});

//Register new user
$("#registerBtn").on("click", () => {
    let email = $("#regemail").val();
    let p1 = $("#regpass1").val();
    let p2 = $("#regpass2").val();
    let dname = $("#regname").val();
    if (p1 != p2) {
        alert("Passwords don't match");
        $("#regpass1").val("");
        $("#regpass2").val("");
        return;
    }

    fbauth.createUserWithEmailAndPassword(auth, email, p1).then(somedata => {
        let uid = somedata.user.uid;
        fbauth.updateProfile(somedata.user, {
            displayName: dname,
            photoURL: null
        }).then(function () {
            console.log("created user: " + somedata.user.displayName);
        });
        let userRoleRef = rtdb.ref(db, `/users/${uid}/roles/user`);
        rtdb.set(userRoleRef, true);
        let nick = rtdb.ref(db, `/users/${uid}/displayName`);
        rtdb.set(nick, dname);
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
});

//Helper method to add message to database
function addMessage(messageContents) {
    $("#messageBox").val("");
    var date = new Date();
    let newMsg = { "message": messageContents, "uuid": auth.currentUser.uid, "timestamp": parseInt(date.getTime()), "edited": "false" };
    console.log(JSON.stringify(newMsg));
    rtdb.push(chatRef, newMsg);
}


$("#send").on("click", () => {
    sendMsg();
});


$("#registerUserText").click(function () {
    $("#login").addClass("d-none");

    $("#register").removeClass("d-none");


});
$("#returningUserText").click(function () {
    $("#register").addClass("d-none");

    $("#login").removeClass("d-none");

});

document.getElementById("messageBox").addEventListener("keyup", function (event) {
    if (event.keyCode === 13 && document.activeElement === document.getElementById("messageBox")) {
        event.preventDefault();
        $("#send").click();
    }
});

document.getElementById("logpass").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        $("#loginBtn").click();
    }
});

document.getElementById("regpass2").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        $("#registerBtn").click();
    }
});

//edited from: https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function timeConverter(timestamp) {
    var a = new Date(timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    if (min < 10)
        min = "0" + min;
    var time = hour + ':' + min + ' ' + month + ' ' + date + ', ' + year;
    return time;
}
