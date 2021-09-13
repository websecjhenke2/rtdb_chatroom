import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkC1J4rbJ41kR-T5XTRb3XWkAY2URX9zY",
  authDomain: "cisc472-bonfire.firebaseapp.com",
  databaseURL: "https://cisc472-bonfire-default-rtdb.firebaseio.com",
  projectId: "cisc472-bonfire",
  storageBucket: "cisc472-bonfire.appspot.com",
  messagingSenderId: "793303115664",
  appId: "1:793303115664:web:30c0c4f74561ac4cceb515",
  measurementId: "G-V4W8ZNV093"
};

// Initialize Firebase
var nickname = "Guest";

var date = new Date();

const app = initializeApp(firebaseConfig);

let db = rtdb.getDatabase(app);
let chatRef = rtdb.ref(db, "/chats");

function displayMessage(obj) {
  $("#chatHistory").append('<li class="list-group-item"><div class = "d-flex w-100 justify-content-between"><p class = "nickname">' + obj.nickname + '</p><small>' + timeConverter(parseInt(obj.timestamp)) + '</small></div><p>' + obj.message + '</p></li>');
}
rtdb.onChildAdded(chatRef, ss=>{
  //alert(JSON.stringify(ss.val()));
  //alert(ss.val());
  //var obj = ss.val();
  //for (var k in obj) {
  //  displayMessage(k);
  displayMessage(ss.val());
});

$("#setName").click(()=>{
  nickname = $("#nameBox").val().replace(/<[^>]+>/g, '');
  if (nickname == "")
     nickname = "Guest";
  $("#name").addClass("d-none");
  $("#nameField").text("Now chatting as: " + nickname);
  $("#chat").removeClass("d-none");
  $("#chatDiv").removeClass("d-none");
  
  window.scrollTo(0,document.body.scrollHeight);
  
})

function addMessage( messageContents) {
  $("#messageBox").val("");
  var date = new Date();
  let newMsg = {"message": messageContents, "nickname": nickname, "timestamp":date.getTime()};
rtdb.push(chatRef, newMsg);
  window.scrollTo(0,document.body.scrollHeight);
}

$("#send").click(()=>{
  var msg = $("#messageBox").val().replace(/<[^>]+>/g, '');
  if (msg != "")
    addMessage(msg);
})

document.getElementById("messageBox").addEventListener("keyup", function(event) {
  if (event.keyCode===13) {
    event.preventDefault();
    $("#send").click();
  }
})

document.getElementById("nameBox").addEventListener("keyup", function(event) {
  if (event.keyCode===13) {
    event.preventDefault();
    $("#setName").click();
  }
});

function keyPress (e) {
    if(e.key === "Escape") {
      window.scrollTo(0,document.body.scrollHeight);
    }
}





//edited from: https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function timeConverter(timestamp){
  var a = new Date(timestamp);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  if (min < 10)
    min = "0"+min;
  var time = hour + ':' + min + ' ' + month + ' ' + date + ', ' + year;
  return time;
}

