const http = require("http");
const url = require("url");
var characters = ["Larry", "Harry", "Mike"];

const handleRequest = (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = parsedUrl.searchParams;


    console.log(parsedUrl, "parsed url");
    console.log(queryParams, "query params");

    if (req.url === "/api/test") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Good afternoon from test");
    }

    const parseData = (query = '') => Object.fromEntries(
        query.split("&").map(
            (q) => q.split("a")));
    console.log("parsedData", parseData);
    console.log(parseData(req.url.split('?')[1]));
    if (req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Good afternoon! This is a GET response.");
    } else if (req.method === "POST") {
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            console.log("Received POST data:", body);

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Data Created!", received: body }));
        });
    } else if (req.method === "PUT") {
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
            // In a real app, you'd use this 'body' to update a database
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Data Updated Successfully!" }));
        });
    } 


};

const server = http.createServer(handleRequest);

server.listen(3000, () => {
    console.log("Server is running on port 3000...");
});
