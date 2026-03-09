const http = require("http");
const url = require("url");
const querystring = require('querystring'); 
const { arrayBuffer } = require("stream/consumers");

var characters = ["Larry", "Harry", "Mike"];
var sseClients = [];

const notifySSE = () => {
    const data = JSON.stringify(characters);
    sseClients.forEach((c) => {
        console.log("Sending data to client " + c.id);
        c.res.write(`data: ${data}\n\n`);
    })
}

const handleRequest = (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = parsedUrl.searchParams;

    console.log(parsedUrl, "parsed url");
    console.log(queryParams, "query params");

    if (req.url === "/api/test") {
        console.log(characters)
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(characters.toString());

    } else if (req.method === "GET" && req.url === "/api") {
        console.log("Processing GET request");
        console.log(queryParams);

        for (const [param, value] of queryParams.entries()) {
            console.log(param)
            if (param === "index") {
                let character = characters[value];

                if (character) {
                    res.writeHead(200, { "Content-Type": "application/json"});
                    res.end(character)
                } else {
                    res.writeHead(404, { "Content-Type": "application/json"});
                    res.end("Character cannot be found");
                }
            } else {
                res.writeHead(404, { "Content-Type": "application/json"});
                res.end({ message: "No such parameter exists" });
            }
        }

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(characters));
    } else if (req.method === "GET" && req.url === "/api/sse") {
        console.log("Processing new SSE request");

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });

        console.log("Sending data to new client");
        res.write(`data: ${JSON.stringify(characters)}\n\n`);

        const clientId = Date.now();
        
        sseClients.push({id: clientId, res: res});

        req.on('close', () => {
            console.log(`${clientId} Connection closed`);
            sseClients = sseClients.filter(client => client.id !== clientId);
        });

    } else if (req.method === "POST") {
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
            }
        });
        notifySSE();
    } else if (req.method === "DELETE") {
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
    notifySSE();
};

const server = http.createServer(handleRequest);

server.listen(3000, () => {
    console.log("Server is running on port 3000...");
});
