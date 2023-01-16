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


//Costruisce un grafo che ha meno archi dal multi-grafo iniziale, per la visualizzazione e valori limitati (value)
function reduceGraph(g) {
    var acc = [];

    let newGraph = g.emptyCopy();

    //taglio il valore dei nodi
    newGraph.forEachNode((node, attr) => {
        if (attr.value > maxVnode)
            newGraph.setNodeAttribute(node, "value", maxVnode);
    });

    //console.log('reduceGraph',graph);

    //inizializza i conteggi su tutti gli archi
    g.forEachEdge((edge, attr) => {
        g.setEdgeAttribute(edge, "count", 1);
        g.removeEdgeAttribute(edge,"count1");
        g.removeEdgeAttribute(edge,"count2");
        g.removeEdgeAttribute(edge,"merged1");
        g.removeEdgeAttribute(edge,"merged2");
    });

    //accorpo gli archi con le stesse origini e destinazioni
    acc = g.reduceEdges((acc, edge, attr) => {
        //confronto l'arco entrante con gli altri nell'accumulatore in teoria si mergia con uno solo di quelli
        //nell'accumulatore, non ci dovrebbero essere doppioni (VERIFICARE)
        let merged = false;
        //console.log(edge);

        acc.forEach((e) => {
            //console.log(edge, '<--???-->',e );

            //valori dell'arco che entra nel confronto
            let count1e = isNaN(g.getEdgeAttribute(e, "count1"))
                ? 0
                : g.getEdgeAttribute(e, "count1");
            let count2e = isNaN(g.getEdgeAttribute(e, "count2"))
                ? 0
                : g.getEdgeAttribute(e, "count2");
            let valuee = isNaN(g.getEdgeAttribute(e, "value"))
                ? 0
                : g.getEdgeAttribute(e, "value");

            //inizializza il conteggio che non è presente nel grafo originale
            //if (isNaN(g.getEdgeAttribute(e, "count")))
            //	g.setEdgeAttribute(e, "count", 1);

            //console.log('##',valuee,count1e,count2e,'##')

            if (
                g.source(e) == g.source(edge) &&
                g.target(e) == g.target(edge)
            ) {
                if (count1e == 0 && count2e == 0) count1e = 2;
                else count1e++;
                g.setEdgeAttribute(e, "count1", count1e);
                g.setEdgeAttribute(
                    e,
                    "count",
                    Number(count1e) + Number(count2e)
                );
                g.setEdgeAttribute(
                    e,
                    "value",
                    Number(attr.value) + Number(valuee) > maxVedge
                        ? maxVedge
                        : Number(attr.value) + Number(valuee)
                );
                //g.setEdgeAttribute(e, "label", "...");
                g.setEdgeAttribute(
                    e,
                    "label",
                    "[+]" +
                        g.getNodeAttribute(g.source(e), "label") +
                        "⇄" +
                        g.getNodeAttribute(g.target(e), "label")
                );

                //mi segno gli archi che sono stati mergiati
                let m1 = g.getEdgeAttribute(e, "merged1");
                let m2 = g.getEdgeAttribute(e, "merged2");
                if (m1 == undefined)
                    if (m2 == undefined) m1 = [e];
                    else m1 = [];

                g.setEdgeAttribute(e, "merged1", [...m1, edge]);

                //console.log(edge,'-m1->',e, count1e, count2e);
                merged = true;
            } else if (
                g.source(e) == g.target(edge) &&
                g.target(e) == g.source(edge)
            ) {
                if (count2e == 0 && count1e == 0) {
                    count2e = 1;
                    count1e = 1;
                } else count2e++;
                g.setEdgeAttribute(e, "count2", count2e);
                g.setEdgeAttribute(e, "count1", count1e);
                g.setEdgeAttribute(
                    e,
                    "count",
                    Number(count1e) + Number(count2e)
                );
                g.setEdgeAttribute(
                    e,
                    "value",
                    Number(attr.value) + Number(valuee) > maxEdgeValue
                        ? maxEdgeValue
                        : Number(attr.value) + Number(valuee)
                );
                //g.setEdgeAttribute(e, "label", "...");
                g.setEdgeAttribute(
                    e,
                    "label",
                    "[+]" +
                        g.getNodeAttribute(g.source(e), "label") +
                        "⇄" +
                        g.getNodeAttribute(g.target(e), "label")
                );

                //mi segno gli archi che sono stati mergiati
                let m1 = g.getEdgeAttribute(e, "merged1");
                let m2 = g.getEdgeAttribute(e, "merged2");
                if (m2 == undefined) m2 = [];
                if (m1 == undefined) {
                    m1 = [];
                    g.setEdgeAttribute(e, "merged1", [...m1, e]);
                }
                g.setEdgeAttribute(e, "merged2", [...m2, edge]);

                //console.log(edge,'-m2->',e, count1e, count2e);
                merged = true;
            }
        });
        if (!merged) {
            g.setEdgeAttribute(
                edge,
                "label",
                "[" +
                    g.getEdgeAttribute(edge, "label") +
                    "]" +
                    g.getNodeAttribute(g.source(edge), "label") +
                    "➜" +
                    g.getNodeAttribute(g.target(edge), "label")
            );
            acc = [...acc, edge];
        }

        return acc;
    }, acc);
    
    //console.log(acc);
    
    acc.forEach((e) => {
        //newGraph.addEdgeWithKey(
        newGraph.addUndirectedEdgeWithKey(
            g.source(e) + "-->" + g.target(e),
            g.source(e),
            g.target(e),
            g.getEdgeAttributes(e)
        );
    });

    console.log("reduced graph ",newGraph);
    return newGraph;
}

export {  json2Graph, reduceGraph, maxVedge, maxVnode, minVedge, minVnode  }