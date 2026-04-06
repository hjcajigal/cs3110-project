const http = require("http");
const url = require("url");
const querystring = require('querystring'); 
const { arrayBuffer, json } = require("stream/consumers");
const crypto = require("crypto");
const fs = require("fs");

let users;

fs.readFile("/var/www/users.json", function(err, data) { 
    
    // Check for errors 
    if (err) throw err; 

    // Converting to JSON 
    users = JSON.parse(data); 
});


console.log(users);

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

function updateJson() {
    console.log("update json");
    fs.writeFile(
    "/var/www/users.json",
    JSON.stringify(users),
    err => {
        // Checking for errors 
        if (err) throw err;

        // Success 
        console.log("Done writing");
    });
    console.log(JSON.stringify(users));
}


const notifySSE = () => {
    const data = JSON.stringify({ characters, users });
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
        
        for (let user of users) {
            if (user.username === username) {
                let hashedPass = sha256(password);
                console.log(hashedPass);
                if (hashedPass === user.password) {
                    authType = user.type;
                }

                break;
            }
        } 

        console.log("Authorization type:", authType);
    }

    console.log("url", req.path);

    if (req.url === "/api/test") {
        console.log(characters)
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(characters.toString());
    } else if (req.method === "GET" && req.url === "/api") {
        console.log("Processing GET request");
        console.log(queryParams);

        if (queryParams.entries().has("index")) {
            let character = characters[value];

            if (character) {
                res.writeHead(200, { "Content-Type": "application/json"});
                res.end(character)
            } else {
                res.writeHead(404, { "Content-Type": "application/json"});
                res.end("Character cannot be found");
            }
        } else {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(characters));
        }

    } else if (req.method === "GET" && req.url === "/api/sse") {
        console.log("Processing new SSE request");

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });

        console.log("Sending data to new SSE client");
        res.write(`data: ${JSON.stringify({ characters, users })}\n\n`);

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

                    users.push({ username: data.admin_name, password: sha256(data.admin_pass), type: data.user_type});
                    
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Character Added!", received: body }));

                    console.log(users);
                    notifySSE();
                    updateJson();
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
                    } else if (data.index >= users.length || data.index < 0) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "Invalid index"}));
                    } else if (!data.user_type) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "No character name given"}));
                    } else {
                        users[data.index].type = data.user_type;


                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Character Updated!", received: body}));
                        notifySSE();
                        updateJson();
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
                    } else if (data.index >= users.length || data.index < 0) {
                        res.writeHead(400, { "Content-Type": "application/json"});
                        res.end(JSON.stringify({ message: "Invalid index"}));
                    } else {
                        users.splice(data.index, 1);

                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "User deleted!", received: body}));
                        notifySSE();
                        updateJson();
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

            characters.push(data.name_input);
            
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
            } else if (data.index >= characters.length || data.index < 0) {
                res.writeHead(400, { "Content-Type": "application/json"});
                res.end(JSON.stringify({ message: "Invalid index"}));
            } else if (!data.name_input) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "No character name given"}));
            } else {
                characters[data.index] = data.name_input;


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
            console.log(param)
            if (param === "index") {
                let character = characters[value];

                if (character) {
                    characters.splice(value, 1);
                
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

