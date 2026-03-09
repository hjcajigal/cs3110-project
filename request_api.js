const htmlList = document.getElementById("list");
const nameInput = document.getElementById("name_input");

console.log("Establishing SSE connection to server");
const serverEvents = new EventSource("/api/sse");

serverEvents.onopen = () => {
    console.log("SSE connection to server successful.");
}

serverEvents.onerror = () => {
  console.log("An error occurred while attempting to connect.");
};

serverEvents.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received message from server.");
    console.log("Data received: ", data);

    htmlList.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        let listItem = document.createElement("li");
        listItem.innerText = `${data[i]} `;

        let editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        editBtn.value = i;

        editBtn.addEventListener("click", editListItem);

        let delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.value = i;
        
        delBtn.addEventListener("click", deleteListItem);

        listItem.appendChild(editBtn);
        listItem.appendChild(delBtn);

        // listItem.innerHTML = `${data[i]} <button name="itemEdit${i}" value="${i}">Edit</button> <button name="itemDelete${i}" value="${i}">Delete</button>`;
        htmlList.appendChild(listItem);

        // htmlList.innerHTML += `<li id="item${i}">${data[i]} </li>`
    }
}

function editListItem(e) {
    console.log("Sending PUT request.");

    let itemIndex = e.currentTarget.value;

    fetch("/api", { method: "PUT", body: new URLSearchParams({ name_input: nameInput.value,  index: itemIndex }) })
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

    fetch("/api?" + new URLSearchParams({index: itemIndex}), { method: "DELETE" })
        .then(Result => JSON.parse(Result))
        .then(data => {
            console.log(data.message);
            console.log(`Data received: ${data.received}`);
        })
        .catch(error => { console.log(error); });
}

const postBtn = document.getElementById("add_char_btn");

postBtn.addEventListener("click", (e) => {
    e.preventDefault();
    
    fetch("/api", { method: "POST", body: new URLSearchParams({ name_input: nameInput.value }) })
        .then(Result => JSON.parse(Result))
        .then(data => {
            console.log(data.message);
            console.log("Data sent: " + data.received);
        })
        .catch(error => { console.log(error) });

    nameInput.value = "";
});

/* fetch("/api", { method: "GET" })
    .then(Result => Result.json())
    .then(data => {
        console.log("Received items");
        
        
    })
    .catch(errorMsg => { console.log(errorMsg); });  */