# 1. Get all nodes that are connected to the genes in the list
WITH [{id: "821", label: "Gene"}, {id: "3309", label: "Gene"}, {id: "811", label: "Gene"}] AS nodeList, ["821", "3309", "811"] as otherNodes
UNWIND nodeList AS idn
MATCH (n)-[r]-(other)
WHERE idn.label in labels(n) and n.id = idn.id and other.id in otherNodes
RETURN n, r, other