import { worldH, worldW } from './variables.js';
import { randrange } from './utils.js';

let maxVnode = -Infinity; //massimo valore contenuto in un nodo
let maxVedge = 0;         //massimo valore contenuto in un arco
let minVnode = Infinity; //minimo valore contenuto in un nodo
let minVedge = Infinity; //minimo valore contenuto in un arco

// trasforma un json { "nodes": [], "links": [] } in un grafo con graphology
const json2Graph = (j) => {
    //graph = new MultiDirectedGraph();
    let graph = new graphology.MultiUndirectedGraph();
    j.nodes.forEach((node) => {
        if (node.value == undefined) node.value = 1; //default

        //assegno una posizione iniziale al nodo
        node.x = randrange(0, worldW); 
        node.y = randrange(0, worldH);

        graph.addNode(node.id, node);
        if (maxVnode < Number(node.value)) maxVnode = Number(node.value);
        if (minVnode > Number(node.value)) minVnode = Number(node.value);
    });
    j.links.forEach((link) => {
        if (link.value == undefined) link.value = 1; //default
        //qui non imposto l'id dell'arco perché gli archi sul json non hanno id
        //(nel caso usare : addEdgeWithKey) è stato usato per memorizzare l'uri completa dell proprietà
        graph.addEdge(link.source, link.target, link);
        maxVedge += Number(link.value); //qui il massimo è la somma visto che i valori degli archi si possono sommare
        minVedge = 1
    });

    console.log("minVnode:", minVnode, "minVedge:", minVedge, "maxVnode:", maxVnode, "maxVedge:", maxVedge);

    return graph;
}

export {  json2Graph, maxVedge, maxVnode, minVedge, minVnode  }