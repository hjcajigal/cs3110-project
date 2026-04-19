const htmlList = document.getElementById("list");
const userHtml = document.getElementById("user_list");
const nameInput = document.getElementById("name_input");
const typeInput = document.getElementById("user_type");
const logHtml = document.getElementById('log');


console.log("Establishing SSE connection to server");
const serverEvents = new EventSource("/api/sse");

serverEvents.onopen = () => {
    console.log("SSE connection to server successful.");
}

serverEvents.onerror = () => {
  console.log("An error occurred while attempting to connect.");
};

serverEvents.onmessage = (event) => {
    console.log(event);
    const data = JSON.parse(event.data);
    console.log("Received message from server.");
    console.log("Data received: ", data);

    htmlList.innerHTML = "";

    let charList = data.characters

    for (let i = 0; i < charList.length; i++) {
        let listItem = document.createElement("li");
        listItem.innerText = `${charList[i].name} `;

        let editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        editBtn.value = i;

        editBtn.addEventListener("click", editListItem);

        let delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.value = i;
        
        delBtn.addEventListener("click", deleteListItem);

        let modText = document.createElement("div");
        modText.classList.add("mod-text");
        modText.innerText = `Last modified by: ${charList[i].modifier}`

        listItem.appendChild(editBtn);
        listItem.appendChild(delBtn);
        listItem.appendChild(modText);



        // listItem.innerHTML = `${data[i]} <button name="itemEdit${i}" value="${i}">Edit</button> <button name="itemDelete${i}" value="${i}">Delete</button>`;
        htmlList.appendChild(listItem);

        // htmlList.innerHTML += `<li id="item${i}">${data[i]} </li>`
    }

    userHtml.innerHTML = "";

    let userList = data.users;
    for (let i = 0; i < userList.length; i++) {
        let listItem = document.createElement("li");
        listItem.innerText = `${userList[i].username}: ${userList[i].type} `;

        let editBtn = document.createElement("button");
        editBtn.innerText = "Edit Type";
        editBtn.value = i;

        editBtn.addEventListener("click", editAdminItem);

        let delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.value = i;
        
        delBtn.addEventListener("click", deleteAdminItem);

        let modText = document.createElement("div");
        modText.classList.add("mod-text");
        modText.innerText = `Last modified by: ${userList[i].modifier}`

        listItem.appendChild(editBtn);
        listItem.appendChild(delBtn);
        listItem.appendChild(modText);

        // let modTxt = document.createElement(tagName);

        

        // listItem.innerHTML = `${data[i]} <button name="itemEdit${i}" value="${i}">Edit</button> <button name="itemDelete${i}" value="${i}">Delete</button>`;
        userHtml.appendChild(listItem);

        // htmlList.innerHTML += `<li id="item${i}">${data[i]} </li>`
    }

    logHtml.innerHTML = "";
    for (let event of data.log) {
        if (!event) {
            break;
        }

        let eventItem = document.createElement('div');
        eventItem.innerText = getEventString(event);

        logHtml.appendChild(eventItem);
    }
}

function editListItem(e) {
    console.log("Sending PUT request.");

    let itemIndex = e.currentTarget.value;

    fetch("/api", { method: "PUT", 
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        body: new URLSearchParams({ name_input: nameInput.value,  index: itemIndex }) })
        .then(Result => { console.log(Result); JSON.parse(Result); })
        .then(data => {
            console.log(data.message);
            console.log("Data sent: " + data.received);
        })
        .catch(error => { console.log(error) });

    nameInput.value = "";
}

function deleteListItem(e) {
    console.log("Sending DELETE request.");

    let itemIndex = e.currentTarget.value;

    console.log(getAuthString());

    fetch("/api?" + new URLSearchParams({index: itemIndex}), { 
        method: "DELETE",
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        })
        .then(Result => JSON.parse(Result))
        .then(data => {
            console.log(data.message);
            console.log(`Data received: ${data.received}`);
        })
        .catch(error => { console.log(error); });
}

function editAdminItem(e) {
    console.log("Sending Admin PUT request.");

    let itemIndex = e.currentTarget.value;

    let userType = document.getElementsByName("user_type");
    let typeResult;

    for (let input of userType) {
        if (input.checked) {
            typeResult = input.value;
        }
    }

    console.log(userType);

    fetch("/api/admin", { method: "PUT", 
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        body: new URLSearchParams({ user_type: typeResult,  index: itemIndex }) })
        .then(Result => { console.log(Result); JSON.parse(Result.body); })
        .then(data => {
            console.log(data.message);
            console.log("Data sent: " + data.received);
        })
        .catch(error => { console.log(error) });

}

function deleteAdminItem(e) {
    console.log("Sending Admin DELETE request.");

    let itemIndex = e.currentTarget.value;

    fetch("/api/admin", { 
        method: "DELETE",
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        body: new URLSearchParams({index: itemIndex})
        })
        .then(Result => JSON.parse(Result.body))
        .then(data => {
            console.log(data.message);
            console.log(`Data received: ${data.received}`);
        })
        .catch(error => { console.log(error); });
}

const postBtn = document.getElementById("add_char_btn");

postBtn.addEventListener("click", (e) => {
    e.preventDefault();
    
    fetch("/api", { method: "POST", 
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        body: new URLSearchParams({ name_input: nameInput.value }) })
        .then(Result => JSON.parse(Result))
        .then(data => {
            console.log(data.message);
            console.log("Data sent: " + data.received);
        })
        .catch(error => { console.log(error) });

    nameInput.value = "";
});

const loginForm = document.getElementById("login_form");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(loginForm);
    
    var username = data.get("username");
    console.log(username);
    var password = data.get("password");
    console.log(password);
    fetch("/api/auth", { 
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(username + ":" + password)}`
        }})
        .then(Result => {
            if (Result.ok) {
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("password", password);
                console.log(getAuthString());
            }
        })
        .catch(error => { console.log(error) });
});

const adminForm = document.getElementById("admin_form");
adminForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(adminForm);

    console.log(data);

    let adminName = data.get("admin_name");
    console.log(adminName);
    let adminPass = data.get("admin_pass");
    console.log(adminPass);
    let userType = data.get("user_type");
    
    fetch("/api/admin", { method: "POST", 
        headers: {
            Authorization: `Basic ${getAuthString()}`
        },
        body: new URLSearchParams({ admin_name: adminName, admin_pass: adminPass, user_type: userType}) })
        .then(Result => JSON.parse(Result))
        .then(data => {
            console.log(data.message);
            console.log("Data sent: " + data.received);
        })
        .catch(error => { console.log(error) });
});

function getAuthString() {
    return btoa(sessionStorage.getItem("username") + ":" + sessionStorage.getItem("password"));
}

function getEventString(event) {
    let action = '';

    switch (event.action) {
        case 'POST':
            action = 'added';
            break;
        case 'PUT':
            action = 'modified';
            break;
        case 'DELETE':
            action = 'deleted'
    }

    let time = new Date();
    return `${time.toLocaleString()} ${event.user} ${action} ${event.item}`;
}