const { createMcpHandler } = require("mcp-handler");

const handler = createMcpHandler((server) => {
    console.log("Methods on server:");
    console.log(Object.keys(server));
    console.log("Prototype methods:");
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(server)));
});

// simulate initialization
// mcp-handler initializes lazily, let's just trigger it.
// Actually createMcpHandler returns a function. We can just mock a request.
handler({ url: "http://localhost/api/mcp", method: "GET" }).catch(e => console.error(e));
