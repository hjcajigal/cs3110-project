// Dependencys
console.log("Server startup");
console.log("Node version: ", process.version);

const http = require("http");
const url = require("url");
const querystring = require('querystring'); 
const { arrayBuffer, json } = require("stream/consumers");
const crypto = require("crypto");
const fs = require("fs");
const { DatabaseSync } = require('node:sqlite');

console.log("Depedndencies loaded");

let users;

const charactersDb = new DatabaseSync('/var/www/db/characters.db');
const usersDb = new DatabaseSync('/var/www/db/users.db');

// charactersDb.exec('PRAGMA auto_vacuum = FULL');
// usersDb.exec('PRAGMA auto_vacuum = FULL');

// charactersDb.exec('CREATE TABLE IF NOT EXISTS characters (name TEXT); INSERT INTO characters ');

const getCharsAllStatement = charactersDb.prepare('SELECT name FROM characters');
const getCharIndexStatement = charactersDb.prepare('SELECT name FROM characters WHERE ROWID = ?');
const getCharNameStatement = charactersDb.prepare('SELECT name FROM characters WHERE name = ?');
const insertCharStatement = charactersDb.prepare('INSERT INTO characters VALUES (?)');
const updateCharStatement = charactersDb.prepare('UPDATE characters SET name = ?2 WHERE ROWID = ?1');
const deleteCharStatement = charactersDb.prepare('DELETE FROM characters WHERE ROWID = ?');
const vacuumCharsStatement = charactersDb.prepare('VACUUM');

const getUsersAllStatement = usersDb.prepare('SELECT username, type FROM users');
const getUserNameStatement = usersDb.prepare('SELECT * FROM users WHERE username = ?');
const getUsersDbLength = usersDb.prepare('SELECT COUNT(*) FROM users');
const insertUserStatement = usersDb.prepare('INSERT INTO users VALUES (?, ?, ?)');
const updateUserStatement = usersDb.prepare('UPDATE users SET type = ?2 WHERE ROWID = ?1');
const deleteUserStatement = usersDb.prepare('DELETE FROM users WHERE ROWID = ?');
const vacuumUsersStatement = usersDb.prepare('VACUUM');


function charArrayHelper(array) {
    let result = []
    for (let row of array) {
        result.push(row.name);
    }
    return result;
}

function getCharIndex(index) {
    let result = getCharIndexStatement.run(index);
    return result;
}

function getChars() {
    let array = getCharsAllStatement.all();
    return charArrayHelper(array);
}

function vaccuumeChars() {
    charactersDb.exec('VACCUUM ')
}

function getUsers() {
    return getUsersAllStatement.all();
}

function usersLength() {
    return getUsersDbLength.get()['COUNT(*)'];
}



console.log(getChars());
console.log(getCharIndex(1));
console.log(usersLength());


// fs.readFile("/var/www/users.json", function(err, data) { 
    
//     // Check for errors 
//     if (err) throw err; 

//     // Converting to JSON 
//     users = JSON.parse(data); 
// });


console.log(getUsers());

var characters = ["Larry", "Harry", "Mike"];
var sseClients = [];


function sha256(content) { 
    console.log(content);
    return crypto.createHash('sha256').update(content).digest('hex'); 
}


function parseBasicAuth(authHeader) {
    if (!authHeader || !authHeader.startsWith("Basic ")) return null;
    
    // Remove "Basic ", decode from Base64, and split by the colon
    const base64 = authHeader.split(" ")[1];
    console.log("b64", base64);
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    console.log("decoded", decoded);
    const [username, password] = decoded.split(":");
    
    console.log(username, password);

    return { username, password };
}

// function updateJson() {
//     console.log("update json");
//     fs.writeFile(
//     "/var/www/users.json",
//     JSON.stringify(users),
//     err => {
//         // Checking for errors 
//         if (err) throw err;

//         // Success 
//         console.log("Done writing");
//     });
//     console.log(JSON.stringify(users));
// }


const notifySSE = () => {
    const data = JSON.stringify({ characters: getChars(), users: getUsers() });
    sseClients.forEach((c) => {
        console.log("Sending data to client " + c.id);
        c.res.write(`data: ${data}\n\n`);
    })
}

