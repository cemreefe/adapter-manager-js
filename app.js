// Immutable list of available ends
const availableEnds = [
    'USB-A Male', 'USB-A Female', 
    'USB-C Male', 'USB-C Female', 
    'HDMI Male', 'HDMI Female', 
    'VGA Male', 'VGA Female', 
    'Ethernet Male', 'Ethernet Female', 
    '3.5mm Jack Male', '3.5mm Jack Female'
    //TBC
];

// Map of valid pairings
const validPairings = {
    'USB-A Male': ['USB-A Female'],
    'USB-A Female': ['USB-A Male'],
    'USB-C Male': ['USB-C Female', 'Thunderbolt Female'],
    'USB-C Female': ['USB-C Male', 'Thunderbolt Male'],
    'HDMI Male': ['HDMI Female'],
    'HDMI Female': ['HDMI Male'],
    'VGA Male': ['VGA Female'],
    'VGA Female': ['VGA Male'],
    'Ethernet Male': ['Ethernet Female'],
    'Ethernet Female': ['Ethernet Male'],
    '3.5mm Jack Male': ['3.5mm Jack Female'],
    '3.5mm Jack Female': ['3.5mm Jack Male'],
    'Thunderbolt Male': ['USB-C Female', 'Thunderbolt Female'],
    'Thunderbolt Female': ['USB-C Male', 'Thunderbolt Male']
    //TBC
};


// List to store user adapters
let adapters = [];

// Function to initialize the app
function init() {
    populateEndOptions('end1');
    populateEndOptions('end2');
    populateEndOptions('merge-end1');
    populateEndOptions('merge-end2');
    showListView();
}

// Function to populate the end options in the create form
function populateEndOptions(selectId) {
    const select = document.getElementById(selectId);
    availableEnds.forEach(end => {
        let option = document.createElement('option');
        option.value = end;
        option.textContent = end;
        select.appendChild(option);
    });
}

// Function to display the list view
function showListView() {
    document.getElementById('adapter-list-view').style.display = 'block';
    document.getElementById('adapter-details-view').style.display = 'none';
    document.getElementById('create-adapter-view').style.display = 'none';
    displayAdapterList();
}

// Function to display the adapter list
function displayAdapterList() {
    const adapterList = document.getElementById('adapter-list');
    adapterList.innerHTML = '';
    adapters.forEach((adapter, index) => {
        let listItem = document.createElement('input');
        let val = `${adapter.end1} - ${adapter.end2}`
        listItem.setAttribute("type", "button");
        listItem.setAttribute("value", val);
        listItem.textContent = val;
        listItem.onclick = () => showAdapterDetails(index);
        adapterList.appendChild(listItem);
    });
}

// Function to display the details view
function showAdapterDetails(index) {
    const adapter = adapters[index];
    document.getElementById('adapter-ends').textContent = `End 1: ${adapter.end1}, End 2: ${adapter.end2}`;
    document.getElementById('adapter-list-view').style.display = 'none';
    document.getElementById('adapter-details-view').style.display = 'block';
}

// Function to display the create form
function showCreateForm() {
    document.getElementById('adapter-list-view').style.display = 'none';
    document.getElementById('adapter-details-view').style.display = 'none';
    document.getElementById('create-adapter-view').style.display = 'block';
}

// Function to handle the creation of a new adapter
function createAdapter(event) {
    
    event.preventDefault();
    const end1 = document.getElementById('end1').value;
    const end2 = document.getElementById('end2').value;
    const newAdapter = { end1, end2 };
    adapters.push(newAdapter);
    showListView();
}

// Function to display the merge path to the user with two entries per line
function displayMergePath(path) {
    if (path) {
        const mergePathElement = document.getElementById('merge-result');
        const formattedPath = path.reduce((acc, curr, index) => {
            if (index % 2 === 0) {
                return [...acc, [curr]];
            } else {
                acc[acc.length - 1].push(curr);
                return acc;
            }
        }, []).map(pair => pair.join(" - ")).join("<br>");
        mergePathElement.innerHTML = `Path:<br>${formattedPath}`;
    } else {
        const mergePathElement = document.getElementById('merge-result');
        mergePathElement.textContent = "No valid merge found.";
    }
}

// Function to check if two ends can be merged and display the result to the user
function checkMerge(event) {
    event.preventDefault();
    const end1 = document.getElementById('merge-end1').value;
    const end2 = document.getElementById('merge-end2').value;
    const path = canMerge(end1, end2);
    displayMergePath(path);
}

// Adjacency list representing the graph
const graph = {};

// Build the graph based on valid pairings
function buildGraph() {
    availableEnds.forEach(end => {
        graph[end] = [];
        for (let otherEnd of validPairings[end]) {
            graph[end].push(otherEnd);
        }
    });
    for (let adapter of adapters) {
        if (!graph[adapter.end1]){
            graph[adapter.end1] = []
        }
        if (!graph[adapter.end1].includes(adapter.end2)){
            graph[adapter.end1].push(adapter.end2);
        }
        if (!graph[adapter.end2]){
            graph[adapter.end2] = []
        }
        if (!graph[adapter.end2].includes(adapter.end1)){
            graph[adapter.end2].push(adapter.end1);
        }
    }
}

// Perform depth-first search to find a path from source to target
function dfs(source, target, visited, path) {
    path.push(source);
    visited.add(source);
    if (source === target) {
        return true;
    }

    if (graph[source]){
        for (let neighbor of graph[source]) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor, target, visited, path)) {
                    return true;
                }
            }
        }
    }

    path.pop();
    return false;
}

// Function to check if two ends can be merged and return the path if found
function canMerge(end1, end2) {
    buildGraph();

    const visited = new Set();
    const path = [];
    if (!graph[end1] || !graph[end2]) {
        return false;
    }
    if (dfs(end1, end2, visited, path)) {
        console.log("Path found:", path.join(" -> "));
        return path;
    } else {
        console.log("No valid merge found.");
        return null;
    }
}

// Function to download adapters as a JSON file
function downloadAdapters() {
    const filename = "adapters.json";
    const json = JSON.stringify(adapters);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Function to upload adapters from a JSON file
function uploadAdapters(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;
        try {
            const newAdapters = JSON.parse(contents);
            adapters = newAdapters;
            console.log("Adapters uploaded:", adapters);
            // Update the UI as needed
            showListView();
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    };
    reader.readAsText(file);
}


// Initialize the app
init();


