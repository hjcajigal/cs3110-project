console.log("JS IS WORKING");

printbtn.addEventListener("click", (e) => {
    //Prevents the browser from trying to submit the form 
    e.preventDefault();
    print();
});

linamebtn.addEventListener("click", (e) => {
    //Prevents the browser from trying to submit the form 
    e.preventDefault();
    const nameInput = linameinput.value; 
    liiteminput.value = "";
    console.log(nameInput);
    
    linameoutput.innerText = nameInput;
});

litypebtn.addEventListener("click", (e) => {
    //Prevents the browser from trying to submit the form 
    e.preventDefault();
    let typeInput = document.getElementsByName("litype");
    let typeResult;

    for (let input of typeInput) {
        if (input.checked) {
            typeResult = input.value;
        }
    }

    let oldNode = document.getElementById("litypeoutput")
    let newNode = document.createElement(typeResult);
    newNode.setAttribute("id", "litypeoutput");
    newNode.replaceChildren(...oldNode.childNodes);
    oldNode.replaceWith(newNode);
});

liitembtn.addEventListener("click", (e) => {
    //Prevents the browser from trying to submit the form 
    e.preventDefault();
    let itemInput = liiteminput.value;
    liiteminput.value = "";
    console.log(itemInput);

    let listOutput = document.getElementById("litypeoutput")
    let newItem = document.createElement("li");
    newItem.classList.add("li-item");
    newItem.innerText = `${itemInput}`;
    newItem.addEventListener("click", listItemListener);
    listOutput.appendChild(newItem);
});

document.getElementsByClassName("li-item")[0].addEventListener("click", listItemListener);

function listItemListener(e) {
    e.preventDefault();
    console.log(e);
    this.remove();
}