const handleRequest = (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = parsedUrl.searchParams;

    const date = new Date();
    console.log("New request received on", date.toLocaleString());

    console.log(parsedUrl, "parsed url");
    console.log(queryParams, "query params");
    console.log(req.method, "method");

    var authType = "guest";


    let authHeader = req.headers.authorization;
    console.log("Authentication header:", authHeader);
    if (authHeader) {
        var { username, password } = parseBasicAuth(authHeader) ?? { username: null, password: null};
        console.log("Username:", username);
        console.log("Password:", password);
        
        let user = getUserNameStatement.get(username);

        if (user) {
            let hashedPass = sha256(password);
            console.log(hashedPass);
            if (hashedPass === user.password) {
                authType = user.type;
            }
        }

        // for (let user of users) {
        //     if (user.username === username) {
        //         let hashedPass = sha256(password);
        //         console.log(hashedPass);
        //         if (hashedPass === user.password) {
        //             authType = user.type;
        //         }

        //         break;
        //     }
        // } 

        console.log("Authorization type:", authType);
    }

    console.log("url", req.path);

    if (req.url === "/api/test") {
        console.log(characters)
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(getChars().toString());
    } else if (req.method === "GET" && req.url === "/api") {
        console.log("Processing GET request");
        console.log(queryParams);

        if (queryParams.entries().has("index")) {
            let character = getCharIndex(value);

            if (character) {
                res.writeHead(200, { "Content-Type": "application/json"});
                res.end(character)
            } else {
                res.writeHead(404, { "Content-Type": "application/json"});
                res.end("Character cannot be found");
            }
        } else {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(getChars()));
        }

    } else if (req.method === "GET" && req.url === "/api/sse") {
        console.log("Processing new SSE request");

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });

        console.log

        console.log("Sending data to new SSE client");
        console.log(getChars());
        res.write(`data: ${JSON.stringify({ characters: getChars(), users: getUsers() })}\n\n`);

        const clientId = Date.now();
        
        sseClients.push({id: clientId, res: res});

        req.on('close', () => {
            console.log(`${clientId} Connection closed`);
            sseClients = sseClients.filter(client => client.id !== clientId);
        });
    } else if (req.method === "POST" && req.url === "/api/auth") {
        console.log("Processing authentication request");
        let body = "";

        req.on("data", (chunk => {
            body += chunk.toString();
        }));

        req.on("end", () => {
            console.log(authType);            
          
                    if (authType !== "guest") {
                        console.log("Authentification completed");
                        res.writeHead(200, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({message: "Successful authentification"}));
                    } else {    
                        console.log("Authentification failed");
                        res.writeHead(401, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "Incorrect username or password" }));
                    }


        });
    } else if (req.url === "/api/admin") {
        if (authType !== "admin") {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify("Must be an admin to perform this action"));
        } else {
            if (req.method === "POST") {
                let body = "";

                req.on("data", (chunk) => {
                    body += chunk.toString();
                });

                req.on("end", () => {
                    let data = querystring.parse(body)

                    console.log("Received POST data", data);
                    
                    insertUserStatement.run(data.admin_name, sha256(data.admin_pass), data.user_type);
                    //users.push({ username: data.admin_name, password: sha256(data.admin_pass), type: data.user_type});
                    
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Character Added!", received: body }));

                    console.log(getUsers());
                    notifySSE();
                    //updateJson();
                });
            } else if (req.method === "PUT") {
                let body = "";
                req.on("data", (chunk) => { body += chunk.toString(); });
                req.on("end", () => {
                    let data = querystring.parse(body);
                    
                    console.log(data);

                    if (!data.index || !data.user_type) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "One or more required parameters not found"}))
                    } else if (data.index >= usersLength() || data.index < 0) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "Invalid index"}));
                    } else if (!data.user_type) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "No character name given"}));
                    } else {
                        updateUserStatement.run(data.index + 1, data.user_type);
                        //users[data.index].type = data.user_type;

                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Character Updated!", received: body}));
                        notifySSE();
                        //updateJson();
                    }
                });
            } else if (req.method === "DELETE") {
                let body = "";
                req.on("data", (chunk) => { body += chunk.toString(); });
                req.on("end", () => {
                    let data = querystring.parse(body);
                    
                    console.log(data);

                    if (!data.index) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "One or more required parameters not found"}))
                    } else if (data.index >= usersLength() || data.index < 0) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "Invalid index"}));
                    } else {
                        deleteUserStatement.run(Number(data.index) + 1);
                        vacuumUsersStatement.run();

                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "User deleted!", received: body}));
                        notifySSE();
                        //updateJson();
                    }
                });
            }
        }
    } else if (req.method === "POST" && req.url === "/api") {
        if (authType == 'guest') {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Must be signed in in order to perform this action" }));
            return;
        }
        
        console.log("Processing POST request")

        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            let data = querystring.parse(body)

            if (!data.name_input) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "No character name given" }));
            }

            console.log("Received POST data", data.name_input);

            insertCharStatement.run(data.name_input);
            
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Character Added!", received: data.name_input }));

            notifySSE();
        });
    } else if (req.method === "PUT") {
        if (authType == 'guest') {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Must be signed in in order to perform this action" }));
            return;
        }


        console.log("Processing PUT request");
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
            let data = querystring.parse(body);
            
            console.log(data);

            if (!data.index || !data.name_input) {
                res.writeHead(400, { "Content-Type": "application/json"});
                res.end(JSON.stringify({ message: "One or more required parameters not found"}))
            } else if (data.index >= getChars.length || data.index < 0) {
                res.writeHead(400, { "Content-Type": "application/json"});
                res.end(JSON.stringify({ message: "Invalid index"}));
            } else if (!data.name_input) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "No character name given"}));
            } else {
                updateCharStatement.run(data.index + 1, data.name_input);


                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Character Updated!", received: data.name_input}));
                notifySSE();
            }
        });
    } else if (req.method === "DELETE") {
        console.log(authType);
        if (authType === 'guest') {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Must be signed in in order to perform this action" }));
            return;
        }


        console.log("Processing DELETE request.");

        console.log(queryParams);

        for (const [param, value] of queryParams.entries()) {
            if (param === "index") {
                let character = getCharIndex(value);

                if (character) {
                    console.log(value + 1);
                    console.log(deleteCharStatement.run(Number(value) + 1));
                    console.log(vacuumCharsStatement.run());

                    res.writeHead(200, { "Content-Type": "application/json"});
                    res.end(JSON.stringify(character));
                    notifySSE();
                } else {
                    res.writeHead(404, { "Content-Type": "application/json"});
                    res.end(JSON.stringify({ message: "Character cannot be found" }));
                }
            } else {
                res.writeHead(404, { "Content-Type": "application/json"});
                res.end(JSON.stringify({ message:  "No such parameter exists" }));
            }
        }
        // res.writeHead(400, { "Content-Type": "application/json" });
        // res.end(JSON.stringify({ message: "No character name given"}));    
    }
};

const server = http.createServer(handleRequest);

server.listen(3000, () => {
    console.log("Server is running on port 3000...");
});

